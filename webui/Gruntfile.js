'use strict';

module.exports = function (grunt) {
  // load all tasks defined in node_modules starting with 'grunt-'
  require('load-grunt-tasks')(grunt);
  grunt.loadNpmTasks('grunt-ng-annotate');

  var buildConfig = {
    src: 'app/',
    dist: 'dist/',
    name: 'openattic-web',
    applicationFiles: [
      '<%= buildConfig.src %>scripts/module_extensions.js',
      '<%= buildConfig.src %>scripts/**/module.js',
      '<%= buildConfig.src %>scripts/services/*.js',
      '<%= buildConfig.src %>scripts/**/*.js',
      '<%= buildConfig.src %>components/**/module.js',
      '<%= buildConfig.src %>components/services/*.js',
      '<%= buildConfig.src %>components/**/*.js',
      '<%= buildConfig.src %>extensions/**/module.js',
      '<%= buildConfig.src %>extensions/services/*.js',
      '<%= buildConfig.src %>extensions/**/*.js'
    ],
    watchFiles: [
      '<%= buildConfig.src %>*.tpl.html',
      '<%= buildConfig.src %>scripts/**/*.js',
      '<%= buildConfig.src %>components/**/*.js',
      '<%= buildConfig.src %>extensions/**/*.js'
    ]
  };

  grunt.initConfig({
      buildConfig: buildConfig,

      // defines files to be watched and tasks to be executed on change of any file matching the file spec
      watch: {
        dev: {
          files: buildConfig.watchFiles,
          tasks: ['htmlbuild', 'jshint']
        }
      },

      // delete all files from previous builds
      clean: {
        dist: [
          '<%= buildConfig.dist %>*'
        ]
      },

      /*  Generate index.html
       Inserts all project scripts and styles into 'htmlbuild:' prefixed html comment blocks from 'index.tpl.html'.
       */
      htmlbuild: {
        dev_index: {
          src: '<%= buildConfig.src %>index.tpl.html',
          dest: '<%= buildConfig.src %>index.html',
          options: {
            relative: true,
            prefix: 'scripts/',
            parseTag: 'htmlbuild',
            scripts: {
              src: {
                files: buildConfig.applicationFiles
              }
            },
            styles: {
              bundle: [
                '<%= buildConfig.src %>styles/**/*.css'
              ]
            }
          }
        }
      },

      // check source files for violations of jshint rules defined in .jshintrc
      jshint: {
        options: {
          jshintrc: '.jshintrc'
        },
        all: [
          '<%= buildConfig.src %>scripts/{,*/}*.js',
          '<%= buildConfig.src %>components/{,**/}*.js',
          '!<%= buildConfig.src %>components/smartadmin/{,**/}*.js',
        ]
      },

      // Prepare angular js files for minification (prevent dependency injection from breaking)
      ngAnnotate: {
        dist: {
          files: [
            {
              expand: true,
              cwd: buildConfig.dist,
              src: ['oa-app.js'],
              dest: buildConfig.dist
            }
          ]
        }
      },

      // copy all .html files to dist folder
      copy: {
        dist: {
          files: [
            {
              expand: true,
              cwd: buildConfig.src,
              src: ['index.html', '**/*.html', '!*.tpl.html'],
              dest: buildConfig.dist
            },
            {
              expand: true,
              cwd: buildConfig.src,
              src: ['bower_components/**', 'fonts/**', 'images/**'],
              dest: buildConfig.dist
            }
          ]
        }
      },

      // add revision numbers to js and css files to avoid caching problems
      rev: {
        files: {
          src: ['<%= buildConfig.dist %>*.{js,css}']
        }
      },

      /*  gather all files for concatination -> resolved from build:js, build:css comments in index.html
       This task also generates configurations for 'concat', 'cssmin' and 'uglify' tasks referenced in build task
       */
      useminPrepare: {
        html: ['<%= buildConfig.src %>/index.html'],
        options: {
          dest: buildConfig.dist
        }
      },

      // replaces js and css includes in index.html
      usemin: {
        html: ['<%= buildConfig.dist %>/index.html']
      }
    }
  );

  grunt.registerTask('dev', [
    'htmlbuild',
    'watch'
  ]);

  grunt.registerTask('default', [
    'dev'
  ]);

  grunt.registerTask('build', [
    'clean',
    'htmlbuild',
    'useminPrepare',
    'copy',
    'concat',
    'cssmin',
    'ngAnnotate',
    'uglify',
    'rev',
    'usemin'
  ]);
};
