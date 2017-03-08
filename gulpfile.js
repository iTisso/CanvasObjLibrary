var browserify = require('browserify');
var babelify = require('babelify');
var gulp = require('gulp');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('build', function () {
	var b = browserify(['CanvasObjLibrary.js'],{
		basedir:'./src',
		debug: true,
		transform: [babelify.configure({
			presets: ['es2015']
		})]
	});

	return b.bundle()
		.pipe(source('./CanvasObjLibrary.js'))
		.pipe(buffer())
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest('./dist'));
});

gulp.task('min',function(){
		let options = {
				mangle: true,
				compress: {
						sequences: true,
						conditionals: true,
						dead_code: true,
						booleans: true,
						if_return: true,
						join_vars: true,
						comparisons:true,
						evaluate:true,
				}
		};
		return gulp.src('./dist/*.js')
		.pipe(rename({extname:'.min.js'}))
		.pipe(uglify(options))
		.pipe(gulp.dest('./dist/'));
});