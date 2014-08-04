DNAnexus Javascript Libraries
=============================

The DNAnexus Javascript Libraries are a collection of libraries that make it easy to integrate your javascript application with the
DNAnexus platform. The complex functionality that is required to upload large files efficiently is available in only a few lines of code.

Making a request
----------------

```javascript
var api = new DX.Api("AUTH_TOKEN_GOES_HERE");
api.call("user-bob", "describe").done(function(userData) {
  alert("user-bob's full name is " + [userData.first, userData.last].join(" "));
});
```

Dependencies
------------

The various libraries provided have different dependencies. All DNAnexus Javascript libraries rely on
jQuery's [Deferred](http://api.jquery.com/category/deferred-object/) object, as promises are not yet
standardized across all common browsers. See the libraries below for the exact dependencies.

Libraries / Docs
----------------

* [API](https://github.com/dnanexus/dx-membrane-toolkit/blob/master/docs/api.md) - Basic javascript bindings for making API calls
* [Upload](https://github.com/dnanexus/dx-membrane-toolkit/blob/master/docs/upload.md) - Adds ability to upload files to the platform

Examples
--------

The examples below are intended to demonstrate how to use the libraries. The examples were built quickly and are
not meant to demonstrate how to properly build a web application/component.

* [Getting Started](https://github.com/dnanexus/dx-membrane-toolkit/blob/master/examples/getting-started) - Basic usage, making an API call
* [Basic file upload](https://github.com/dnanexus/dx-membrane-toolkit/blob/master/examples/uploading-files-basic) - Bare bones uploading of files
* [Advanced file upload](https://github.com/dnanexus/dx-membrane-toolkit/blob/master/examples/uploading-files-progress) - Rich file uploading with all the bells and whistles
