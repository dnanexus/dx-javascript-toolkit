DX.FileUpload
=======================

The FileUpload object represents uploading of a single file. The FileUpload object exposes fine grained control
of the upload as well as the ability to monitor progress of the upload.

DX.FileUpload Documentation
--------------------

Links from code example
* [ResourcePool](https://github.com/dnanexus/dx-javascript-toolkit/blob/master/src/common/resource_pool.coffee)

```javascript
  /*
   * Creates a new file upload instance. This is called by DX.Upload and should not be invoked directly
   *
   * file: The file to upload
   * options: An object with additional configuration options
   *   workerPool: A ResourcePool of web workers, for MD5 computation
   *   uploadPool: A ResourcePool of upload tokens, for managing upload concurrency
   *   api: A DX.Api instance for making API calls
   *   projectID: The ID of the project to upload the file into
   *   folder: The folder to upload the file into. [default "/"]
   *   partSize: The size of each part, in bytes. [default 10485760 (10MB)]
   */
  constructor: function(file, options)

  /*
   * A deferred object which will be resolved when the file is created on the DNAnexus platform
   */
  fileCreationStatus: Deferred

  /*
   * Stops all current uploads and deletes the file. If this file has already been closed, this method
   * has no effect.
   *
   * Returns a Deferred object which will be resolved with the deleted fileID if this file was deleted,
   * or rejected if the file has already been closed
   */
  abort: function()

  /*
   * Aborts all current uploads
   */
  pause: function()

  /*
   * Resumes a paused upload.
   */
  resume: function()

  /*
   * Begins the upload, first computing checksums and then uploading parts.
   */
  start: function()

  /*
   * NOT YET IMPLEMENTED
   *
   * Reads bytes from the file
   *
   * offset: The byte offset into the file
   * length: The number of bytes to read
   *
   * Returns a deferred object which will be resolved with an ArrayBuffer containing the file content
   */
  readBytes: function(offset, length)

  /*
   * Returns a Deferred object which will be notified with checksum computation progress, and will be
   * resolved when all checksums are computed. Both the notify and progress callbacks will receive an
   * object in the form
   *
   * {
   *   "partsDone": 5,    // The number of checksums that have been computed
   *   "partsTotal": 10   // The total number of checksums to compute
   * }
   */
  monitorChecksumProgress: function()

  /*
   * Returns a Deferred object which will be notified with upload progress, and will be resolved
   * when all upload parts are computed. Both the notify and progress callbacks will receive an object in the form
   *
   * {
   *   "bytesTotal": 5000,      // The total number of bytes, a.k.a the size of the file
   *   "bytesUploaded": 1000,   // The total number of bytes uploaded so far
   *   "bytesDone": 2000        // The total number of bytes that have been uploaded or resumed so far. This may be
   *                            // larger than bytesUploaded if some parts were done in a previous upload session
   * }
   */
  monitorUploadProgress: function()

  /*
   * Returns a Deferred object which will be resolved once the file has been closed.
   */
  monitorFileClosingProgress: function()
```

Examples
--------

Note: Due to the browser security model, these examples must be loaded from a webserver as opposed to a file url.

* [Basic file upload](https://github.com/dnanexus/dx-javascript-toolkit/blob/master/examples/uploading-files-basic) - Bare bones uploading of files
* [Advanced file upload](https://github.com/dnanexus/dx-javascript-toolkit/blob/master/examples/uploading-files-progress) - Rich file uploading with all the bells and whistles
