(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Api,
  __hasProp = {}.hasOwnProperty;

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

  Api.prototype._ajaxRequest = function(url, options, trial) {
    var ajaxOptions, data, e, headers, method, rejectStatus, request, resolveStatus, status, successStatusCodes, _ref, _ref1;
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
    request = null;
    successStatusCodes = [200, 202, 206];
    if ((data != null) && typeof data === "object" && options.skipConversion !== true) {
      headers["Content-Type"] = "application/json";
      data = JSON.stringify(data);
    }
    resolveStatus = (function(_this) {
      return function(data) {
        return status.resolve(data);
      };
    })(this);
    rejectStatus = (function(_this) {
      return function(error) {
        return status.reject(error);
      };
    })(this);
    try {
      ajaxOptions = {
        url: url,
        headers: headers,
        type: method,
        data: data,
        success: function(data) {
          return resolveStatus(data);
        },
        error: (function(_this) {
          return function(jqXHR, textStatus, errorThrown) {
            var e, error, retryDelay, _ref2;
            if (jqXHR.status === 503) {
              retryDelay = parseInt(jqXHR.getResponseHeader("Retry-After"), 10);
              if (!(typeof retryDelay === "number" && !isNaN(retryDelay))) {
                return retryDelay = 60;
              }
            } else if (textStatus === "error" && jqXHR.status === 0) {
              if (trial > _this.maxAJAXTrials) {
                return rejectStatus({
                  type: "AjaxError",
                  details: {
                    jqXHR: jqXHR
                  }
                });
              } else {
                trial += 1;
                return setTimeout(function() {
                  return _this._ajaxRequest(url, options, trial).then(status.resolve, status.reject, status.notify);
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
                  error = (_ref2 = JSON.parse(jqXHR.responseText).error) != null ? _ref2 : {
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
          };
        })(this)
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

  Api.prototype.call = function(subject, method, input, options) {
    var ajaxRequest, apiCallKey, headers, status, url;
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
      data: input
    };
    if (options.withCredentials === true) {
      input.withCredentials = true;
    }
    ajaxRequest = this._ajaxRequest(url, input);
    status.abort = function() {
      this.aborted = true;
      return ajaxRequest.abort();
    };
    ajaxRequest.done((function(_this) {
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



},{}],2:[function(require,module,exports){
if (window.DX == null) {
  window.DX = {};
}

window.DX.Api = require('./api.coffee');



},{"./api.coffee":1}]},{},[2]);