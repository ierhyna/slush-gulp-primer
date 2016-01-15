'use strict';

var
  gulp = require('gulp'),
  util = require('gulp-util'),
  ftp = require('vinyl-ftp'),
  rigger = require('gulp-rigger'),
  sass = require('gulp-sass'),
  sourcemaps = require('gulp-sourcemaps'),
  autoprefixer = require('gulp-autoprefixer'),
  uglify =  require('gulp-uglify'),
  minifyCss = require('gulp-cssnano'),
  imagemin = require('gulp-imagemin'),
  pngquant = require('imagemin-pngquant'),
  changed = require('gulp-changed'),
  watch = require('gulp-watch'),
  notify = require('gulp-notify'),
  del = require('del'),
  browserSync = require('browser-sync'),
  reload = browserSync.reload,
  production = !!util.env.production,
  browserify = require('browserify'),
  source = require('vinyl-source-stream'),
  buffer = require('vinyl-buffer');

var path = {
  build: {
    html: 'dist',
    js: 'dist/js',
    style: 'dist/css',
    img: 'dist/img'
  },
  src: {
    html: 'html/*.html', 
    js: 'js/script.js',
    style: 'scss/*.scss',
    img: 'img/**/*.{jpg,jpeg,png,gif,svg}'
  },
  watch: {
    html: 'html/**/*.html', 
    js: 'js/*.js',
    style: 'scss/**/*.scss',
    img: 'img/**/*.{jpg,jpeg,png,gif,svg}'
  }
};

// Browser Sync
var config = {
  server: {
    baseDir: 'dist'
  },
  tunnel: false,
  host: 'localhost',
  port: 9090,
  logPrefix: 'Frontend_Devil'
};

gulp.task('webserver', function() {
  browserSync(config);
});

// Deploy via FTP
var ftpconf = {
  user: 'user',
  password: 'password',
  host: 'host',
  port: 21,
  dist: ['./dist/**'],
  remote: '/'
};

gulp.task('deploy', function() {
  var conn = ftp.create({
    host: ftpconf.host,
    port: ftpconf.port,
    user: ftpconf.user,
    password: ftpconf.password,
    parallel: 5,
    log: util.log
  });
  return gulp.src(ftpconf.dist, {base: './dist/', buffer: false})
    .pipe(conn.newer(ftpconf.remote)) // only upload newer files 
    .pipe(conn.dest(ftpconf.remote));
});

// HTML
gulp.task('build:html', function() {
  gulp.src(path.src.html)
    //.pipe(changed(path.build.html)) // only build changed files
    .pipe(rigger())
    .pipe(gulp.dest(path.build.html))
    .pipe(reload({stream: true}));
});

// Styles
gulp.task('build:css', function() {
  gulp.src(path.src.style)
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', notify.onError({
      title: 'SCSS error (in line <%= gnLine %>)',
      message: '<%= gnMessage %>'
    })))
    .pipe(autoprefixer())
    .pipe(production ? minifyCss() : util.noop())
    .pipe(!production ? sourcemaps.write() : util.noop())
    .pipe(gulp.dest(path.build.style))
    .pipe(reload({stream: true}));
});

// Scripts
gulp.task('build:js', function() {
  return browserify(path.src.js)
    .bundle().on('error', notify.onError({
      title: 'JS error',
      message: '<%= gnMessage %>'
    }))
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe(production ? uglify().on('error', notify.onError({
      title: 'JS error',
      message: '<%= gnMessage %>'
    })) : util.noop())
    .pipe(gulp.dest(path.build.js))
    .pipe(reload({stream: true}));
});

// Images
gulp.task('build:images', function() {
  gulp.src(path.src.img)
    .pipe(changed(path.build.img)) // only build changed files
    .pipe(imagemin({
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
      use: [pngquant()]
    }))
    .pipe(gulp.dest(path.build.img));
});

// Fonts
gulp.task('build:fonts', function() {
  gulp.src('./fonts/**/*.{ttf,woff,woff2,eot,svg}')
  .pipe(changed('./dist/fonts')) // only build changed files
  .pipe(gulp.dest('./dist/fonts'));
});

// Clean for production
gulp.task('clean', function() {
  production ? del('dist/*') : util.noop();
});

// Create dist
gulp.task('build', [
  'build:html',
  'build:css',
  'build:js',
  'build:fonts',
  'build:images'
]);

// Watch
gulp.task('watch', function(){
  watch([path.watch.html], function(event, cb) {
    gulp.start('build:html');
  });
  watch([path.watch.style], function(event, cb) {
    gulp.start('build:css');
  });
  watch([path.watch.js], function(event, cb) {
    gulp.start('build:js');
  });
  watch([path.watch.img], function(event, cb) {
    gulp.start('build:images');
  });
});

// Default task
gulp.task('default', ['build', 'watch', 'webserver']);
