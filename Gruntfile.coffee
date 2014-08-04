module.exports = (grunt) ->
  grunt.initConfig({
    browserify:
      dist:
        options:
          transform: ['coffeeify']
        files:
          'target/dnanexus.js': ['src/dnanexus.coffee']
          'target/dnanexus-upload.js': ['src/dnanexus_upload.coffee']

    copy:
      getting_started:
        cwd: "releases/latest/"
        expand: true
        src: ['dnanexus-0*.js']
        dest: 'examples/getting-started'
      uploading_files_basic:
        cwd: "releases/latest/"
        expand: true
        src: ['dnanexus-upload*.js']
        dest: 'examples/uploading-files-progress'
      uploading_files_progress:
        cwd: "releases/latest/"
        expand: true
        src: ['dnanexus-upload*.js']
        dest: 'examples/uploading-files-basic'

    watch:
      src:
        files: ['src/**/*.coffee']
        tasks: ['default']

    pkg: grunt.file.readJSON("package.json")
  })

  grunt.loadNpmTasks('grunt-browserify')
  grunt.loadNpmTasks('grunt-contrib-copy')
  grunt.loadNpmTasks('grunt-contrib-watch')

  grunt.registerTask('default', ['browserify', 'copy'])
