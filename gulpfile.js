'use strict';

const browserSync = require('browser-sync').create();
const cssMinifier = require('cssnano');
const cssPrefixer = require('autoprefixer');
const cssProcessor = require('gulp-postcss');
const fileCombiner = require('gulp-concat');
const fileManager = require('fs');
const gulp = require('gulp');
const imageMinifier = require('gulp-imagemin');
const ioManager = require('readline').createInterface({
	input: process.stdin,
	output: process.stdout
});
const jsMinifier = require('gulp-terser');
const processManager = require('child_process');
const sassProcessor = require('gulp-sass');
const sourceMapper = require('gulp-sourcemaps');
const supportedFontTypes = '{ttf,woff?(2)}';
const supportedImageTypes = '{gif,ico,jp?(e)g,png}';
const supportedPageTypes = 'html';
const supportedScriptTypes = 'js';
const supportedStyleTypes = '?(s)css';
const yamlParser = require('js-yaml');

let config = getJekyllConfig('./_config.yml');

sassProcessor.compiler = require('node-sass');

function deployGithubPage() {
	ioManager.question('Commit message: ', (message) => {
		let deployScript = [
			'git add .',
			`git commit --all --message "${message}" --cleanup=strip`,
			'git push origin master'
		].join(' && ');
		ioManager.close();
		return processManager.exec(deployScript, (exception, stdout, stderr) => {
			if (exception) {
				console.log(`GitHub deployment failed with code ${exception.code}`);
				console.log(exception.stack);
			}
			if (stderr) console.error(stderr);
			console.log(stdout);
			return;
		});
	});
}

function getJekyllConfig(configFilePath) {
	try {
		let configObj = {};
		let jekyllConfig = yamlParser.safeLoad(fileManager.readFileSync(configFilePath, { encoding: 'utf8' }));
		configObj.assetsPath = `./${jekyllConfig.assets_dir}`;
		configObj.collectionsPath = `./${jekyllConfig.collections_dir}`;
		configObj.layoutsPath = `./${jekyllConfig.layouts_dir}`;
		configObj.outputPath = `./${jekyllConfig.destination}`;
		configObj.partialsPath = `./${jekyllConfig.includes_dir}`;
		configObj.deployUrl = `git@github.com:${jekyllConfig.repository}`;
		return configObj;
	} catch (e) {
		console.error(e);
	}
}

function jekyllClean() {
	return processManager.exec('bundle exec jekyll clean', (exception, stdout, stderr) => {
		if (exception) {
			console.log(`Jekyll cleanup failed with code ${exception.code}`);
			console.log(exception.stack);
		}
		if (stderr) console.error(stderr);
		console.log(stdout);
		return;
	});
}

function jekyllBuild() {
	return processManager.spawn('bundle', ['exec', 'jekyll', 'build'], { shell: true, stdio: 'inherit' });
}

function loadAssets() {
	return gulp.parallel(loadScripts, loadStyles, loadImages, loadFonts);
}

function loadFonts() {
	return gulp.src(`${config.assetsPath}/fonts/**/*.${supportedFontTypes}`)
		.pipe(gulp.dest(`${config.outputPath}/fonts`));
}

function loadImages() {
	return gulp.src(`${config.assetsPath}/images/**/*.${supportedImageTypes}`)
		.pipe(imageMinifier())
		.pipe(gulp.dest(`${config.outputPath}/images`));
}

function loadScripts() {
	return gulp.src(`${config.assetsPath}/scripts/**/*.${supportedScriptTypes}`)
		.pipe(fileCombiner('site.min.js'))
		.pipe(sourceMapper.init())
		.pipe(jsMinifier())
		.pipe(sourceMapper.write('./'))
		.pipe(gulp.dest(`${config.outputPath}/scripts`));
}

function loadStyles() {
	return gulp.src(`${config.assetsPath}/styles/**/*.${supportedStyleTypes}`)
		.pipe(sassProcessor({
			indentType: 'tab',
			indentWidth: 1,
			linefeed: 'crlf',
			outputStyle: 'expanded'
		}).on('error', sassProcessor.logError))
		.pipe(sourceMapper.init())
		.pipe(cssProcessor([
			cssMinifier(),
			cssPrefixer()
		]))
		.pipe(fileCombiner('site.min.css'))
		.pipe(sourceMapper.write('./'))
		.pipe(gulp.dest(`${config.outputPath}/styles`))
		.pipe(browserSync.stream({ match: '**/*.css' }));
}

function watchForChanges() {
	browserSync.init({
		notify: false,
		port: 8080,
		server: { baseDir: `${config.outputPath}/` },
		ui: { port: 9090 }
	});

	let pageSource = [
		`./*.${supportedPageTypes}`,
		`${config.partialsPath}/**/*.${supportedPageTypes}`,
		`${config.layoutsPath}/**/*.${supportedPageTypes}`
	];
	let jekyllRebuildSequence = gulp.series(jekyllBuild, loadAssets(), browserSync.reload);
	gulp.watch(pageSource).on('add', jekyllRebuildSequence);
	gulp.watch(pageSource).on('change', jekyllRebuildSequence);
	gulp.watch(pageSource).on('unlink', jekyllRebuildSequence);

	let fontsReloadSequence = gulp.series(loadFonts, browserSync.reload);
	let fontSource = `${config.assetsPath}/fonts/**/*.${supportedFontTypes}`;
	gulp.watch(fontSource).on('add', fontsReloadSequence);
	gulp.watch(fontSource).on('change', fontsReloadSequence);
	gulp.watch(fontSource).on('unlink', fontsReloadSequence);

	let imagesReloadSequence = gulp.series(loadImages, browserSync.reload);
	let imageSource = `${config.assetsPath}/images/**/*.${supportedImageTypes}`;
	gulp.watch(imageSource).on('add', imagesReloadSequence);
	gulp.watch(imageSource).on('change', imagesReloadSequence);
	gulp.watch(imageSource).on('unlink', imagesReloadSequence);

	let scriptsReloadSequence = gulp.series(loadScripts, browserSync.reload);
	let scriptSource = `${config.assetsPath}/scripts/**/*.${supportedScriptTypes}`;
	gulp.watch(scriptSource).on('add', scriptsReloadSequence);
	gulp.watch(scriptSource).on('change', scriptsReloadSequence);
	gulp.watch(scriptSource).on('unlink', scriptsReloadSequence);

	let stylesReloadSequence = gulp.series(loadStyles, browserSync.reload);
	let styleSource = `${config.assetsPath}/styles/**/*.${supportedStyleTypes}`;
	gulp.watch(styleSource).on('add', stylesReloadSequence);
	gulp.watch(styleSource).on('change', stylesReloadSequence);
	gulp.watch(styleSource).on('unlink', stylesReloadSequence);
}

exports.clean = jekyllClean;
exports.default = gulp.series(jekyllClean, jekyllBuild, loadAssets(), watchForChanges);
exports.deploy = deployGithubPage;
