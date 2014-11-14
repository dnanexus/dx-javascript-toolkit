# AWS Constraint
MAX_PARTS = 10000

class FileUpload
  # A signature is in the form
  # <File size bytes> <Modified timestamp ms> <Value 0 or 1 indicating to compress> <chunk_size in bytes>
  # <local_file_name>
  #
  # We are using the same signature as the upload agent, but it would be ideal to storage the part size separate from
  # the signature so we could resume partial uploads with different part sizes than our native part size. This would
  # allow for seamless transition between the upload agent and the web uploader without having to specify a part size
  # for the upload agent.
  #
  computeSignature: (file, partSize) ->
    [file.size, file.lastModifiedDate.getTime(), 0, partSize, file.name].join(" ")

  #
  # options:
  #   folder: The folder to place the file in
  #   tags: An array of tags
  #   properties: An object literal with the properties for the object
  ##
  createFile: (file, api, partSize, projectID, options = {}) ->
    properties = $.extend(options.properties, {
      ".system-fileSignature": @computeSignature(file, partSize)
    })

    newFileOptions =
      folder: options.folder
      name: file.name
      project: projectID
      properties: properties

    if options.tags?.length > 0
      newFileOptions.tags = options.tags

    api.call("file", "new", newFileOptions).then((resp) ->
      {
        fileID: resp.id
      }
    )

  findOrCreateFile: (file, api, partSize, projectID, options = {}) ->
    searchCriteria =
      class: "file"
      state: "open"
      describe: true
      properties:
        ".system-fileSignature": @computeSignature(file, partSize)
      scope:
        project: projectID
        folder: options.folder

    makeNewFile = () =>
      @createFile(file, api, partSize, projectID, options)

    onSearchSuccess = (data) ->
      if data.results.length == 1
        return {
          fileID: data.results[0].id
          parts: data.results[0].describe.parts
        }
      else
        makeNewFile()

    onSearchFailure = () ->
      makeNewFile()

    api.call("system", "findDataObjects", searchCriteria).then(onSearchSuccess, onSearchFailure)

  ###
  # options:
  #   # Required
  #   file: The file to upload
  #   fileCreationPool: A ResourcePool for creating the files
  #   workerPool: A ResourcePool of web workers for MD5 computation
  #   uploadPool: A ResourcePool of upload tokens, for managing upload concurrency
  #   api: The API bindings to make API calls
  #   projectID: The project to upload the file to
  #
  #   # Optional
  #   folder: The folder to upload the file into. Default: "/"
  #   partSize: The size of each part, in bytes. Default: 10485760
  #   tags: An array of strings that will be added as tags on all of the uploaded files
  #   properties: An object literal which will populate the properties of all uploaded files.
  ###
  constructor: (@file, options = {}) ->
    options = $.extend({
      folder: "/"
    }, options)

    for key in ["folder", "partSize", "fileCreationPool", "workerPool", "uploadPool", "api", "projectID"]
      if !options[key]?
        throw new Error("Required parameter #{key} is not specified")
      this[key] = options[key]

    # Make sure we do not exceed MAX_PARTS
    @partSize = Math.max(Math.ceil(@file.size / MAX_PARTS), @partSize)

    @_uploadProgress = $.Deferred()
    @_checksumProgress = $.Deferred()
    @_closingProgress = $.Deferred()

    # All open API calls
    @_uploadCalls = {}

    @_uploadsDone = 0
    @_bytesUploaded = 0
    @_bytesResumed = 0

    @_aborted = false
    @_closing = false
    @_closed = false

    @numParts = Math.max(1, Math.ceil(@file.size / @partSize))

    @uploadStartedAt = null

    @_checksumQueue = []
    @_uploadQueue = []

    @_parts = []

    # Maps part index to the amount of data upload for that part
    @_partUploadProgress = []

    # Find the file to resume, or create a new file
    fileCreationOptions =
      folder: @folder
      tags: options.tags
      properties: options.properties

    @fileCreationStatus = $.Deferred()

    @fileCreationPool.acquire().done((createFileToken) =>
      FileUpload::findOrCreateFile(file, @api, @partSize, @projectID, fileCreationOptions).done((data) =>
        existingParts = data.parts ? {}
        @fileID = data.fileID

        for i in [0...@numParts]
          start = @partSize * i
          part =
            index: i + 1
            start: start
            stop: Math.min(@file.size, start + @partSize)

          @_parts.push(part)

          if existingParts[i+1]?.state == "complete"
            @_uploadsDone += 1
            @_bytesResumed += part.stop - part.start
          else
            @_checksumQueue.push(part)

        @_onUploadProgress()
        @fileCreationStatus.resolve(@fileID)
      ).fail((error) =>
        @fileCreationStatus.reject(error)
      ).always(() =>
        @fileCreationPool.release(createFileToken)
      )
    )

  _computeChecksums: () ->
    totalChecksums = @_checksumQueue.length
    checksumsDone = 0

    while @_checksumQueue.length > 0
      part = @_checksumQueue.shift()

      # Begin computing MD5s
      do (part) =>
        @workerPool.acquire().done((worker) =>
          if @_aborted
            @workerPool.release(worker)
            return

          # Get the file slicer, and create the web worker to compute the MD5 checksum
          slicer = @file.slice ? @file.webkitSlice ? @file.mozSlice
          slice = slicer.call(@file, part.start, part.stop)

          part.slice = slice

          worker.computeMD5(slice).done((md5) =>
            part.md5 = md5
            @_uploadQueue.push(part)
            @_doUpload()
            @workerPool.release(worker)
            checksumsDone += 1

            # Notify listeners
            data =
              partsTotal: totalChecksums
              partsDone: checksumsDone

            if totalChecksums == checksumsDone
              @_checksumProgress.resolve(data)
            else
              @_checksumProgress.notify(data)
              @_computeChecksums()
          ).fail((error) ->
            # TODO: Notify client
            console.error("Error computing MD5 checksum", error)
          )
        )

  _closeFile: () ->
    return if @_closing || @_closed || @_aborted
    @_closing = true

    doCloseFile = () =>
      # Verify that all the parts have been uploaded
      @api.call(@fileID, "describe").done((data) =>
        ready = true
        for partID, part of data.parts
          if part.state != "complete"
            ready = false
            break

        if ready
          @api.call(@fileID, "close").done(() =>
            @_closing = false
            @_closed = true
            @_closingProgress.resolve()
          )

        else
          setTimeout(doCloseFile, 1000)
      )

    doCloseFile()

  _onUploadProgress: (part, data, done = false) =>
    if data?
      @_partUploadProgress[part.index] = data.loaded

    bytesInProgress = 0
    for index, loaded of @_partUploadProgress
      bytesInProgress += loaded

    progressData =
      bytesTotal: @file.size,
      bytesUploaded: @_bytesUploaded + bytesInProgress
      bytesDone: @_bytesResumed + @_bytesUploaded + bytesInProgress

    if done
      @_uploadProgress.resolve(progressData)
    else
      @_uploadProgress.notify(progressData)

  _doUpload: () ->
    # If we're all done, close the file
    if @_uploadsDone == @numParts && @_bytesUploaded + @_bytesResumed == @file.size
      @_closeFile()
      return

    if @_uploadQueue.length > 0
      @uploadPool.acquire().done((token) =>
        if @_uploadQueue.length == 0 || @_aborted
          @uploadPool.release(token)
          return

        part = @_uploadQueue.shift()

        # Begin tracking upload progress for this part, and make the API call
        @_partUploadProgress[part.index] = 0

        @uploadStartedAt = Date.now()
        call = @api.uploadFilePart(@fileID, part.index, part.slice, part.md5)
        @_uploadCalls[part.index] = call

        # Get real time upload progress
        call.progress((data) =>
          @_onUploadProgress(part, data)
        )

        # TODO: ERROR HANDLING
        onUploadDone = () =>
          delete(@_uploadCalls[part.index])
          if token?
            @uploadPool.release(token)
            token = null

          @_doUpload()

        abortPart = () =>
          @_uploadQueue.unshift(part)
          @_partUploadProgress[part.index] = 0
          @_onUploadProgress(part)
          onUploadDone()

        # Add our own abort handling
        origAbort = call.abort
        call.abort = () =>
          origAbort.call(call)
          abortPart()

        # Compute the total bytes uploaded, and report it to the user.
        call.done(() =>
          @_uploadsDone += 1
          @_bytesUploaded += part.stop - part.start
          delete(@_partUploadProgress[part.index])

          @_onUploadProgress(part, null, @_uploadsDone == @numParts)
        )

        call.always(onUploadDone)
      )

  monitorChecksumProgress: () ->
    return @_checksumProgress.promise()

  monitorUploadProgress: () ->
    return @_uploadProgress.promise()

  monitorFileClosingProgress: () ->
    return @_closingProgress.promise()

  abort: () ->
    return $.Deferred().resolve(@fileID) if @_aborted
    return $.Deferred().reject({reason: "File Closed"}) if @_closed
    @_aborted = true

    @_uploadQueue = []
    for index, apiCall of @_uploadCalls
      apiCall.abort()
    @_uploadsCalls = {}

    @api.call(@projectID, "removeObjects", {objects: [@fileID]}).then(() =>
      @_uploadProgress.reject()
      return @fileID
    )

  pause: () ->
    for index, apiCall of @_uploadCalls
      apiCall.abort()

  resume: () ->
    @_computeChecksums()
    @_doUpload()

  start: () ->
    @fileCreationStatus.done(() =>
      @_computeChecksums()
      @_doUpload()
    )

  ###
    Reads length bytes from the file, starting at offset. This is useful for clients who wish
    to perform some validation based on a small part of the file, typically the header.

    file: An HTML5 File object
    offset: The byte offset into the file, 0 based
    length: The number of bytes to read from the file, starting at offset.

    Returns a deferred object which will be resolved with an ArrayBuffer. Note, if offset is outside the file, the returned ArrayBuffer
    will be empty. Also if offset + length is greater than the file size, the returned ArrayBuffer will have a byteLength less than the 
    requested length
  ###
  readBytes: (offset, length) ->
    alert("readBytes not yet supported")

module.exports = FileUpload
