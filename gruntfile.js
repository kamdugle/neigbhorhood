/*
 After you have changed the settings under responsive_images
 run this with one of these options:
  "grunt" alone creates a new, completed images directory
  "grunt clean" removes the images directory
  "grunt responsive_images" re-processes images without removing the old ones
*/

module.exports = function(grunt) {

  grunt.initConfig({
    responsive_images: {
      dev: {
        options: {
          engine: 'gm',
          sizes: [
          {
            /* Change these */
            width: '489px',
            height: '389px',
            quality: 100,
            aspectRatio: false
          }]
        },

        /*
        You don't need to change this part if you don't change
        the directory structure.
        */
        files: [{
          expand: true,
          src: ['*.{gif,jpg,png}'],
          cwd: 'images_src/',
          dest: 'images/'
        }]
      }
    },

    /* Clear out the images directory if it exists */
    clean: {
      dev: {
        src: ['images'],
      },
    },

    /* Generate the images directory if it is missing */
    mkdir: {
      dev: {
        options: {
          create: ['images']
        },
      },
    },

    copy: {
      main: {
        files: [
          // includes files within path
          //{expand: true, src: ['path/*'], dest: 'dest/', filter: 'isFile'},

          // includes files within path and its sub-directories
          //{expand: true, src: ['path/**'], dest: 'dest/'},

          // makes all src relative to cwd
          {expand: true, cwd: 'src/', src: ['*'], dest: 'dest/',  filter: 'isFile'},
          {expand: true, cwd: 'src/', src: ['styles/*'], dest: 'dest/'},
          {expand: true, cwd: 'src/', src: ['bower_components/normalize-css/normalize.css'], dest: 'dest/'},
          {expand: true, cwd: 'src/', src: ['bower_components/jquery/dist/jquery.min.js'], dest: 'dest/'},
          {expand: true, cwd: 'src/', src: ['bower_components/knockout/dist/knockout.js'], dest: 'dest/'},
          {expand: true, cwd: 'src/', src: ['img/*'], dest: 'dest/', filter: 'isFile'}
          // flattens results to a single level
          //{expand: true, flatten: true, src: ['path/**'], dest: 'dest/', filter: 'isFile'},
        ],
      },
    }

  });

  grunt.loadNpmTasks('grunt-responsive-images');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-mkdir');
  //grunt.registerTask('prep', ['clean', 'mkdir', 'responsive_images']);
  grunt.registerTask('default', 'copy');

};
