Api = require('../../src/api.coffee')
FileUpload = require('../../src/upload/file_upload.coffee')
ResourcePool = require('../../src/common/resource_pool.coffee')

class MockBlob
  constructor: (arr) ->
    @data = arr
    @size = arr.length
    @fail = false
    @failureMessage = "Expected failure"

  slice: (start, end) ->
    @data.slice(start, end)

class MockFileReader
  constructor: () ->

  readAsArrayBuffer: (blob) =>
    if blob.fail
      @error = blob.failureMessage
      @onerror?()
    else
      @result = blob.slice()
      @onload?()

global.FileReader = MockFileReader

makeMockFile = (size, name) ->
  baseString = "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  fileData = ""
  if size >= baseString.length
    for [0 ... Math.floor(size / baseString.length)]
      fileData += baseString
  fileData += baseString.substring(0, size % baseString.length)
  return {
    size: size
    name: name
    failOnRead: false
    lastModifiedDate: new Date(1321038660000)
    slice: (start, end) ->
      blob = new MockBlob(fileData.substring(start, end).split(""))
      if @failOnRead
        blob.fail = true
      return blob
    data: fileData
  }

uploadOptions =
  partSize: 10
  projectID: "project-1234"
  workerPool: new ResourcePool([])
  uploadPool: new ResourcePool([])
  fileCreationPool: new ResourcePool([])
  api: new Api("ABC123")


describe "makeMockFile", ->
  describe "data length", ->
    it "should match the file's size", ->
      file = makeMockFile(0, "")
      file.data.length.should.equal(0)

      file = makeMockFile(10, "")
      file.data.length.should.equal(10)

      file = makeMockFile(36, "")
      file.data.length.should.equal(36)

      file = makeMockFile(72, "")
      file.data.length.should.equal(72)

      file = makeMockFile(100, "")
      file.data.length.should.equal(100)
  describe "data content", ->
    it "should match the static string", ->
      file = makeMockFile(10, "")
      file.data.substring(2, 3).should.equal("3")

      file = makeMockFile(50, "")
      file.data.substring(38,39).should.equal("3")

describe "MockBlob", ->
  describe "slice", ->
    it "should behave as Array.slice", ->
      blob = new MockBlob([1,2,3,4,5])
      blob.slice(0, 1)[0].should.equal(1)
      blob.slice(0, 1).length.should.equal(1)
      blob.slice().length.should.equal(5)
      blob.slice(2, 4)[1].should.equal(4)
  describe "size", ->
    it "should match the given array size", ->
      blob = new MockBlob([])
      blob.size.should.equal(0)

      blob = new MockBlob([1,2,3,4,5])
      blob.size.should.equal(5)

describe "MockFileReader", ->
  describe "readAsArrayBuffer", ->
    it "should return the full Blob passed in", (done) ->
      blob = new MockBlob([1, 2, 3, 4, 5])
      reader = new MockFileReader()
      reader.onload = () ->
        reader.result.length.should.equal(5)
        reader.result[0].should.equal(1)
        reader.result[4].should.equal(5)
        done()
      reader.readAsArrayBuffer(blob)


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

  describe "readBytes", ->
    fileUpload = new FileUpload(makeMockFile(15, "file.txt"), uploadOptions)
    it "should read all bytes", (done) ->
      byteDeferred = fileUpload.readBytes().done((arr) ->
        arr.length.should.equal(15)
        arr[0].should.equal("1")
        arr[14].should.equal("E")
        done()
      )
    it "should read bytes 5-10", (done) ->
      byteDeferred = fileUpload.readBytes(5, 5).done((arr) ->
        arr.length.should.equal(5)
        arr[0].should.equal("6")
        arr[4].should.equal("0")
        done()
      )
    it "should read all remaining bytes", (done) ->
      byteDeferred = fileUpload.readBytes(3).done((arr) ->
        arr.length.should.equal(12)
        arr[0].should.equal("4")
        done()
      )
    it "should return a shorter array if requested length is too long", (done) ->
      byteDeferred = fileUpload.readBytes(10, 10).done((arr) ->
        arr.length.should.equal(5)
        done()
      )
    it "should read the last N bytes", (done) ->
      byteDeferred = fileUpload.readBytes(-4).done((arr) ->
        arr.length.should.equal(4)
        arr[0].should.equal("B")
        done()
      )
    it "should read the last N bytes with a length", (done) ->
      byteDeferred = fileUpload.readBytes(-5, 2).done((arr) ->
        arr.length.should.equal(2)
        arr[0].should.equal("A")
        done()
      )
    it "should limit negative offset to the beginning of the file", (done) ->
      byteDeferred = fileUpload.readBytes(-100).done((arr) ->
        arr.length.should.equal(15)
        arr[0].should.equal("1")
        done()
      )
    it "should return an empty array with overly large offsets", (done) ->
      byteDeferred = fileUpload.readBytes(100).done((arr) ->
        arr.length.should.equal(0)
        done()
      )
    it "should return arrays of length 0", (done) ->
      byteDeferred = fileUpload.readBytes(0, 0).done((arr) ->
        arr.length.should.equal(0)
        done()
      )
    it "should treat negative lengths as 0", (done) ->
      byteDeferred = fileUpload.readBytes(0, -1).done((arr) ->
        arr.length.should.equal(0)
        done()
      )
    it "should fail over to alternative slice functions", (done) ->
      upload = new FileUpload(makeMockFile(10, "file.txt"), uploadOptions)
      upload.file.mozSlice = upload.file.slice
      delete(upload.file.slice)
      byteDeferred = upload.readBytes().done((arr) ->
        arr.length.should.equal(10)
        done()
      )
    it "should fail if no slice function is found", (done) ->
      upload = new FileUpload(makeMockFile(10, "file.txt"), uploadOptions)
      delete(upload.file.slice)
      byteDeferred = upload.readBytes().fail((response) ->
        response.should.equal("No slice function found for file.txt")
        done()
      )
    it "should reject if the file can't be read", (done) ->
      upload = new FileUpload(makeMockFile(10, "file.txt"), uploadOptions)
      upload.file.failOnRead = true
      byteDeferred = upload.readBytes().fail((response) ->
        response.should.equal("Expected failure")
        done()
      )
)
