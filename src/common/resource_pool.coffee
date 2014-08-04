class ResourcePool
  constructor: (@_resources) ->
    @_queue = []
    @_closed = false

  acquire: () ->
    resolver = $.Deferred()
    if @_resources.length > 0 && !@_closed
      resolver.resolve(@_resources.shift())
    else
      @_queue.push(resolver)
    return resolver

  # Closes the resource pool, such that no more resources can be acquired.
  close: () ->
    @_closed = true

  getNumberAvailable: () ->
    return if @_closed then 0 else @_resources.length

  release: (resource) ->
    if @_queue.length > 0 && !@_closed
      @_queue.shift().resolve(resource)
    else
      @_resources.push(resource)

  # Opens the resource pool, which will immediately release all available resources
  open: () ->
    return unless @_closed
    @_closed = false

    for resource in @_resources
      @release(resource)

module.exports = ResourcePool
