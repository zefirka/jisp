var gulp = require('gulp');
var browserify = require('gulp-browserify');
 
// Basic usage 
gulp.task('default', function() {
    
    // Single entry point to browserify 
    gulp.src('src/jisp.js')
        .pipe(browserify({
        	debug : true
        }))
        .pipe(gulp.dest('./dist/'))
});