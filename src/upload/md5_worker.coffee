class MD5Worker
  constructor: (@_sparkMD5Src) ->
    @keyToDeferred = {}
    @worker = @_makeMD5WebWorker()

  computeMD5: (slice) ->
    key = @_makeKey()

    @keyToDeferred[key] = $.Deferred()

    @worker.computeMD5(key, slice, (result) =>
      if typeof result == "object" && result.error?
        @keyToDeferred[key].reject(result)
      else
        @keyToDeferred[key].resolve(result)
    )

    return @keyToDeferred[key]

  terminate: () ->
    @worker.destroy()

  _makeKey: () ->
    Date.now().toString() + "-" + Math.round(Math.random() * 9999999)

  _makeMD5WebWorker: () ->
    worker = operative({
      computeMD5: (key, slice) ->
        reader = new FileReaderSync()

        try
          fileData = reader.readAsArrayBuffer(slice)
          md5Hex = SparkMD5.ArrayBuffer.hash(fileData)
          return md5Hex
        catch error
          return {error: error.name, message: error.message}

    }, [@_sparkMD5Src])

    return worker

module.exports = MD5Worker
