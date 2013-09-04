module.exports = function(grunt) {

  grunt.initConfig({
    connect: {
      test: {
        options: {
          hostname: '*',
          port:     4000
        }
      }
    },

    jasmine: {
      all: {
        src: [
          'circuit-breaker.js'
        ],
        options: {
          specs:   'spec/**/*.js'
        }
      }
    },

    jshint: {
      all: ['Gruntfile.js', 'circuit-breaker.js'],
      options: {
        jshintrc: '.jshintrc'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('lint',
    'Lints the source',
    ['jshint:all']);

  grunt.registerTask('test',
    'Runs the test suite in PhantomJS',
    ['jasmine:all']);

  grunt.registerTask('test:browser',
    'Runs the test suite in a browser',
    ['jasmine:all:build', 'connect:test:keepalive']);

  grunt.registerTask('default',
    ['lint', 'test']);

};
