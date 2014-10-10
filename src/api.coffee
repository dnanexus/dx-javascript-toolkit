# TODO: Set cookies to expire when the token expires
ajaxRequest = require('./ajax_request.coffee')

class Api
  #
  # Globals
  #
  API_ERRORS:
    MalformedJSON: "The input could not be parsed as JSON"
    InvalidAuthentication: "The provided OAuth2 token is invalid"
    PermissionDenied: "Insufficient permissions to perform this action"
    ResourceNotFound: "A specified entity or resource could not be found"
    InvalidInput: "The input is syntactically correct (JSON), but semantically incorrect"
    InvalidState: "The operation is not allowed at this object state"
    InvalidType: "An object specified in the request is of invalid type"
    InternalError: "The server encountered an internal error"

    InvalidErrorResponse: "We've received an error, but cannot process the message"
    InvalidAPICall: "An invalid api call has occurred"
    InvalidResponse: "We've received an invalid response from an API call"

    AjaxError: "There was an error in the way the server request was formed"
    AjaxTimeout: "The server could not be contacted in a timely fashion"

  ALL_ERRORS: "AllErrors"

  #
  # Construct a new API binding
  #
  #  authToken: The authentication token with which we can access the DNAnexus API.
  #
  # options:
  #   apiServer: Override the API server information. Default: "api.dnanexus.com"
  #   maxAJAXTrials: The number of times to retry an AJAX request. Default: 5
  #
  constructor: (@authToken, options = {}) ->
    throw new Error("authToken must be specified") if !@authToken? || @authToken.length == 0
    @maxAJAXTrials = options.maxAJAXTrials ? 5

    @apiServer = "https://#{options.apiServer ? "api.dnanexus.com"}"

    # A list of pending API calls, do be tracked/aborted when needed
    @pendingApiCallKey = 0
    @pendingApiCalls = {}

  #
  # Performs an API call against Nucleus.
  #
  # subject: The target of the API call, in the form object-xxxx
  # method: The method to call on the target, "describe" for example
  # input: An object representing the arguments for the API call
  #
  # options: Some custom options that are needed from time to time
  #   withCredentials: if true will set the withCredentials property on the xhr request
  #
  # Returns a deferred object which will be called with the results upon success, or the error if an
  # error occurs. The deferred object also has an "abort" method which will abort the AJAX call.
  #
  call: (subject, method, input, options = {}) ->
    status = $.Deferred()

    # Add abort for early returns (will be replaced by a more comlpex method later)
    status.abort = () ->
      @aborted = true

    # If this API connection is disabled, return a deferred object which will never be resolved
    return status if @disabled

    # If no subject or method is given, reject outright
    if !(subject? && method? && typeof subject == "string" && typeof method == "string")
      console.error("Subject and method must both be defined and must be strings, when calling Nucleus.call", subject, method)
      return status.reject()

    input ?= {}

    apiCallKey = @pendingApiCallKey++
    @pendingApiCalls[apiCallKey] = status

    url = [@apiServer, subject, method].join('/')
    headers = {}
    headers.Authorization = "Bearer #{@authToken}"

    input =
      headers: headers
      data: input
      maxRetries: @maxAJAXTrials

    if options.withCredentials == true
      input.withCredentials = true

    request = ajaxRequest(url, input)

    # Decorate the deferred object with an abort method which cancels the ajax request and sets the internal
    # state of the deferred object to aborted, which prevents the deferred object from being resolved
    status.abort = () ->
      @aborted = true
      request.abort()

    request.done((data) =>
      return if status.aborted

      # Firefox insists that the returned data is a string, not a JSON object. Here we parse the
      # JSON if we can, or leave it as a string if not.
      try
        data = $.parseJSON(data) if typeof data == "string"
      catch error
        status.reject({type: "InvalidResponse"})
        return

      status.resolve(data)

    ).fail((error) =>
      status.reject(error)
    ).always(() =>
      delete @pendingApiCalls[apiCallKey]
    )

    return status

  # Aborts all unresolved callbacks
  destroy: () ->
    @disabled = true
    for own key, status of @pendingApiCalls
      status.abort()

  getNumPendingApiCalls: () ->
    count = 0
    for own key, status of @pendingApiCalls
      count++
    return count

  uploadFilePart: (fileID, part, slice, md5Hash, errors) ->
    deferred = $.Deferred()

    headers =
      "Content-MD5": md5Hash

    originalCall = @call(fileID, "upload", {"index": part}, errors).done((results) ->
      # Merge the upload headers into our headers
      for k,v of results.headers
        headers[k] = v

      ajaxCall = $.ajax({
        url: results.url
        contentType: "application/octet-stream"
        processData: false
        data: slice
        headers: headers
        success: () ->
          deferred.resolve(null)
        error: (jqXHR, status, error) ->
          try
            errorType = JSON.parse(jqXHR.responseText).error.type
            deferred.reject(errorType)
          catch jsError
            deferred.reject(error)

        type: "POST"
        xhr: () ->
          # Grab upload progress from XMLHttpRequest2 if available
          xhr = $.ajaxSettings.xhr()
          if xhr.upload?

            progressHandler = (e) ->
              if e.lengthComputable
                # TODO: Change names?
                deferred.notify({loaded: e.loaded, total: e.total})

            doneHandler = () ->
              # Clean up event listeners
              xhr.upload.removeEventListener("progress", progressHandler)
              xhr.upload.removeEventListener("loadend", doneHandler)

            xhr.upload.addEventListener("progress", progressHandler)
            xhr.upload.addEventListener("loadend", doneHandler)
          return xhr
      })

      origAbort = originalCall.abort
      originalCall.abort = () ->
        ajaxCall.abort()
        origAbort.call(originalCall)

    ).fail((error) ->
      deferred.reject(error)
    )

    # Delegate abort calls
    deferred.abort = () ->
      originalCall.abort()

    return deferred

module.exports = Api
