# TODO: Abort, Cancel, Pause, Resume, Tags, Properties

Api = require('../api.coffee')
FileUpload = require('./file_upload.coffee')
MD5Worker = require('./md5_worker.coffee')
ResourcePool = require('../common/resource_pool.coffee')

class Upload
  ###
    Creates a new upload instance

    authToken: The auth token which grants access to the DNAnexus platform [required]
    files: Either an array of files, or an array of objects with each object having a key "file" and a key "options". Supported
           options are "folder", "properties", and "tags"

           NOTE: Tags and properties will not be applied to resumed uploads. Resumed uploads will keep their original tags
                 and properties.
           tags: An array of strings that will be added as tags on all of the uploaded files
           properties: An object literal which will populate the properties of all uploaded files.

    options:
      projectID: The ID of the project to upload the files into. [required]
      folder: The folder to upload the files into, inside the project specified by projectID.
              Optional, default: "/"
      apiServer: The host API server to use. Default: {host: "api.dnanexus.com", proto: https"}
      partSize: The chunk size for the uploads. Default: 10485760 (10MB)

      minimumPartSize: Minimum part size in bytes, applied to all parts except the last. Default: 5242880 (5 MiB)
      maximumPartSize: Maximum part size in bytes. Default: 5368709120 (5 GiB)
      maximumFileSize: Maximum overall size for a file in bytes. Default: 5497558138880 (5 TiB)
      maximumNumParts: The maximum number of parts that may be uploaded. Default: 10000
      emptyLastPartAllowed: If true, there must be at least one part but it may be zero bytes. If false,
                            there may be no parts, but the minimum last part size is 1. Default: true

      sparkMD5Src: The url/path to the sparkMD5 library. [required]

      checksumConcurrency: How many web workers to create to compute MD5s. Default: 10
      uploadConcurrency: The number of concurrent uploads to perform. Default: 10


  ###
  constructor: (@_authToken, @files, options = {}) ->
    throw new Error("projectID must be specified") unless options.projectID?.length > 0
    throw new Error("sparkMD5Src must be specified") unless options.sparkMD5Src?.length > 0

    # The following defaults are for AWS
    @minimumPartSize = options.minimumPartSize ? 5242880 # 5 MiB
    @maximumPartSize = options.maximumPartSize ? 5368709120 # 5 GiB
    @maximumFileSize = options.maximumFileSize ? 5497558138880 # 5 TiB
    @maximumNumParts = options.maxmimumNumParts ? 10000
    @emptyLastPartAllowed = options.emptyLastPartAllowed ? true

    @partSize = options.partSize ? Math.min(@maximumPartSize, 10485760)
    @folder = options.folder ? "/"

    checksumConcurrency = options.checksumConcurrency ? 10
    @uploadConcurrency = options.uploadConcurrency ? 10

    @projectID = options.projectID
    @api = new Api(@_authToken, options)

    @workers = (new MD5Worker(options.sparkMD5Src) for i in [0...checksumConcurrency])
    @workerPool = new ResourcePool(@workers)

    uploadResources = ("UploadToken #{i}" for i in [0...@uploadConcurrency])
    @uploadPool = new ResourcePool(uploadResources)
    @fileCreationPool = new ResourcePool("FileCreateToken #{i}" for i in [0...@uploadConcurrency])

  ###
    Begins the upload. Returns a deferred object which is resolved with an array of FileUpload objects. Rejects the deferred with an
    error object if any errors occur in starting the uploads.
  ###
  start: () =>
    status = $.Deferred()
    @uploads = []

    defaultUploadOptions =
      partSize: @partSize
      minimumPartSize: @minimumPartSize
      maximumPartSize: @maximumPartSize
      maximumFileSize: @maximumFileSize
      maximumNumParts: @maximumNumParts
      emptyLastPartAllowed: @emptyLastPartAllowed
      workerPool: @workerPool
      uploadPool: @uploadPool
      fileCreationPool: @fileCreationPool
      api: @api
      projectID: @projectID
      folder: @folder

    for file, i in @files
      if $.isPlainObject(file) && file.file? && file.options?
        fileToUpload = file.file
        uploadOptions = $.extend(defaultUploadOptions, file.options)
      else
        fileToUpload = file
        uploadOptions = defaultUploadOptions

      @uploads[i] = new FileUpload(fileToUpload, uploadOptions)

    startUpload = (index) =>
      upload = @uploads[index]
      upload.start()

      if index == @uploads.length - 1
        status.resolve(@uploads)
      else
        startUpload(index + 1)

    # Start the uploads in file order after checking they can be uploaded
    startUpload(0)

    # TODO: HANDLE FAILURES

    return status

  ###
    Aborts all incomplete uploads, and deletes the partial files. Returns a deferred object which is resolved with the IDs of the files
    that were deleted.
  ###
  abort: () ->
    @fileCreationPool.close()
    @workerPool.close()
    @uploadPool.close()

    @fileCreationPool.clear()
    @workerPool.clear()
    @uploadPool.clear()

    status = $.Deferred()
    count = 0
    aborted = []

    for upload in @uploads
      upload.abort().done((fileID) ->
        aborted.push(fileID)
      ).fail((error) ->
        if error?.reason != "File Closed"
          status.reject(error)
      ).always(() =>
        if ++count == @uploads.length
          status.resolve(aborted)
      )

    return status

  ###
  # Cleans up the upload and destroys all resources
  ###
  destroy: () ->
    # Destroy the web workers
    worker.terminate() for worker in @workers

    @workerPool.close()
    @uploadPool.close()

    @workerPool.clear()
    @uploadPool.clear()

  ###
    Pauses all uploads. No new checksums will be computed, no new upload parts will begin, and all parts currently being uploaded will
    be aborted.
  ###
  pause: () ->
    @workerPool.close()
    @uploadPool.close()
    upload.pause() for upload in @uploads

  ###
    Resumes a paused upload. If not paused, does nothing.
  ###
  resume: () ->
    upload.resume() for upload in @uploads
    @workerPool.open()
    @uploadPool.open()

module.exports = Upload
