var gulp = require('gulp');
var spritesmith = require('gulp.spritesmith');
var dwebp = require('gulp-dwebp')
var imagemin = require('gulp-imagemin')
var imageresize = require('gulp-image-resize')

gulp.task('dwebp', () => {
  return gulp.src('./public/*.webp')
    .pipe(dwebp())
    .pipe(gulp.dest('./public/'))
});

gulp.task('squash', () => {
  return gulp.src('./public/*.{png,jpeg,tiff,svg,gif}')
    .pipe(imageresize({width: 1000}))
    .pipe(imagemin())
    .pipe(gulp.dest("./src/profile"))
});