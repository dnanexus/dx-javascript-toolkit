# AWS Constraint
MAX_PARTS = 10000

# TODO: Abort, Cancel, Pause, Resume, Tags, Properties

Api = require('../api.coffee')
FileUpload = require('./file_upload.coffee')
MD5Worker = require('./md5_worker.coffee')
ResourcePool = require('../common/resource_pool.coffee')

class Upload
  ###
    Creates a new upload instance

    authToken: The auth token which grants access to the DNAnexus platform [required]
    files: A list of files to upload

    options:
      projectID: The ID of the project to upload the files into. [required]
      folder: The folder to upload the files into, inside the project specified by projectID.
              Optional, default: "/"
      apiServer: The host API server to use. Default: {host: "api.dnanexus.com", proto: https"}
      partSize: The chunk size for the uploads. Default: 10485760 (10MB)

      sparkMD5Src: The url/path to the sparkMD5 library. [required]

      checksumConcurrency: How many web workers to create to compute MD5s. Default: 10
      uploadConcurrency: The number of concurrent uploads to perform. Default: 10
  ###
  constructor: (@_authToken, @files, options = {}) ->
    throw new Error("projectID must be specified") unless options.projectID?.length > 0
    throw new Error("sparkMD5Src must be specified") unless options.sparkMD5Src?.length > 0

    @partSize = options.partSize ? 10485760
    @folder = options.folder ? "/"

    checksumConcurrency = options.checksumConcurrency ? 10
    @uploadConcurrency = options.uploadConcurrency ? 10

    @projectID = options.projectID
    @api = new Api(@_authToken, options)

    workers = (new MD5Worker(options.sparkMD5Src) for i in [0...checksumConcurrency])
    @workerPool = new ResourcePool(workers)

    uploadResources = ("UploadToken #{i}" for i in [0...@uploadConcurrency])
    @uploadPool = new ResourcePool(uploadResources)

  ###
    Begins the upload. Returns a deferred object which is resolved with an array of FileUpload objects. Rejects the deferred with an
    error object if any errors occur in starting the uploads.
  ###
  start: () =>
    status = $.Deferred()
    @uploads = []

    uploadOptions =
      partSize: @partSize
      workerPool: @workerPool
      uploadPool: @uploadPool
      api: @api
      projectID: @projectID
      folder: @folder

    for file, i in @files
      @uploads[i] = new FileUpload(file, uploadOptions)

    startUpload = (index) =>
      upload = @uploads[index]
      upload.fileCreationStatus.done(() =>
        upload.start()

        if index == @uploads.length - 1
          status.resolve(@uploads)
        else
          startUpload(index + 1)
      )

    # Start the uploads in file order
    startUpload(0)

    # TODO: HANDLE FAILURES

    return status

  ###
    Aborts all incomplete uploads, and deletes the partial files. Returns a deferred object which is resolved with the IDs of the files
    that were deleted.
  ###
  abort: () ->
    @workerPool.close()
    @uploadPool.close()

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
