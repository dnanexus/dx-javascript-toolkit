global.window = require("jsdom").jsdom().createWindow()
global.document = window.document
global.$ = require('jquery')
should = require('should')
