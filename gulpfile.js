'use strict';

const browserSync = require('browser-sync').create();
const cssMinifier = require('cssnano');
const cssPrefixer = require('autoprefixer');
const cssProcessor = require('gulp-postcss');
const fileCombiner = require('gulp-concat');
const fileDeleter = require('del');
const fileManager = require('fs');
const fontsDirName = 'fonts';
const gulp = require('gulp');
const imageMinifier = require('gulp-imagemin');
const imagesDirName = 'images';
const ioManager = require('readline').createInterface({
	input: process.stdin,
	output: process.stdout
});
const jsMinifier = require('gulp-terser');
const processManager = require('child_process');
const sassProcessor = require('gulp-sass');
const sourceMapper = require('gulp-sourcemaps');
const scriptsDirName = 'scripts';
const streamMerger = require('merge-stream');
const stylesDirName = 'styles';
const supportedFontTypes = '{ttf,woff?(2)}';
const supportedImageTypes = '{gif,ico,jp?(e)g,png,svg}';
const supportedPageTypes = 'html';
const supportedScriptTypes = 'js';
const supportedStyleTypes = '?(s)css';
const yamlParser = require('js-yaml');

let config = getJekyllConfig('./_config.yml');

sassProcessor.compiler = require('node-sass');

function deployGithubPage(done) {
	ioManager.question('Commit message: ', (message) => {
		if (message.toUpperCase() == 'CANCEL') return;
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
	done();
}

function getJekyllConfig(configFilePath) {
	try {
		let configObj = {};
		let jekyllConfig = yamlParser.safeLoad(fileManager.readFileSync(configFilePath, { encoding: 'utf8' }));
		configObj.assetsPath = `${jekyllConfig.source}/${jekyllConfig.assets_dir}`;
		configObj.collectionsPath = `${jekyllConfig.source}/${jekyllConfig.collections_dir}`;
		configObj.layoutsPath = `${jekyllConfig.source}/${jekyllConfig.layouts_dir}`;
		configObj.outputPath = `${jekyllConfig.destination}`;
		configObj.pagesPath = `${jekyllConfig.source}/${jekyllConfig.pages_dir}`;
		configObj.partialsPath = `${jekyllConfig.source}/${jekyllConfig.includes_dir}`;
		configObj.inputPath = `${jekyllConfig.source}`;
		configObj.deployUrl = `git@github.com:${jekyllConfig.repository}`;
		configObj.filesToKeep = jekyllConfig.keep_files;
		return configObj;
	} catch (e) {
		console.error(e);
	}
}

function jekyllBuild(done) {
	processManager.spawn('bundle', ['exec', 'jekyll', 'build'], { shell: true, stdio: 'inherit' }).on('exit', done);
}

function jekyllClean(done) {
	processManager.exec('bundle exec jekyll clean', (exception, stdout, stderr) => {
		if (exception) {
			console.log(`Jekyll cleanup failed with code ${exception.code}`);
			console.log(exception.stack);
		}
		if (stderr) console.error(stderr);
		console.log(stdout);
		done();
	});
}

function loadAssets() {
	return gulp.parallel(loadScripts, loadStyles, loadImages, loadFonts);
}

function loadFonts() {
	return gulp.src(`${config.assetsPath}/${fontsDirName}/**.${supportedFontTypes}`)
		.pipe(gulp.dest(`${config.outputPath}/${fontsDirName}`));
}

function loadImages() {
	return streamMerger(
		gulp.src(`${config.assetsPath}/${imagesDirName}/**/*.${supportedImageTypes}`)
			.pipe(imageMinifier())
			.pipe(gulp.dest(`${config.outputPath}/${imagesDirName}`)),
		gulp.src(`${config.outputPath}/certificates/*.${supportedImageTypes}`)
			.pipe(imageMinifier())
			.pipe(gulp.dest(`${config.outputPath}/certificates`))
	);
}

function loadScripts() {
	return gulp.src(`${config.assetsPath}/${scriptsDirName}/**/*.${supportedScriptTypes}`)
		.pipe(fileCombiner('site.min.js'))
		.pipe(sourceMapper.init())
		.pipe(jsMinifier())
		.pipe(sourceMapper.write('./'))
		.pipe(gulp.dest(`${config.outputPath}/${scriptsDirName}`));
}

function loadStyles() {
	return gulp.src(`${config.assetsPath}/${stylesDirName}/**/*.${supportedStyleTypes}`)
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
		.pipe(gulp.dest(`${config.outputPath}/${stylesDirName}`))
		.pipe(browserSync.stream({ match: '**/*.css' }));
}

function stageGithubPage() {
	let deletePattern = ['./**/*', `!${config.inputPath}`, `!${config.outputPath}`];
	for (let file of config.filesToKeep) {
		if (!deletePattern.includes(`!${file}`)) deletePattern.push(`!${file}`);
	}
	fileDeleter.sync(deletePattern);
	return gulp.src(`${config.outputPath}/**/*`).pipe(gulp.dest('./'));
}

function watchForEvents() {
	browserSync.init({
		cors: true,
		notify: false,
		online: false,
		port: 8080,
		reloadDelay: 200,
		reloadOnRestart: true,
		server: { baseDir: `${config.outputPath}/` },
		ui: { port: 9090 }
	});

	let eventNames = ['add', 'change', 'unlink'];

	let fontSource = `${config.assetsPath}/${fontsDirName}/**/*.${supportedFontTypes}`;
	let fontsReloadSequence = gulp.series(loadFonts, browserSync.reload);

	let imageSource = `${config.assetsPath}/${imagesDirName}/**/*.${supportedImageTypes}`;
	let imagesReloadSequence = gulp.series(loadImages, browserSync.reload);

	let pageSource = [
		`./*.${supportedPageTypes}`,
		`${config.pagesPath}/**/*.${supportedPageTypes}`,
		`${config.partialsPath}/**/*.${supportedPageTypes}`,
		`${config.layoutsPath}/**/*.${supportedPageTypes}`
	];
	let pagesRebuildSequence = gulp.series(jekyllBuild, loadAssets(), browserSync.reload);

	let scriptSource = `${config.assetsPath}/${scriptsDirName}/**/*.${supportedScriptTypes}`;
	let scriptsReloadSequence = gulp.series(loadScripts, browserSync.reload);

	let styleSource = `${config.assetsPath}/${stylesDirName}/**/*.${supportedStyleTypes}`;
	gulp.watch(styleSource, { watchEvents: eventNames }, loadStyles);

	for (let eventName of eventNames) {
		gulp.watch(fontSource).on(eventName, fontsReloadSequence);
		gulp.watch(imageSource).on(eventName, imagesReloadSequence);
		gulp.watch(pageSource).on(eventName, pagesRebuildSequence);
		gulp.watch(scriptSource).on(eventName, scriptsReloadSequence);
	}
}

exports.build = gulp.series(jekyllClean, jekyllBuild, loadAssets());
exports.clean = jekyllClean;
exports.default = gulp.series(jekyllClean, jekyllBuild, loadAssets(), watchForEvents);
exports.deploy = gulp.series(stageGithubPage, jekyllClean, deployGithubPage);
