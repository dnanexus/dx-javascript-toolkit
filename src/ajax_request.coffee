#
# CORS request factory
#
# Options: A hash with the following properties
#   method: HTTP Method - default "POST"
#   data: The data to send to the server. If an object, will be converted to JSON and the content-type will
#         be defaulted to application/json. Anything else will be send literally.
#   headers: An object containing header key/value pairs
#   cache: A boolean which will turn of jquery caching if using jquery, else ignored
#   contentType: The content type of the request data. This will be set to "application/json; charset=UTF-8" if data is an
#                object, which is the default case.
#   dataType: Passed straight through to jquery ajax if using jquery, else ignored
#   ajaxDelay: Introduce a fixed delay before resolving the request. Useful for testing async scenarios
#   maxRetries: The number of times to retry a request that failed due to connectivity issues. Default 5
#   skipConversion: If true, object data will not be converted to JSON
#   withCredentials: A boolean indicating whether or not the with credentials xhrFlag should be set. Default is false
#
# Returns a deferred object with has an abort method added
#
ajaxRequest = (url, options = {}, trial = 0) ->
  status = $.Deferred()
  headers = options.headers ? {}
  data = options.data
  method = options.method ? "POST"

  ajaxDelay = options.ajaxDelay
  maxRetries = options.maxRetries ? 5

  contentType = options.contentType

  request = null

  successStatusCodes = [200, 202, 206]

  if data? && typeof data == "object" && options.skipConversion != true
    headers["Content-Type"] = "application/json"
    data = JSON.stringify(data)
    contentType = "application/json; charset=UTF-8"

  resolveStatus = (data) ->
    if ajaxDelay?
      setTimeout((() -> status.resolve(data)), ajaxDelay)
    else
      status.resolve(data)

  rejectStatus = (error) ->
    if ajaxDelay?
      setTimeout((() -> status.reject(error)), ajaxDelay)
    else
      status.reject(error)

    status.reject({type: "AjaxError", details: {jqXHR: error.details?.jqXHR ? {}}})

  try
    ajaxOptions =
      data: data
      headers: headers
      type: method
      url: url

      success: (data, textStatus, jqXHR) ->
        resolveStatus(data)

      # TODO: This doesn't distinguish between the API and auth server
      error: (jqXHR, textStatus, errorThrown) ->
        # Service unavailable, retry later
        if jqXHR.status == 503
          retryDelay = parseInt(jqXHR.getResponseHeader("Retry-After"), 10)
          retryDelay = 60 unless retryDelay? && isFinite(retryDelay) && retryDelay > 0

          rejectStatus({type: "AjaxRetryTimeout", details: {delay: retryDelay, serverError: JSON.parse(jqXHR.responseText).error}})

          # Try again after the retry delay
          setTimeout(() ->
            DX.ajaxRequest(url, options, trial).then(status.resolve, status.reject, status.notify)
          , retryDelay * 1000)
        else if textStatus == "error" && jqXHR.status == 0
          if trial > maxRetries
            rejectStatus({type: "AjaxError", details: {jqXHR: jqXHR}})
          else
            trial += 1
            setTimeout(
              () -> DX.ajaxRequest(url, options, trial).then(status.resolve, status.reject, status.notify),
              1000 * Math.pow(2, trial)
            )
        else
          # Skip aborts
          return if errorThrown == "abort" || textStatus == "abort" || status.aborted

          error = null

          # If the request timed out or didn't parse
          if textStatus == "timeout"
            error = {type: "AjaxTimeout", details: {url: url}}
          else if textStatus == "parsererror"
            error = {type: "AjaxError", details: {data: JSON.stringify(input)}}
          else
            try
              error = JSON.parse(jqXHR.responseText).error ? {type: "InvalidErrorResponse"}
            catch e
              error = {type: "InvalidErrorResponse", details: e}

          if error? && jqXHR.getResponseHeader("X-Request-ID")?
            error.requestID = jqXHR.getResponseHeader("X-Request-ID")

          rejectStatus(error)


    if options.withCredentials == true
      ajaxOptions.xhrFields =
        withCredentials: true

    ajaxOptions.cache = options.cache if options.cache?
    ajaxOptions.contentType = contentType if contentType?
    ajaxOptions.dataType = options.dataType if options.dataType?
    if navigator.onLine
      request = $.ajax(ajaxOptions)
    else
      status.reject({type: "InternetConnectionLost"})

    status.abort = () ->
      request.abort()

  catch e
    console.log("Unknown error during API call", e)
    request.abort() if request? && request.abort?
    rejectStatus({type: "UnknownError", details: e})

  return status

module.exports = ajaxRequest
