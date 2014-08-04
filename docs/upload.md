DX.Upload
=========

The DNAnexus Upload Library extends upon the basic API bindings by providing a high level API for efficiently uploading
files to the DNAnexus platform. The upload library has a few additional dependencies, which enable our efficient upload process, listed below.

Uploading files
----------------

To upload files to the DNAnexus platform, you need an access token. This is a token which provides access to the
platform on behalf of a user. See [API-Tokens](https://wiki.dnanexus.com/UI/API-Tokens) for more information on
how to create a token in using the DNAnexus platform. Additionally visit
[Authentication](https://wiki.dnanexus.com/API-Specification-v1.0.0/Authentication) for detailed information on authenticating with DNAnexus.

When creating an upload instance you will need to specify the ID of the project that you would like to upload files into. The project ID is something
in the form "project-abc123", and is not the name of the project. If you are using the DNAnexus platform in your web browser, navigate to a project
of interest and you will see the project ID in the URL. You may also specify a folder within the project.

Dependencies
------------

* [jQuery](http://jquery.com/) - Any relatively recent version will do. Required features are `$.ajax` and `$.Deferred`
* [Operative.js](https://github.com/padolsey/operative) - Required for web worker support, which enabled efficient checksum computation
The API library requires a modern very of jQuery, which must be loaded before attempting to use the DNAnexus API library.
* [SparkMD5](https://github.com/satazor/SparkMD5) - Library for comptuing MD5 checksums

DX.Upload Documentation
--------------------

Links from code example
* [Basic file upload example](https://github.com/dnanexus/dx-membrane-toolkit/blob/master/examples/uploading-files-basic/index.html)
* [FileList](https://developer.mozilla.org/en-US/docs/Web/API/FileList)
* [FileUpload](https://github.com/dnanexus/dx-membrane-toolkit/blob/master/docs/file_upload.md)

```javascript
  /*
   * Creates a new upload instance.
   *
   * authToken: The authentication token which grants access to the DNAnexus platform
   * files: A [FileList] - the list of files to upload
   * options: An object with additional configuration options
   *   projectID: The id of the project to upload the files into [required]
   *   sparkMD5Src: The url/path to the sparkMD5 library [required]. See [Basic file upload example] 
   *                for an easy way to do this.
   *
   *   apiServer: The DNAnexus API server to use. [default "api.dnanexus.com"]
   *   folder: The folder to upload the files into inside the project. [default "/"]
   *   partSize: The chunk size for uploads. [default 10485760 (10MB)]
   *   checksumConcurrency: The number of web workers to create to compute checksums. [default 10]
   *   uploadConcurrency: The number of concurrent uploads to perform. [default 10]
   */
  constructor: function(authToken, files, options)

  /*
   * Begins the upload. Returns a deferred object which is resolved with an array of  [File Upload] 
     objects. Rejects the deferred with an error object is any error occurs.
   */
  start: function()

  /*
   * Aborts all incomplete uploads, and deletes the partial files. Returns a deferred object which is 
   * resolved with the IDs of the deleted files.
   */
  abort: function()

  /*
   * Pauses all uploads. No new checksums will be computed, no new upload parts will begin, and all 
   * parts currently being uploaded will be aborted.
   */
  pause: function()

  /*
   * Resumes a paused upload. If the upload is not paused, has no effect.
   */
  resume: function()
```

Examples
--------

Note: Due to the browser security model, these examples must be loaded from a webserver as opposed to a file url.

* [Basic file upload](https://github.com/dnanexus/dx-membrane-toolkit/blob/master/examples/uploading-files-basic) - Bare bones uploading of files
* [Advanced file upload](https://github.com/dnanexus/dx-membrane-toolkit/blob/master/examples/uploading-files-progress) - Rich file uploading with all the bells and whistles
