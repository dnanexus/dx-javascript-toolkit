(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var ajaxRequest;

ajaxRequest = function(url, options, trial) {
  var ajaxDelay, ajaxOptions, data, e, headers, maxRetries, method, rejectStatus, request, resolveStatus, status, successStatusCodes, _ref, _ref1, _ref2;
  if (options == null) {
    options = {};
  }
  if (trial == null) {
    trial = 0;
  }
  status = $.Deferred();
  headers = (_ref = options.headers) != null ? _ref : {};
  data = options.data;
  method = (_ref1 = options.method) != null ? _ref1 : "POST";
  ajaxDelay = options.ajaxDelay;
  maxRetries = (_ref2 = options.maxRetries) != null ? _ref2 : 5;
  request = null;
  successStatusCodes = [200, 202, 206];
  if ((data != null) && _.isObject(data) && options.skipConversion !== true) {
    headers["Content-Type"] = "application/json";
    data = JSON.stringify(data);
  }
  resolveStatus = function(data) {
    if (ajaxDelay != null) {
      return setTimeout((function() {
        return status.resolve(data);
      }), ajaxDelay);
    } else {
      return status.resolve(data);
    }
  };
  rejectStatus = function(error) {
    var _ref3, _ref4;
    if (ajaxDelay != null) {
      setTimeout((function() {
        return status.reject(error);
      }), ajaxDelay);
    } else {
      status.reject(error);
    }
    return status.reject({
      type: "AjaxError",
      details: {
        jqXHR: (_ref3 = (_ref4 = error.details) != null ? _ref4.jqXHR : void 0) != null ? _ref3 : {}
      }
    });
  };
  try {
    ajaxOptions = {
      url: url,
      headers: headers,
      type: method,
      data: data,
      success: function(data) {
        return resolveStatus(data);
      },
      error: function(jqXHR, textStatus, errorThrown) {
        var e, error, retryDelay, _ref3;
        if (jqXHR.status === 503) {
          retryDelay = parseInt(jqXHR.getResponseHeader("Retry-After"), 10);
          if (!(_.isNumber(retryDelay) && !_.isNaN(retryDelay))) {
            retryDelay = 60;
          }
          rejectStatus({
            type: "AjaxRetryTimeout",
            details: {
              delay: retryDelay
            }
          });
          return setTimeout(function() {
            return DX.ajaxRequest(url, options, trial).then(status.resolve, status.reject, status.notify);
          }, retryDelay * 1000);
        } else if (textStatus === "error" && jqXHR.status === 0) {
          if (trial > maxRetries) {
            return rejectStatus({
              type: "AjaxError",
              details: {
                jqXHR: jqXHR
              }
            });
          } else {
            trial += 1;
            return setTimeout(function() {
              return DX.ajaxRequest(url, options, trial).then(status.resolve, status.reject, status.notify);
            }, 1000 * Math.pow(2, trial));
          }
        } else {
          if (errorThrown === "abort" || textStatus === "abort" || status.aborted) {
            return;
          }
          error = null;
          if (textStatus === "timeout") {
            error = {
              type: "AjaxTimeout",
              details: {
                url: url
              }
            };
          } else if (textStatus === "parsererror") {
            error = {
              type: "AjaxError",
              details: {
                data: JSON.stringify(input)
              }
            };
          } else {
            try {
              error = (_ref3 = JSON.parse(jqXHR.responseText).error) != null ? _ref3 : {
                type: "InvalidErrorResponse"
              };
            } catch (_error) {
              e = _error;
              error = {
                type: "InvalidErrorResponse",
                details: e
              };
            }
          }
          return rejectStatus(error);
        }
      }
    };
    if (options.cache != null) {
      ajaxOptions.cache = options.cache;
    }
    if (options.withCredentials === true) {
      ajaxOptions.xhrFields = {
        withCredentials: true
      };
    }
    if (options.dataType != null) {
      ajaxOptions.dataType = options.cache;
    }
    request = $.ajax(ajaxOptions);
    status.abort = function() {
      return request.abort();
    };
  } catch (_error) {
    e = _error;
    console.log("Unknown error during API call", e);
    if ((request != null) && (request.abort != null)) {
      request.abort();
    }
    rejectStatus({
      type: "UnknownError",
      details: e
    });
  }
  return status;
};

module.exports = ajaxRequest;



},{}],2:[function(require,module,exports){
var Api, ajaxRequest,
  __hasProp = {}.hasOwnProperty;

ajaxRequest = require('./ajax_request.coffee');

Api = (function() {
  Api.prototype.API_ERRORS = {
    MalformedJSON: "The input could not be parsed as JSON",
    InvalidAuthentication: "The provided OAuth2 token is invalid",
    PermissionDenied: "Insufficient permissions to perform this action",
    ResourceNotFound: "A specified entity or resource could not be found",
    InvalidInput: "The input is syntactically correct (JSON), but semantically incorrect",
    InvalidState: "The operation is not allowed at this object state",
    InvalidType: "An object specified in the request is of invalid type",
    InternalError: "The server encountered an internal error",
    InvalidErrorResponse: "We've received an error, but cannot process the message",
    InvalidAPICall: "An invalid api call has occurred",
    InvalidResponse: "We've received an invalid response from an API call",
    AjaxError: "There was an error in the way the server request was formed",
    AjaxTimeout: "The server could not be contacted in a timely fashion"
  };

  Api.prototype.ALL_ERRORS = "AllErrors";

  function Api(authToken, options) {
    var _ref, _ref1;
    this.authToken = authToken;
    if (options == null) {
      options = {};
    }
    if ((this.authToken == null) || this.authToken.length === 0) {
      throw new Error("authToken must be specified");
    }
    this.maxAJAXTrials = (_ref = options.maxAJAXTrials) != null ? _ref : 5;
    this.apiServer = "https://" + ((_ref1 = options.apiServer) != null ? _ref1 : "api.dnanexus.com");
    this.pendingApiCallKey = 0;
    this.pendingApiCalls = {};
  }

  Api.prototype.call = function(subject, method, input, options) {
    var apiCallKey, headers, request, status, url;
    if (options == null) {
      options = {};
    }
    status = $.Deferred();
    status.abort = function() {
      return this.aborted = true;
    };
    if (this.disabled) {
      return status;
    }
    if (!((subject != null) && (method != null) && typeof subject === "string" && typeof method === "string")) {
      console.error("Subject and method must both be defined and must be strings, when calling Nucleus.call", subject, method);
      return status.reject();
    }
    if (input == null) {
      input = {};
    }
    apiCallKey = this.pendingApiCallKey++;
    this.pendingApiCalls[apiCallKey] = status;
    url = [this.apiServer, subject, method].join('/');
    headers = {};
    headers.Authorization = "Bearer " + this.authToken;
    input = {
      headers: headers,
      data: input,
      maxRetries: this.maxAJAXTrials
    };
    if (options.withCredentials === true) {
      input.withCredentials = true;
    }
    request = ajaxRequest(url, input);
    status.abort = function() {
      this.aborted = true;
      return request.abort();
    };
    request.done((function(_this) {
      return function(data) {
        var error;
        if (status.aborted) {
          return;
        }
        try {
          if (typeof data === "string") {
            data = $.parseJSON(data);
          }
        } catch (_error) {
          error = _error;
          status.reject({
            type: "InvalidResponse"
          });
          return;
        }
        return status.resolve(data);
      };
    })(this)).fail((function(_this) {
      return function(error) {
        return status.reject(error);
      };
    })(this)).always((function(_this) {
      return function() {
        return delete _this.pendingApiCalls[apiCallKey];
      };
    })(this));
    return status;
  };

  Api.prototype.destroy = function() {
    var key, status, _ref, _results;
    this.disabled = true;
    _ref = this.pendingApiCalls;
    _results = [];
    for (key in _ref) {
      if (!__hasProp.call(_ref, key)) continue;
      status = _ref[key];
      _results.push(status.abort());
    }
    return _results;
  };

  Api.prototype.getNumPendingApiCalls = function() {
    var count, key, status, _ref;
    count = 0;
    _ref = this.pendingApiCalls;
    for (key in _ref) {
      if (!__hasProp.call(_ref, key)) continue;
      status = _ref[key];
      count++;
    }
    return count;
  };

  Api.prototype.uploadFilePart = function(fileID, part, slice, md5Hash, errors) {
    var deferred, headers, originalCall;
    deferred = $.Deferred();
    headers = {
      "Content-MD5": md5Hash
    };
    originalCall = this.call(fileID, "upload", {
      "index": part
    }, errors).done(function(results) {
      var ajaxCall, k, origAbort, v, _ref;
      _ref = results.headers;
      for (k in _ref) {
        v = _ref[k];
        headers[k] = v;
      }
      ajaxCall = $.ajax({
        url: results.url,
        contentType: "application/octet-stream",
        processData: false,
        data: slice,
        headers: headers,
        success: function() {
          return deferred.resolve(null);
        },
        error: function(jqXHR, status, error) {
          var errorType, jsError;
          try {
            errorType = JSON.parse(jqXHR.responseText).error.type;
            return deferred.reject(errorType);
          } catch (_error) {
            jsError = _error;
            return deferred.reject(error);
          }
        },
        type: "POST",
        xhr: function() {
          var doneHandler, progressHandler, xhr;
          xhr = $.ajaxSettings.xhr();
          if (xhr.upload != null) {
            progressHandler = function(e) {
              if (e.lengthComputable) {
                return deferred.notify({
                  loaded: e.loaded,
                  total: e.total
                });
              }
            };
            doneHandler = function() {
              xhr.upload.removeEventListener("progress", progressHandler);
              return xhr.upload.removeEventListener("loadend", doneHandler);
            };
            xhr.upload.addEventListener("progress", progressHandler);
            xhr.upload.addEventListener("loadend", doneHandler);
          }
          return xhr;
        }
      });
      origAbort = originalCall.abort;
      return originalCall.abort = function() {
        ajaxCall.abort();
        return origAbort.call(originalCall);
      };
    }).fail(function(error) {
      return deferred.reject(error);
    });
    deferred.abort = function() {
      return originalCall.abort();
    };
    return deferred;
  };

  return Api;

})();

module.exports = Api;



},{"./ajax_request.coffee":1}],3:[function(require,module,exports){
var ResourcePool;

ResourcePool = (function() {
  function ResourcePool(_resources) {
    this._resources = _resources;
    this._queue = [];
    this._closed = false;
  }

  ResourcePool.prototype.acquire = function() {
    var resolver;
    resolver = $.Deferred();
    if (this._resources.length > 0 && !this._closed) {
      resolver.resolve(this._resources.shift());
    } else {
      this._queue.push(resolver);
    }
    return resolver;
  };

  ResourcePool.prototype.close = function() {
    return this._closed = true;
  };

  ResourcePool.prototype.getNumberAvailable = function() {
    if (this._closed) {
      return 0;
    } else {
      return this._resources.length;
    }
  };

  ResourcePool.prototype.release = function(resource) {
    if (this._queue.length > 0 && !this._closed) {
      return this._queue.shift().resolve(resource);
    } else {
      return this._resources.push(resource);
    }
  };

  ResourcePool.prototype.open = function() {
    var resource, _i, _len, _ref, _results;
    if (!this._closed) {
      return;
    }
    this._closed = false;
    _ref = this._resources;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      resource = _ref[_i];
      _results.push(this.release(resource));
    }
    return _results;
  };

  return ResourcePool;

})();

module.exports = ResourcePool;



},{}],4:[function(require,module,exports){
if (window.DX == null) {
  window.DX = {};
}

window.DX.ajaxRequest = require('./ajax_request.coffee');

window.DX.Api = require('./api.coffee');

window.DX.Upload = require('./upload/upload.coffee');



},{"./ajax_request.coffee":1,"./api.coffee":2,"./upload/upload.coffee":7}],5:[function(require,module,exports){
var FileUpload, MAX_PARTS,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

MAX_PARTS = 10000;

FileUpload = (function() {
  FileUpload.prototype.computeSignature = function(file, partSize) {
    return [file.size, file.lastModifiedDate.getTime(), 0, partSize, file.name].join(" ");
  };

  FileUpload.prototype.createFile = function(file, api, partSize, projectID, options) {
    var newFileOptions, properties, _ref;
    if (options == null) {
      options = {};
    }
    properties = $.extend(options.properties, {
      ".system-fileSignature": this.computeSignature(file, partSize)
    });
    newFileOptions = {
      folder: options.folder,
      name: file.name,
      project: projectID,
      properties: properties
    };
    if (((_ref = options.tags) != null ? _ref.length : void 0) > 0) {
      newFileOptions.tags = options.tags;
    }
    return api.call("file", "new", newFileOptions).then(function(resp) {
      return {
        fileID: resp.id
      };
    });
  };

  FileUpload.prototype.findOrCreateFile = function(file, api, partSize, projectID, options) {
    var makeNewFile, onSearchFailure, onSearchSuccess, searchCriteria;
    if (options == null) {
      options = {};
    }
    searchCriteria = {
      "class": "file",
      state: "open",
      describe: true,
      properties: {
        ".system-fileSignature": this.computeSignature(file, partSize)
      },
      scope: {
        project: projectID,
        folder: options.folder
      }
    };
    makeNewFile = (function(_this) {
      return function() {
        return _this.createFile(file, api, partSize, projectID, options);
      };
    })(this);
    onSearchSuccess = function(data) {
      return data;
    };
    onSearchFailure = function() {
      return null;
    };
    onSearchSuccess = function(data) {
      if (data.results.length === 1) {
        return {
          fileID: data.results[0].id,
          parts: data.results[0].describe.parts
        };
      } else {
        return makeNewFile();
      }
    };
    onSearchFailure = function() {
      return makeNewFile();
    };
    return api.call("system", "findDataObjects", searchCriteria).then(onSearchSuccess, onSearchFailure);
  };


  /*
   * options:
   *   # Required
   *   file: The file to upload
   *   fileCreationPool: A ResourcePool for creating the files
   *   workerPool: A ResourcePool of web workers for MD5 computation
   *   uploadPool: A ResourcePool of upload tokens, for managing upload concurrency
   *   api: The API bindings to make API calls
   *   projectID: The project to upload the file to
   *
   *   # Optional
   *   folder: The folder to upload the file into. Default: "/"
   *   partSize: The size of each part, in bytes. Default: 10485760
   *   tags: An array of strings that will be added as tags on all of the uploaded files
   *   properties: An object literal which will populate the properties of all uploaded files.
   */

  function FileUpload(file, options) {
    var fileCreationOptions, key, _i, _len, _ref;
    this.file = file;
    if (options == null) {
      options = {};
    }
    this._onUploadProgress = __bind(this._onUploadProgress, this);
    options = $.extend({
      folder: "/"
    }, options);
    _ref = ["folder", "partSize", "fileCreationPool", "workerPool", "uploadPool", "api", "projectID"];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      key = _ref[_i];
      if (options[key] == null) {
        throw new Error("Required parameter " + key + " is not specified");
      }
      this[key] = options[key];
    }
    this.partSize = Math.max(Math.ceil(this.file.size / MAX_PARTS), this.partSize);
    this._uploadProgress = $.Deferred();
    this._checksumProgress = $.Deferred();
    this._closingProgress = $.Deferred();
    this._uploadCalls = {};
    this._uploadsDone = 0;
    this._bytesUploaded = 0;
    this._bytesResumed = 0;
    this._aborted = false;
    this._closing = false;
    this._closed = false;
    this.numParts = Math.max(1, Math.ceil(this.file.size / this.partSize));
    this.uploadStartedAt = null;
    this._checksumQueue = [];
    this._uploadQueue = [];
    this._parts = [];
    this._partUploadProgress = [];
    fileCreationOptions = {
      folder: this.folder,
      tags: options.tags,
      properties: options.properties
    };
    this.fileCreationStatus = $.Deferred();
    this.fileCreationPool.acquire().done((function(_this) {
      return function(createFileToken) {
        return FileUpload.prototype.findOrCreateFile(file, _this.api, _this.partSize, _this.projectID, fileCreationOptions).done(function(data) {
          var existingParts, i, part, start, _j, _ref1, _ref2, _ref3;
          existingParts = (_ref1 = data.parts) != null ? _ref1 : {};
          _this.fileID = data.fileID;
          for (i = _j = 0, _ref2 = _this.numParts; 0 <= _ref2 ? _j < _ref2 : _j > _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
            start = _this.partSize * i;
            part = {
              index: i + 1,
              start: start,
              stop: Math.min(_this.file.size, start + _this.partSize)
            };
            _this._parts.push(part);
            if (((_ref3 = existingParts[i + 1]) != null ? _ref3.state : void 0) === "complete") {
              _this._uploadsDone += 1;
              _this._bytesResumed += part.stop - part.start;
            } else {
              _this._checksumQueue.push(part);
            }
          }
          _this._onUploadProgress();
          return _this.fileCreationStatus.resolve(_this.fileID);
        }).fail(function(error) {
          return _this.fileCreationStatus.reject(error);
        }).always(function() {
          return _this.fileCreationPool.release(createFileToken);
        });
      };
    })(this));
  }

  FileUpload.prototype._computeChecksums = function() {
    var checksumsDone, part, totalChecksums, _results;
    totalChecksums = this._checksumQueue.length;
    checksumsDone = 0;
    _results = [];
    while (this._checksumQueue.length > 0) {
      part = this._checksumQueue.shift();
      _results.push((function(_this) {
        return function(part) {
          return _this.workerPool.acquire().done(function(worker) {
            var slice, slicer, _ref, _ref1;
            if (_this._aborted) {
              _this.workerPool.release(worker);
              return;
            }
            slicer = (_ref = (_ref1 = _this.file.slice) != null ? _ref1 : _this.file.webkitSlice) != null ? _ref : _this.file.mozSlice;
            slice = slicer.call(_this.file, part.start, part.stop);
            part.slice = slice;
            return worker.computeMD5(slice).done(function(md5) {
              var data;
              part.md5 = md5;
              _this._uploadQueue.push(part);
              _this._doUpload();
              _this.workerPool.release(worker);
              checksumsDone += 1;
              data = {
                partsTotal: totalChecksums,
                partsDone: checksumsDone
              };
              if (totalChecksums === checksumsDone) {
                return _this._checksumProgress.resolve(data);
              } else {
                _this._checksumProgress.notify(data);
                return _this._computeChecksums();
              }
            }).fail(function(error) {
              return console.error("Error computing MD5 checksum", error);
            });
          });
        };
      })(this)(part));
    }
    return _results;
  };

  FileUpload.prototype._closeFile = function() {
    var doCloseFile;
    if (this._closing || this._closed || this._aborted) {
      return;
    }
    this._closing = true;
    doCloseFile = (function(_this) {
      return function() {
        return _this.api.call(_this.fileID, "describe").done(function(data) {
          var part, partID, ready, _ref;
          ready = true;
          _ref = data.parts;
          for (partID in _ref) {
            part = _ref[partID];
            if (part.state !== "complete") {
              ready = false;
              break;
            }
          }
          if (ready) {
            return _this.api.call(_this.fileID, "close").done(function() {
              _this._closing = false;
              _this._closed = true;
              return _this._closingProgress.resolve();
            });
          } else {
            return setTimeout(doCloseFile, 1000);
          }
        });
      };
    })(this);
    return doCloseFile();
  };

  FileUpload.prototype._onUploadProgress = function(part, data, done) {
    var bytesInProgress, index, loaded, progressData, _ref;
    if (done == null) {
      done = false;
    }
    if (data != null) {
      this._partUploadProgress[part.index] = data.loaded;
    }
    bytesInProgress = 0;
    _ref = this._partUploadProgress;
    for (index in _ref) {
      loaded = _ref[index];
      bytesInProgress += loaded;
    }
    progressData = {
      bytesTotal: this.file.size,
      bytesUploaded: this._bytesUploaded + bytesInProgress,
      bytesDone: this._bytesResumed + this._bytesUploaded + bytesInProgress
    };
    if (done) {
      return this._uploadProgress.resolve(progressData);
    } else {
      return this._uploadProgress.notify(progressData);
    }
  };

  FileUpload.prototype._doUpload = function() {
    if (this._uploadsDone === this.numParts && this._bytesUploaded + this._bytesResumed === this.file.size) {
      this._closeFile();
      return;
    }
    if (this._uploadQueue.length > 0) {
      return this.uploadPool.acquire().done((function(_this) {
        return function(token) {
          var abortPart, call, onUploadDone, origAbort, part;
          if (_this._uploadQueue.length === 0 || _this._aborted) {
            _this.uploadPool.release(token);
            return;
          }
          part = _this._uploadQueue.shift();
          _this._partUploadProgress[part.index] = 0;
          _this.uploadStartedAt = Date.now();
          call = _this.api.uploadFilePart(_this.fileID, part.index, part.slice, part.md5);
          _this._uploadCalls[part.index] = call;
          call.progress(function(data) {
            return _this._onUploadProgress(part, data);
          });
          onUploadDone = function() {
            delete _this._uploadCalls[part.index];
            if (token != null) {
              _this.uploadPool.release(token);
              token = null;
            }
            return _this._doUpload();
          };
          abortPart = function() {
            _this._uploadQueue.unshift(part);
            _this._partUploadProgress[part.index] = 0;
            _this._onUploadProgress(part);
            return onUploadDone();
          };
          origAbort = call.abort;
          call.abort = function() {
            origAbort.call(call);
            return abortPart();
          };
          call.done(function() {
            _this._uploadsDone += 1;
            _this._bytesUploaded += part.stop - part.start;
            delete _this._partUploadProgress[part.index];
            return _this._onUploadProgress(part, null, _this._uploadsDone === _this.numParts);
          });
          return call.always(onUploadDone);
        };
      })(this));
    }
  };

  FileUpload.prototype.monitorChecksumProgress = function() {
    return this._checksumProgress.promise();
  };

  FileUpload.prototype.monitorUploadProgress = function() {
    return this._uploadProgress.promise();
  };

  FileUpload.prototype.monitorFileClosingProgress = function() {
    return this._closingProgress.promise();
  };

  FileUpload.prototype.abort = function() {
    var apiCall, index, _ref;
    if (this._aborted) {
      return $.Deferred().resolve(this.fileID);
    }
    if (this._closed) {
      return $.Deferred().reject({
        reason: "File Closed"
      });
    }
    this._aborted = true;
    this._uploadQueue = [];
    _ref = this._uploadCalls;
    for (index in _ref) {
      apiCall = _ref[index];
      apiCall.abort();
    }
    this._uploadsCalls = {};
    return this.api.call(this.projectID, "removeObjects", {
      objects: [this.fileID]
    }).then((function(_this) {
      return function() {
        _this._uploadProgress.reject();
        return _this.fileID;
      };
    })(this));
  };

  FileUpload.prototype.pause = function() {
    var apiCall, index, _ref, _results;
    _ref = this._uploadCalls;
    _results = [];
    for (index in _ref) {
      apiCall = _ref[index];
      _results.push(apiCall.abort());
    }
    return _results;
  };

  FileUpload.prototype.resume = function() {
    this._computeChecksums();
    return this._doUpload();
  };

  FileUpload.prototype.start = function() {
    return this.fileCreationStatus.done((function(_this) {
      return function() {
        _this._computeChecksums();
        return _this._doUpload();
      };
    })(this));
  };


  /*
    Reads length bytes from the file, starting at offset. This is useful for clients who wish
    to perform some validation based on a small part of the file, typically the header.
  
    file: An HTML5 File object
    offset: The byte offset into the file, 0 based
    length: The number of bytes to read from the file, starting at offset.
  
    Returns a deferred object which will be resolved with an ArrayBuffer. Note, if offset is outside the file, the returned ArrayBuffer
    will be empty. Also if offset + length is greater than the file size, the returned ArrayBuffer will have a byteLength less than the 
    requested length
   */

  FileUpload.prototype.readBytes = function(offset, length) {
    return alert("readBytes not yet supported");
  };

  return FileUpload;

})();

module.exports = FileUpload;



},{}],6:[function(require,module,exports){
var MD5Worker;

MD5Worker = (function() {
  function MD5Worker(_sparkMD5Src) {
    this._sparkMD5Src = _sparkMD5Src;
    this.keyToDeferred = {};
    this.worker = this._makeMD5WebWorker();
  }

  MD5Worker.prototype.computeMD5 = function(slice) {
    var key;
    key = this._makeKey();
    this.keyToDeferred[key] = $.Deferred();
    this.worker.computeMD5(key, slice, (function(_this) {
      return function(result) {
        if (typeof result === "object" && (result.error != null)) {
          return _this.keyToDeferred[key].reject(result);
        } else {
          return _this.keyToDeferred[key].resolve(result);
        }
      };
    })(this));
    return this.keyToDeferred[key];
  };

  MD5Worker.prototype.terminate = function() {
    return this.worker.destroy();
  };

  MD5Worker.prototype._makeKey = function() {
    return Date.now().toString() + "-" + Math.round(Math.random() * 9999999);
  };

  MD5Worker.prototype._makeMD5WebWorker = function() {
    var worker;
    worker = operative({
      computeMD5: function(key, slice) {
        var error, fileData, md5Hex, reader;
        reader = new FileReaderSync();
        try {
          fileData = reader.readAsArrayBuffer(slice);
          md5Hex = SparkMD5.ArrayBuffer.hash(fileData);
          return md5Hex;
        } catch (_error) {
          error = _error;
          return {
            error: error.name,
            message: error.message
          };
        }
      }
    }, [this._sparkMD5Src]);
    return worker;
  };

  return MD5Worker;

})();

module.exports = MD5Worker;



},{}],7:[function(require,module,exports){
var Api, FileUpload, MD5Worker, ResourcePool, Upload,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Api = require('../api.coffee');

FileUpload = require('./file_upload.coffee');

MD5Worker = require('./md5_worker.coffee');

ResourcePool = require('../common/resource_pool.coffee');

Upload = (function() {

  /*
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
  
      sparkMD5Src: The url/path to the sparkMD5 library. [required]
  
      checksumConcurrency: How many web workers to create to compute MD5s. Default: 10
      uploadConcurrency: The number of concurrent uploads to perform. Default: 10
   */
  function Upload(_authToken, files, options) {
    var checksumConcurrency, i, uploadResources, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
    this._authToken = _authToken;
    this.files = files;
    if (options == null) {
      options = {};
    }
    this.start = __bind(this.start, this);
    if (!(((_ref = options.projectID) != null ? _ref.length : void 0) > 0)) {
      throw new Error("projectID must be specified");
    }
    if (!(((_ref1 = options.sparkMD5Src) != null ? _ref1.length : void 0) > 0)) {
      throw new Error("sparkMD5Src must be specified");
    }
    this.partSize = (_ref2 = options.partSize) != null ? _ref2 : 10485760;
    this.folder = (_ref3 = options.folder) != null ? _ref3 : "/";
    checksumConcurrency = (_ref4 = options.checksumConcurrency) != null ? _ref4 : 10;
    this.uploadConcurrency = (_ref5 = options.uploadConcurrency) != null ? _ref5 : 10;
    this.projectID = options.projectID;
    this.api = new Api(this._authToken, options);
    this.workers = (function() {
      var _i, _results;
      _results = [];
      for (i = _i = 0; 0 <= checksumConcurrency ? _i < checksumConcurrency : _i > checksumConcurrency; i = 0 <= checksumConcurrency ? ++_i : --_i) {
        _results.push(new MD5Worker(options.sparkMD5Src));
      }
      return _results;
    })();
    this.workerPool = new ResourcePool(this.workers);
    uploadResources = (function() {
      var _i, _ref6, _results;
      _results = [];
      for (i = _i = 0, _ref6 = this.uploadConcurrency; 0 <= _ref6 ? _i < _ref6 : _i > _ref6; i = 0 <= _ref6 ? ++_i : --_i) {
        _results.push("UploadToken " + i);
      }
      return _results;
    }).call(this);
    this.uploadPool = new ResourcePool(uploadResources);
    this.fileCreationPool = new ResourcePool((function() {
      var _i, _ref6, _results;
      _results = [];
      for (i = _i = 0, _ref6 = this.uploadConcurrency; 0 <= _ref6 ? _i < _ref6 : _i > _ref6; i = 0 <= _ref6 ? ++_i : --_i) {
        _results.push("FileCreateToken " + i);
      }
      return _results;
    }).call(this));
  }


  /*
    Begins the upload. Returns a deferred object which is resolved with an array of FileUpload objects. Rejects the deferred with an
    error object if any errors occur in starting the uploads.
   */

  Upload.prototype.start = function() {
    var defaultUploadOptions, file, fileToUpload, i, startUpload, status, uploadOptions, _i, _len, _ref;
    status = $.Deferred();
    this.uploads = [];
    defaultUploadOptions = {
      partSize: this.partSize,
      workerPool: this.workerPool,
      uploadPool: this.uploadPool,
      fileCreationPool: this.fileCreationPool,
      api: this.api,
      projectID: this.projectID,
      folder: this.folder
    };
    _ref = this.files;
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      file = _ref[i];
      if ($.isPlainObject(file) && (file.file != null) && (file.options != null)) {
        fileToUpload = file.file;
        uploadOptions = $.extend(defaultUploadOptions, file.options);
      } else {
        fileToUpload = file;
        uploadOptions = defaultUploadOptions;
      }
      this.uploads[i] = new FileUpload(fileToUpload, uploadOptions);
    }
    startUpload = (function(_this) {
      return function(index) {
        var upload;
        upload = _this.uploads[index];
        upload.start();
        if (index === _this.uploads.length - 1) {
          return status.resolve(_this.uploads);
        } else {
          return startUpload(index + 1);
        }
      };
    })(this);
    startUpload(0);
    return status;
  };


  /*
    Aborts all incomplete uploads, and deletes the partial files. Returns a deferred object which is resolved with the IDs of the files
    that were deleted.
   */

  Upload.prototype.abort = function() {
    var aborted, count, status, upload, _i, _len, _ref;
    this.fileCreationPool.close();
    this.workerPool.close();
    this.uploadPool.close();
    status = $.Deferred();
    count = 0;
    aborted = [];
    _ref = this.uploads;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      upload = _ref[_i];
      upload.abort().done(function(fileID) {
        return aborted.push(fileID);
      }).fail(function(error) {
        if ((error != null ? error.reason : void 0) !== "File Closed") {
          return status.reject(error);
        }
      }).always((function(_this) {
        return function() {
          if (++count === _this.uploads.length) {
            return status.resolve(aborted);
          }
        };
      })(this));
    }
    return status;
  };


  /*
   * Cleans up the upload and destroys all resources
   */

  Upload.prototype.destroy = function() {
    var worker, _i, _len, _ref;
    _ref = this.workers;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      worker = _ref[_i];
      worker.terminate();
    }
    this.workerPool.close();
    return this.uploadPool.close();
  };


  /*
    Pauses all uploads. No new checksums will be computed, no new upload parts will begin, and all parts currently being uploaded will
    be aborted.
   */

  Upload.prototype.pause = function() {
    var upload, _i, _len, _ref, _results;
    this.workerPool.close();
    this.uploadPool.close();
    _ref = this.uploads;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      upload = _ref[_i];
      _results.push(upload.pause());
    }
    return _results;
  };


  /*
    Resumes a paused upload. If not paused, does nothing.
   */

  Upload.prototype.resume = function() {
    var upload, _i, _len, _ref;
    _ref = this.uploads;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      upload = _ref[_i];
      upload.resume();
    }
    this.workerPool.open();
    return this.uploadPool.open();
  };

  return Upload;

})();

module.exports = Upload;



},{"../api.coffee":2,"../common/resource_pool.coffee":3,"./file_upload.coffee":5,"./md5_worker.coffee":6}]},{},[4]);