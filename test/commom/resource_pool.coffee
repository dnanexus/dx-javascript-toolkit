ResourcePool = require('../../src/common/resource_pool.coffee')

describe("ResourcePool", ->

  describe("#acquire()", ->
    pool = new ResourcePool(["a", "b", "c"])
    it('should resolve to a resource when the pool is not empty', (done) ->
      pool.acquire().done ->
        pool.getNumberAvailable().should.equal(2)
        done()
    )
    it('should resolve to a resource when the pool is not empty', (done) ->
      pool.acquire().done(() -> done())
    )
    it('should resolve to a resource when the pool is not empty', (done) ->
      pool.acquire().done(() -> done())
    )

    it('should not resolve to a resource when the pool is empty', (done) ->
      pool.getNumberAvailable().should.equal(0)
      pool.acquire().done(() ->
        done("Got resource from an empty pool")
      )
      setTimeout(done, 10)
    )

    it('should not resolve to a resource when the pool is closed', (done) ->
      pool = new ResourcePool(["a"])
      pool.getNumberAvailable().should.equal(1)
      pool.close()
      pool.acquire().done(() ->
        done("Got a resource when open")
      )
      setTimeout(done, 10)
    )

    it('should resolve to a resource when the pool is re-opened', (done) ->
      pool = new ResourcePool(["a"])
      pool.getNumberAvailable().should.equal(1)
      pool.close()
      pool.acquire().done(() ->
        done()
      )
      pool.open()
    )
  )

  describe("#acquire() when replentished", ->
    pool = new ResourcePool([])
    it('should resolve to a resource when the pool is replentished', (done) ->
      pool.acquire().done(() -> done())
      setTimeout((() -> pool.release("a")), 10)
    )
  )
)
