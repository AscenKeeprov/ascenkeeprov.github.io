'use strict';

const browserSync = require('browser-sync').create();
const childProcess = require('child_process');
const gulp = require('gulp');
const gulpAutoprefixer = require('gulp-autoprefixer');
const gulpImagemin = require('gulp-imagemin');
const gulpSass = require('gulp-sass');

function jekyllClean() {
	return childProcess.exec('bundle exec jekyll clean', (exception, stdout, stderr) => {
		if (exception) {
			console.log(exception.stack);
			console.log(`Child process exited with code ${exception.code}`);
			return;
		}
		console.error(stderr);
		console.log(stdout);
	});
}

function jekyllBuild() {
	return childProcess.spawn('bundle', ['exec', 'jekyll', 'build'], { shell: true, stdio: 'inherit' });
}

function loadImages() {
	return gulp.src('./_assets/images/**/*')
		.pipe(gulpImagemin())
		.pipe(gulp.dest('./_site/images'));
}

function loadScripts() {
	return gulp.src('./_assets/scripts/**/*')
		.pipe(gulp.dest('./_site/scripts'));
}

function loadStyles() {
	return gulp.src('./_assets/styles/**/*.css')
		.pipe(gulp.dest('./_site/styles/'))
		.pipe(gulpSass().on('error', gulpSass.logError))
		.pipe(browserSync.stream({ match: '**/*.css' }))
		.pipe(gulpAutoprefixer());
}

gulp.task('watch', function () {
	browserSync.init({
		port: 8080,
		server: {
			baseDir: './_site/'
		},
		ui: {
			port: 9090
		}
	});

	gulp.watch([
		'./*.html',
		'./_includes/**/*.html',
		'./_layouts/**/*.html'])
		.on('change', gulp.series(jekyllBuild, loadScripts, loadStyles));

	gulp.watch('_assets/styles/**/*.css', loadStyles);
	gulp.watch('_site/**/*.html').on('change', () => browserSync.reload({ stream: true }));
	gulp.watch('_site/**/*.js').on('change', browserSync.reload);
});

exports.clean = jekyllClean;
exports.default = gulp.series(jekyllClean, jekyllBuild, loadScripts, loadStyles, loadImages, 'watch');
