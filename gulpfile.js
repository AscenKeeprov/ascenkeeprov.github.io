'use strict';

const browserSync = require('browser-sync').create();
const childProcess = require('child_process');
const cssMinifier = require('cssnano');
const cssPrefixer = require('autoprefixer');
const cssProcessor = require('gulp-postcss');
const fileCombiner = require('gulp-concat');
const gulp = require('gulp');
const imageMinifier = require('gulp-imagemin');
const jsMinifier = require('gulp-terser');
const sourceMapper = require('gulp-sourcemaps');
const sassCompiler = require('gulp-sass');
const siteAssetsDir = '_assets';
const siteFragmentsDir = '_includes';
const siteLayoutsDir = '_layouts';
const siteOutputDir = 'docs';
const supportedFontTypes = '{ttf,woff?(2)}';
const supportedImageTypes = '{gif,ico,jp?(e)g,png}';
const supportedPageTypes = 'html';
const supportedScriptTypes = 'js';
const supportedStyleTypes = '?(s)css';

function jekyllClean() {
	return childProcess.exec('bundle exec jekyll clean', (exception, stdout, stderr) => {
		if (exception) {
			console.log(exception.stack);
			console.log(`Child process exited with code ${exception.code}`);
			return;
		}
		if (stderr) console.error(stderr);
		console.log(stdout);
	});
}

function jekyllBuild() {
	return childProcess.spawn('bundle', ['exec', 'jekyll', 'build'], { shell: true, stdio: 'inherit' });
}

function loadAssets() {
	return gulp.parallel(loadScripts, loadStyles, loadImages, loadFonts);
}

function loadFonts() {
	return gulp.src(`./${siteAssetsDir}/fonts/**/*.${supportedFontTypes}`)
		.pipe(gulp.dest(`./${siteOutputDir}/fonts`));
}

function loadImages() {
	return gulp.src(`./${siteAssetsDir}/images/**/*.${supportedImageTypes}`)
		.pipe(imageMinifier())
		.pipe(gulp.dest(`./${siteOutputDir}/images`));
}

function loadScripts() {
	return gulp.src(`./${siteAssetsDir}/scripts/**/*.${supportedScriptTypes}`)
		.pipe(fileCombiner('site.min.js'))
		.pipe(sourceMapper.init())
		.pipe(jsMinifier())
		.pipe(sourceMapper.write('./'))
		.pipe(gulp.dest(`./${siteOutputDir}/scripts`));
}

function loadStyles() {
	let plugins = [
		cssMinifier(),
		cssPrefixer()
	];
	return gulp.src(`./${siteAssetsDir}/styles/**/*.${supportedStyleTypes}`)
		.pipe(sassCompiler().on('error', sassCompiler.logError))
		.pipe(sourceMapper.init())
		.pipe(cssProcessor(plugins))
		.pipe(fileCombiner('site.min.css'))
		.pipe(sourceMapper.write('./'))
		.pipe(gulp.dest(`./${siteOutputDir}/styles`))
		.pipe(browserSync.stream({ match: '**/*.css' }));
}

function watchForChanges() {
	browserSync.init({
		port: 8080,
		server: { baseDir: `./${siteOutputDir}/` },
		ui: { port: 9090 }
	});

	let pageSource = [
		`./*.${supportedPageTypes}`,
		`./${siteFragmentsDir}/**/*.${supportedPageTypes}`,
		`./${siteLayoutsDir}/**/*.${supportedPageTypes}`
	];
	let jekyllRebuildSequence = gulp.series(jekyllBuild, loadAssets(), browserSync.reload);
	gulp.watch(pageSource).on('add', jekyllRebuildSequence);
	gulp.watch(pageSource).on('change', jekyllRebuildSequence);
	gulp.watch(pageSource).on('unlink', jekyllRebuildSequence);

	let fontsReloadSequence = gulp.series(loadFonts, browserSync.reload);
	let fontSource = `./${siteAssetsDir}/fonts/**/*.${supportedFontTypes}`;
	gulp.watch(fontSource).on('add', fontsReloadSequence);
	gulp.watch(fontSource).on('change', fontsReloadSequence);
	gulp.watch(fontSource).on('unlink', fontsReloadSequence);

	let imagesReloadSequence = gulp.series(loadImages, browserSync.reload);
	let imageSource = `./${siteAssetsDir}/images/**/*.${supportedImageTypes}`;
	gulp.watch(imageSource).on('add', imagesReloadSequence);
	gulp.watch(imageSource).on('change', imagesReloadSequence);
	gulp.watch(imageSource).on('unlink', imagesReloadSequence);

	let scriptsReloadSequence = gulp.series(loadScripts, browserSync.reload);
	let scriptSource = `./${siteAssetsDir}/scripts/**/*.${supportedScriptTypes}`;
	gulp.watch(scriptSource).on('add', scriptsReloadSequence);
	gulp.watch(scriptSource).on('change', scriptsReloadSequence);
	gulp.watch(scriptSource).on('unlink', scriptsReloadSequence);

	let stylesReloadSequence = gulp.series(loadStyles, browserSync.reload);
	let styleSource = `./${siteAssetsDir}/styles/**/*.${supportedStyleTypes}`;
	gulp.watch(styleSource).on('add', stylesReloadSequence);
	gulp.watch(styleSource).on('change', stylesReloadSequence);
	gulp.watch(styleSource).on('unlink', stylesReloadSequence);
}

exports.clean = jekyllClean;
exports.default = gulp.series(jekyllClean, jekyllBuild, loadAssets(), watchForChanges);
