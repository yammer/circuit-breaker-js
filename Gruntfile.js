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
          'lib/**/*.js'
        ],
        options: {
          specs:   'spec/**/*.js',
          helpers: 'vendor/**/*.js'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jasmine');

  grunt.registerTask('test',
    'Runs the test suite in PhantomJS',
    ['jasmine:all']);

  grunt.registerTask('test:browser',
    'Runs the test suite in a browser',
    ['jasmine:all:build', 'connect:test:keepalive']);

  grunt.registerTask('default',
    ['test']);

};
