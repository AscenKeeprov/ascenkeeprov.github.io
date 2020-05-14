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
const jsMinifier = require('gulp-terser');
const processManager = require('child_process');
const sassProcessor = require('gulp-sass');
const sourceMapper = require('gulp-sourcemaps');
const scriptsDirName = 'scripts';
const streamMerger = require('merge-stream');
const streamReader = require('readline')
const stylesDirName = 'styles';
const supportedFontTypes = '{ttf,woff?(2)}';
const supportedImageTypes = '{gif,ico,jp?(e)g,png,svg}';
const supportedPageTypes = 'html';
const supportedScriptTypes = 'js';
const supportedStyleTypes = '?(s)css';
const util = require('util');
const yamlParser = require('js-yaml');

let config = getJekyllConfig();
let shellExecute = util.promisify(processManager.exec);

sassProcessor.compiler = require('node-sass');

async function executeShellCommandAsync(command) {
	const { stdout, stderr } = await shellExecute(command);
	if (stderr) console.error(stderr);
	if (stdout) console.log(stdout);
}

function getJekyllConfig(configFilePath = './_config.yml') {
	let jekyllConfig = yamlParser.safeLoad(fileManager.readFileSync(configFilePath, { encoding: 'utf8' }));
	return {
		assetsPath: `${jekyllConfig.source}/${jekyllConfig.assets_dir}`,
		collectionsPath: `${jekyllConfig.source}/${jekyllConfig.collections_dir}`,
		layoutsPath: `${jekyllConfig.source}/${jekyllConfig.layouts_dir}`,
		outputPath: `${jekyllConfig.destination}`,
		pagesPath: `${jekyllConfig.source}/${jekyllConfig.pages_dir}`,
		partialsPath: `${jekyllConfig.source}/${jekyllConfig.includes_dir}`,
		inputPath: `${jekyllConfig.source}`,
		deployUrl: `git@github.com:${jekyllConfig.repository}`,
		filesToKeep: jekyllConfig.keep_files
	};
}

async function gitDeploy(done) {
	let commitMessage = await prompt(
		'Commit message (enter CANCEL to abort operation): ',
		'You must provide a commit message!'
	);
	if (commitMessage.toUpperCase() == 'CANCEL') throw new Error('Deployment cancelled');
	await executeShellCommandAsync('git add .');
	await executeShellCommandAsync(`git commit --all --message '${commitMessage}' --cleanup=strip`);
	await executeShellCommandAsync('git push origin master');
	done();
}

function gitStage() {
	let deletePattern = ['./**/*', `!${config.inputPath}`, `!${config.outputPath}`];
	for (let file of config.filesToKeep) {
		if (!deletePattern.includes(`!${file}`)) deletePattern.push(`!${file}`);
	}
	fileDeleter.sync(deletePattern);
	return gulp.src(`${config.outputPath}/**/*`).pipe(gulp.dest('./'));
}

function jekyllBuild(done) {
	executeShellCommandAsync('bundle exec jekyll build').then(done);
}

function jekyllClean(done) {
	executeShellCommandAsync('bundle exec jekyll clean').then(done);
}

function jekyllDoctor(done) {
	executeShellCommandAsync('bundle exec jekyll doctor').then(done);
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

function prompt(request, warningMessage) {
	if (!request) throw new Error('Prompt request cannot be empty!');
	if (!warningMessage) warningMessage = 'Prompt response cannot be empty!';

	let reader = streamReader.createInterface({
		input: process.stdin,
		output: process.stdout,
		prompt: request,
	});

	return new Promise(resolve => reader.question(request, response => {
		response = response.trim();
		reader.close();
		if (!response) {
			console.warn(warningMessage);
			resolve(prompt(request, warningMessage));
		}
		else resolve(response);
	}));
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
exports.deploy = gulp.series(gitStage, jekyllClean, gitDeploy);
exports.doctor = jekyllDoctor;
