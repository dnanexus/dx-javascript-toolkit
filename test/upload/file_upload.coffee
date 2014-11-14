Api = require('../../src/api.coffee')
FileUpload = require('../../src/upload/file_upload.coffee')
ResourcePool = require('../../src/common/resource_pool.coffee')

makeMockFile = (size, name) ->
  return {
    size: size
    name: name
    lastModifiedDate: new Date(1321038660000)
  }

uploadOptions =
  partSize: 10
  projectID: "project-1234"
  workerPool: new ResourcePool([])
  uploadPool: new ResourcePool([])
  fileCreationPool: new ResourcePool([])
  api: new Api("ABC123")

describe("FileUpload", ->

  describe("#constructor()", ->
    it('should calculate the number of parts correctly', ->
      fileUpload = new FileUpload(makeMockFile(100, "file.txt"), uploadOptions)
      fileUpload.numParts.should.equal(10)

      fileUpload = new FileUpload(makeMockFile(0, "file.txt"), uploadOptions)
      fileUpload.numParts.should.equal(1)

      fileUpload = new FileUpload(makeMockFile(101, "file.txt"), uploadOptions)
      fileUpload.numParts.should.equal(11)
    )
  )
)
