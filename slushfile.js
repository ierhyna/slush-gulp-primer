/*
 * slush-gulp-primer
 * https://github.com/ierhyna/slush-gulp-primer
 *
 * Copyright (c) 2015, Irina Sokolovskaja
 * Licensed under the MIT license.
 */

'use strict';

var gulp = require('gulp'),
  gutil = require('gulp-util'),
  install = require('gulp-install'),
  conflict = require('gulp-conflict'),
  template = require('gulp-template'),
  rename = require('gulp-rename'),
  _ = require('underscore.string'),
  inquirer = require('inquirer'),
  fs = require('fs'),
  path = require('path');

function format(string) {
  var username = string.toLowerCase();
  return username.replace(/\s/g, '');
}

var defaults = (function () {
  var workingDirName = path.basename(process.cwd()),
   homeDir, osUserName, configFile, user;

  if (process.platform === 'win32') {
    homeDir = process.env.USERPROFILE;
    osUserName = process.env.USERNAME || path.basename(homeDir).toLowerCase();
  }
  else {
    homeDir = process.env.HOME || process.env.HOMEPATH;
    osUserName = homeDir && homeDir.split('/').pop() || 'root';
  }

  configFile = path.join(homeDir, '.gitconfig');
  user = {};

  if (fs.existsSync(configFile)) {
    user = require('iniparser').parseSync(configFile).user;
  }

  return {
    appName: workingDirName,
    userName: osUserName || format(user.name || ''),
    authorName: user.name || '',
    authorEmail: user.email || ''
  };
})();

gulp.task('default', function (done) {
  var prompts = [{
    name: 'appName',
    message: 'What is the name of your project?',
    default: defaults.appName
  }, {
    name: 'appDescription',
    message: 'What is the description?'
  }, {
    name: 'appVersion',
    message: 'What is the version of your project?',
    default: '0.1.0'
  }, {
    name: 'authorName',
    message: 'What is the author name?',
    default: defaults.authorName
  }, {
    name: 'authorEmail',
    message: 'What is the author email?',
    default: defaults.authorEmail
  }, {
    type: 'list',
    name: 'gitTracker',
    message: 'What git tracker would you like to use?',
    choices: [{
      name: 'GitHub',
      value: 'useGitHub'
    }, {
      name: 'Bitbucket',
      value: 'useBitbucket'
    }]
  }, {
    name: 'userName',
    message: 'What is your username at the git tracker?',
    default: defaults.userName
  }, {
    type: 'confirm',
    name: 'moveon',
    message: 'Continue?'
  }];
  //Ask
  inquirer.prompt(prompts,
    function (answers) {
      if (!answers.moveon) {
        return done();
      }

      // app variables
      answers.appNameSlug = _.slugify(answers.appName);
      answers.useGitHub = (answers.gitTracker === 'useGitHub') ? true : false;
      answers.useBitbucket = (answers.gitTracker === 'useBitbucket') ? true : false;

      // gulp-notify messages
      answers.gnLine = '<%= error.line %>';
      answers.gnMessage = '<%= error.message %>';

      gulp.src(__dirname + '/templates/**')
        .pipe(template(answers))
        .pipe(rename(function (file) {
          if (file.basename[0] === '@') {
            file.basename = '.' + file.basename.slice(1);
          }
        }))
        .pipe(conflict('./'))
        .pipe(gulp.dest('./'))
        .pipe(install())
        .on('finish', function () {
          done();
        })
        .on('error', function () {
         gutil.log();
        });

      process.on('exit', function () {
        var skipInstall = process.argv.slice(2).indexOf('--skip-install') >= 0;

        if (skipInstall) {
          gutil.log('Dependencies installation skipped! \n Run', gutil.colors.yellow('`npm install --save`'), 'to install dependencies ');
        }
      });
  });
});
