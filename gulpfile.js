var gulp = require('gulp');
var spritesmith = require('gulp.spritesmith');
var dwebp = require('gulp-dwebp')
var imagemin = require('gulp-imagemin')
var imageresize = require('gulp-image-resize')
var extractFrames = require('gif-extract-frames')
var glob = require('glob')
var fs = require('fs')
var merge = require('merge-stream')

gulp.task('dwebp', () => {
  return gulp.src('./public/*.webp')
    .pipe(dwebp())
    .pipe(gulp.dest('./public/'))
});

gulp.task('squash', () => {
  return gulp.src('./public/*.{png,jpeg,tiff,svg,jpg}')
    .pipe(imageresize({width: 512}))
    .pipe(imagemin())
    .pipe(gulp.dest("./src/profile"))
});

gulp.task('gifexplode', () => {
  // create temp directory
  if (!fs.existsSync('./gif_temp')){
    fs.mkdirSync('./gif_temp');
  }

  // extract frames from gif
  return glob('./public/*.gif', (err, files) => {
    files.forEach((file) => {
      var sp = file.split("/")
      var filename = sp[sp.length - 1]

      if (!fs.existsSync('./gif_temp/' + filename.substring(0, filename.length - ".gif".length))){
        fs.mkdirSync('./gif_temp/' + filename.substring(0, filename.length - ".gif".length));
      }

      extractFrames({
        input: file,
        output: './gif_temp/' + filename.substring(0, filename.length - ".gif".length) + "/" + filename.substring(0, filename.length - ".gif".length) + "%d.png"
      })
    })
  })
})

gulp.task('giftopack', () => {
  // use the frames to create texturepack
  var tasks = []

  fs.readdirSync('./gif_temp/').forEach((dirname) => {
    tasks.push(gulp.src('./gif_temp/' + dirname + "/*.png")
      .pipe(imageresize({width: 512}))
      .pipe(imagemin())
      .pipe(spritesmith({
        imgName: dirname + ".png",
        cssName: dirname + ".json",
        cssFormat: "json_texture"
      }))
      .pipe(gulp.dest('./src/profile/'))
    )
  })

  return merge(tasks)
})