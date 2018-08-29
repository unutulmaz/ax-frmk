var gulp = require("gulp"),
	fs = require('fs'),
	concat = require("gulp-concat"),
	insert = require('gulp-insert'),
	cssMin = require("gulp-cssmin"),
	sass = require("gulp-sass"),
	// htmlMin = require("gulp-htmlmin"),
	uglify = require("gulp-uglify"),
	gulpif = require("gulp-if"),
	useref = require("gulp-useref"),
	merge = require("merge-stream"),
	runSequence = require('run-sequence'),
	rename = require('gulp-rename'),
	del = require("del"),
	babel = require("gulp-babel"),
	watch = require('gulp-watch'),
	jshint = require("gulp-jshint"),
	stylish = require('jshint-stylish'),
	htmlReplace = require('gulp-html-replace'),
	debug = require('gulp-debug'),
	Vinyl = require('vinyl'),
	gulpConfig = require("./gulpfile.config.json"),
	applicationInfo = require("./" + gulpConfig.path.src + "app-modules/modules-vars");


gulp.task("Publish-0-All", ['publish-copy'], function () {
	setTimeout(function () {
		runSequence('Publish-2-Final');
	}, 5000);
});

gulp.task("Publish-1-Colect", ['publish-copy']);
gulp.task("Publish-2-Final", ['publish-index'],
	function () {
		var destination = gulpConfig.path.public + "/";
		gulp.src(files.production.prepare.fontFiles(), {base: gulpConfig.path.publishPrepare + "/"})
			.pipe(rename(function (path) {
				path.dirname = "";
				logFile('Font file copied', path);
			}))
			.pipe(gulp.dest(destination + "fonts/"));
		gulp.src(files.production.prepare.html, {base: gulpConfig.path.publishPrepare + "/"})
			.pipe(rename(function (path) {
				logFile('Html file copied', path);
			}))
			.pipe(gulp.dest(destination));
		gulp.src(files.production.prepare.api, {base: gulpConfig.path.publishPrepare + "/"})
			.pipe(rename(function (path) {
				logFile('Api file copied', path);
			}))
			.pipe(gulp.dest(destination));
		gulp.src(gulpConfig.favicon, {base: gulpConfig.path.publishPrepare + "/"})
			.pipe(rename(function (path) {
				logFile('Favicon file copied', path);
				path.dirname = "";
			}))
			.pipe(gulp.dest(destination));
		if (gulpConfig.productionCopy) {
			console.log("start", gulpConfig.productionCopy);
			gulp.src(gulpConfig.productionCopy, {base: gulpConfig.path.src + "/"})
				.pipe(rename(function (path) {
					if (path.basename.indexOf("." + dev.short) > -1) return false;
					path.basename = path.basename.replace("." + prod.short, "");
					logFile('Production copy file copied', path);
				}))
				.pipe(gulp.dest(destination));
		}
		// gulp.src(files.production.prepare.licenses, {base: gulpConfig.path.publishPrepare + "/"})
		// 	.pipe(rename(function (path) {
		// 		logFile('License file copied', path);
		// 	}))
		// 	.pipe(gulp.dest(destination));
	});


var getPublishFiles = function (outputFile) {
	var files = [outputFile + "?v=" + applicationInfo.version];
	var ext = outputFile.substring(outputFile.lastIndexOf("."));
	var index = getIndexForOutputFile(outputFile);
	var inputFiles = getBundles(ext)[index].inputFiles.slice(0);
	var exceptions = getBundles(ext)[index].exceptions;
	for (let i = 0; i < exceptions.length; i++) {
		let exception = exceptions[i];
		for (let j = 0; j < inputFiles.length; j++) {
			let file = inputFiles[j];
			if (file.startsWith(exception)) files.push(file);
		}
	}
	return files;
};
var getIndexForOutputFile = function (outputFile) {
	switch (outputFile) {
		case "site.min.css":
			return 0;
		case "head.min.js":
			return 0;
		case "body.min.js":
			return 1;
	}
	return -1;
};

function addPublishRoot(config) {
	for (let i = 0; i < config.length; i++) {
		let task = config[i];
		task.outputFileName = gulpConfig.path.publishPrepare + "/" + task.outputFileName + "?v=" + applicationInfo.version;
		for (let j = 0; j < task.inputFiles.length; j++) {
			let file = task.inputFiles[j];
			task.inputFiles[j] = gulpConfig.path.publishPrepare + "/" + task.inputFiles[j].replace(gulpConfig.path.publishPrepare + "/", "")
		}
	}
}

gulp.task("publish-clean", function () {
	del([gulpConfig.path.public + '/**', '!' + gulpConfig.path.public]);
	return del([gulpConfig.path.publishPrepare + '/**', '!' + gulpConfig.path.publishPrepare]).then(paths => {
		console.log('Deleted publish files and folders');
	});
});
gulp.task("publish-copy", ["publish-clean"],
	function () {
		return gulp.src(files.production.src.restFiles, {base: gulpConfig.path.src})
			.pipe(rename(function (path) {
				path.basename = path.basename.replace("." + prod.short, "");
				logFile('Rest file copied not js', path);
				return true;
			}))
			.pipe(gulp.dest(gulpConfig.path.publishPrepare + "/")),
			gulp.src(files.common.scssFiles, {base: gulpConfig.path.src})
				.pipe(sass())
				.pipe(rename(function (path) {
					logFile('Scss File copied', path);
				}))
				.pipe(gulp.dest(gulpConfig.path.publishPrepare + "/")),
			gulp.src(files.common.es5Files, {base: gulpConfig.path.src})
				.pipe(rename(function (path) {
					logFile('Es5 File copied', path);
				}))
				.pipe(gulp.dest(gulpConfig.path.publishPrepare + "/")),
			gulp.src(files.production.src.es6Files, {base: gulpConfig.path.src})
				.pipe(rename(function (path) {
					path.basename = path.basename.replace("." + prod.short, "");
					return true;
				}))
				.pipe(babel({presets: gulpConfig.babelPresets, compact: true}))
				.pipe(rename(function (path) {
					if (path.basename.endsWith('.es6')) path.basename = path.basename.slice(0, -4);
					logFile('Es6 File copied', path);
				}))
				.pipe(gulp.dest(gulpConfig.path.publishPrepare + "/"));
	});


gulp.task('publish-index', ['publish-licenses', "publish-min-css", "publish-min-js", "publish-min-html"], function () {
	var target = gulp.src(gulpConfig.path.src + '/index.html');
	return target
		.pipe(htmlReplace({
			'css': getPublishFiles('site.min.css'),
			'head-js': getPublishFiles('head.min.js'),
			'body-js': getPublishFiles('body.min.js'),
			'base': '<base href="' + gulpConfig.productionBase + '" />',
			'environment': '<div id="APP_ENV_CONSTANT" style="display: none">' + prod.long + '</div>'
		}))
		.pipe(gulp.dest(gulpConfig.path.publishPrepare));
});
gulp.task("publish-min-js", function () {
	var tasks = getBundles(".js").map(function (bundle) {
		var filesNotExcepted = [];
		var exceptions = bundle.exceptions;
		for (let i = 0; i < bundle.inputFiles.length; i++) {
			let file = bundle.inputFiles[i];
			let isExcepted = false;
			for (let j = 0; j < exceptions.length; j++) {
				if (file.startsWith(exceptions[j])) {
					console.log("js-min-excepted-file:", file, "from", bundle.outputFileName);
					isExcepted = true;
					break;
				}
			}
			if (!isExcepted) filesNotExcepted.push(gulpConfig.path.publishPrepare + "/" + file);
		}

		return gulp.src(files.production.prepare.exceptedFolders(exceptions), {base: gulpConfig.path.publishPrepare + "/"})
			.pipe(rename(function (path) {
				logFile('Excepted from minifieds js file', path);
			}))
			.pipe(gulp.dest(gulpConfig.path.public + "/")),
			gulp.src(filesNotExcepted, {base: "."})
				.pipe(rename(function (path) {
					logFile('Minify js file', path);
				}))
				.pipe(gulpif(function (file) {
					return file.path.slice(-7) !== ".min.js" && file.path.slice(-6) !== "app.js";
				}, uglify().on('error',
					function (e) {
						console.error(e);
					})))
				.pipe(concat(gulpConfig.path.public + "/" + bundle.outputFileName))
				.pipe(rename(function (path) {
					logFile('Output minified js file', path);
				}))
				.pipe(gulp.dest("."));
	});
	return merge(tasks);
});
gulp.task("publish-min-css", function () {
	var tasks = getBundles(".css").map(function (bundle) {
		console.log(gulpConfig.path.public + "/" + bundle.outputFileName);
		var files = [];
		var exceptions = bundle.exceptions;
		for (let i = 0; i < bundle.inputFiles.length; i++) {
			let file = bundle.inputFiles[i];
			let isExcepted = false;
			for (let j = 0; j < exceptions.length; j++) {
				if (file.startsWith(exceptions[j])) {
					console.log("css-min-excepted-file:", file, "from", bundle.outputFileName);
					isExcepted = true;
					break;
				}
			}
			if (!isExcepted) files.push(gulpConfig.path.publishPrepare + "/" + file);
		}

		return gulp.src(files, {base: "."})
			.pipe(concat(gulpConfig.path.public + "/" + bundle.outputFileName))
			.pipe(cssMin())
			.pipe(rename(function (path) {
				logFile('Minify css file', path);
			}))
			.pipe(gulp.dest("."));
	});
	return tasks;
});
gulp.task('publish-min-html', function () {
	return gulp.src(files.production.src.html, {base: gulpConfig.path.src})
	//.pipe(htmlmin({ collapseWhitespace: true })) // da eroare la ckeditor cred
		.pipe(gulp.dest(gulpConfig.path.publishPrepare + '/'));
});
gulp.task("publish-licenses", function () {
	gulp.src(files.production.src.licenses, {base: "."})
		.pipe(insert.transform(function (contents, file) {
			var vfile = new Vinyl({path: file.path});
			var dirname = vfile.dirname;
			var lastDirectory = dirname.slice(0 - (dirname.length - dirname.lastIndexOf('\\') - 1));
			console.log(lastDirectory + ' ' + file.path);
			return '---------------------------------\n License for "' + lastDirectory + '" third party library:\n---------------------------------\n' + contents;
		}))
		.pipe(concat("licenses-third-party.md"))
		.pipe(gulp.dest(gulpConfig.path.public + "/"));
});

