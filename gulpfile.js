var gulp = require('gulp');
var fs = require('fs');
var browserify = require('browserify');
var watchify = require('watchify');
var babelify = require('babelify');
var rimraf = require('rimraf');
var source = require('vinyl-source-stream');
var _ = require('lodash');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var sass        = require('gulp-sass');
var gutil = require('gulp-util');
var newer = require('gulp-newer');
var imagemin = require('gulp-imagemin');

var config = {
  entryFile: './src/javascript/index.js',
  outputDir: './build/',
  outputFile: 'build.js'
};

// clean the output directory
gulp.task('clean', function(cb){
    rimraf(config.outputDir + "javascript", cb);
});

var bundler;
function getBundler() {
  if (!bundler) {
    bundler = watchify(browserify(config.entryFile, _.extend({ debug: true }, watchify.args)));
  }
  return bundler;
};

function bundle() {
  return getBundler()
    .transform(babelify)
    .bundle()
    .on('error', function(err) { console.log('Error: ' + err.message); })
    .pipe(source(config.outputFile ))
    .pipe(gulp.dest(config.outputDir + "javascript"))
    .pipe(reload({ stream: true }));
}

gulp.task('build-persistent', ['clean'], function() {
  return bundle();
});

gulp.task('build', ['build-persistent'], function() {
  process.exit(0);
});

gulp.task('watch', ['build-persistent'], function() {

  browserSync({
    server: {
      baseDir: './'
    }
  });

  getBundler().on('update', function() {
    gulp.start('build-persistent')
  });
});

// html stuff
gulp.task('html', function() {
  return gulp.src('*.html')
  .pipe(reload({stream:true})); // inject into browsers
});

// Sass task, will run when any SCSS files change.
gulp.task('styles', function () {
  return gulp.src('src/scss/style.scss')
  .pipe(sass({includePaths: ['scss']})) // compile sass
  .pipe(gulp.dest(config.outputDir + "stylesheets")) // write to css dir
  .pipe(reload({stream:true})); // inject into browsers
});

// Fonts and such
gulp.task('copyfiles', function() {
    gulp.src('src/**/*.{ttf,woff,woff2,eof,svg,jpg,jpeg,png,gif}')
    .on('end', function(){ gutil.log('copying there...'); })
    .pipe(gulp.dest('build'))
    .on('end', function(){ gutil.log('put in build...'); });
});

// Images
gulp.task('images', function() {
  return gulp.src('src/images/**')
  .pipe(newer('build/images'))
  .pipe(imagemin())
  .pipe(gulp.dest('build/images'));
});

// WEB SERVER
gulp.task('serve', function () {
  browserSync({
    server: {
      baseDir: './'
    }
  });
});

gulp.task('default', ['styles', 'images', 'watch'], function () {
  gulp.watch("src/**/*.{ttf,woff,woff2,eof}", ['copyfiles']);
  gulp.watch("src/images/**", ['images']);
  gulp.watch("src/scss/**/*.scss", ['styles']);
  gulp.watch("*.html", ['html']);
});
