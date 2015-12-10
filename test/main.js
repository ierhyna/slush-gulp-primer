'use strict';
var should = require('should'),
  inquirer = require('inquirer'),
  gulp = require('gulp'),
  mockGulpDest = require('mock-gulp-dest')(gulp);

require('../slushfile');

function mockPrompt(answers) {
  inquirer.prompt = function (prompts, done) {

    [].concat(prompts).forEach(function (prompt) {
      if (!(prompt.name in answers)) {
        answers[prompt.name] = prompt.default;
      }
    });

    done(answers);
  };
}

describe('slush-gulp-primer', function() {
  before(function () {
    process.chdir(__dirname);
    process.argv.push('--skip-install');
  });

  describe('default generator', function () {
    beforeEach(function () {
      mockPrompt({
        features: [],
        moveon: true
      });
    });

    it('should put all project files in current working directory', function (done) {
      gulp.start('default').once('stop', function () {
        mockGulpDest.cwd().should.equal(__dirname);
        mockGulpDest.basePath().should.equal(__dirname);
        done();
      });
    });

    it('should create expected files', function (done) {
      gulp.start('default').once('stop', function () {
        mockGulpDest.assertDestContains([
          '.eslintrc',
          '.gitignore',
          '.scss-lint.yml',
          'package.json',
          'bower.json',
          'gulpfile.js',
          'html/index.html',
          'js/script.js',
          'scss/style.scss'
        ]);

        done();
      });
    });
  });
});
