"use strict";
var gulp = require("gulp"),
	fs = require('fs'),
	del = require("del"),
	sass = require("gulp-sass"),
	runSequence = require('run-sequence'),
	rename = require('gulp-rename'),
	plumber = require('gulp-plumber'),
	sourceMaps = require('gulp-sourcemaps'),
	watch = require('gulp-watch'),
	jshint = require("gulp-jshint"),
	stylish = require('jshint-stylish'),
	gulpif = require("gulp-if"),
	babel = require("gulp-babel"),
	htmlReplace = require('gulp-html-replace'),
	fileExists = require('file-exists'),
	sftp = require('gulp-sftp'),
	gulpConfig = require("./gulpfile.config.json"),
	applicationInfo = require("./" + gulpConfig.path.src + "app-modules/modules-vars"),
	tasks = gulpConfig.tasks;

const pathFn = require('path');
var configFiles = gulpConfig.configs;
for (let config in configFiles) {
	let path = configFiles[config].path + "/gulp-config.json";
	configFiles[config].data = require("./" + gulpConfig.path.src + path)
}

gulp.task("Clean-wwwroot", function () {
	return del([gulpConfig.path.public + '/**', '!' + gulpConfig.path.public]).then(paths => {
		console.log('Deleted ' + gulpConfig.path.public + ' files and folders:');
	});
});


var indexHtml = {
	refresh: function (file, remove) {
		var config = indexHtml.findConfigForFile(file);
		var root = file.substring(0, file.indexOf("\\"));
		if (config) {
			if (remove) indexHtml.removeFileFromConfig(file, root, config);
			return;
		} else {
			if (remove) return;
			var bLibs = [".git"];
			addBowerLibsFolders(bLibs, "", "");
			if (bLibs.indexOf(root) > -1) return;
			config = indexHtml.getConfigForRoot(root);
			indexHtml.addFileToConfig(file, root, config);
		}
	},
	updateConfigFiles: function (sourceFile, event) {
		var fullPath = gulpConfig.path.public + "\\" + sourceFile;
		if (event === 'add') {
			if (!isBowerLibs(sourceFile)) indexHtml.refresh(sourceFile, false);
		} else if (event === 'unlink') {
			indexHtml.refresh(sourceFile, true);
			if (fileExists(fullPath)) fs.unlink(fullPath);
		}
	},
	addFileToConfig: function (file, root, config) {
		var ext = file.substring(file.lastIndexOf("."));
		file = replaceall("\\", "/", file).replace(".es6.", ".").replace(".dev.", ".").replace(".prod.", ".");
		var task;
		if (!config.data || config.data.length === 0) return;
		if (ext === ".css") task = config.data[0];
		else if (ext !== ".js") return;
		else if (root === "") return;
		else if (root === "app-modules") {
			task = config.data[2];
			for (let i = 0; i < gulpConfig.path.bowerLibs.length; i++) {
				let bowerPath = gulpConfig.path.bowerLibs[i];
				if (file.startsWith(bowerPath)) {
					task = config.data[1];
					break;
				}
			}
		}
		else task = config.data[1];
		console.log("addFileConfig root", root);
		for (let i = 0; i < task.exceptions.length; i++) {
			let exception = task.exceptions[i];
			if (file.startsWith(exception)) return;
		}
		task.inputFiles.push(file);
		var fileContent = JSON.stringify(config.data);
		var fileName = gulpConfig.path.src + "/" + root + "/gulp-config.json";
		fs.writeFile(fileName, fileContent, 'utf8', function () {
			setTimeout(devIndex, 0);
		});
	},
	removeFileFromConfig: function (file, root, config) {
		var ext = file.substring(file.lastIndexOf("."));
		file = replaceall("\\", "/", file).replace(".dev.", ".").replace(".prod.", ".");
		var data;
		if (ext === ".css") data = config.data[0];
		else if (ext !== ".js") return;
		else if (root === "app-modules") {
			data = config.data[2];
			for (let i = 0; i < gulpConfig.path.bowerLibs.length; i++) {
				let bowerPath = gulpConfig.path.bowerLibs[i];
				if (file.startsWith(bowerPath)) {
					data = config.data[1];
					break;
				}
			}
		}
		else data = config.data[1];
		var index = data.inputFiles.indexOf(file);
		if (index === -1) console.error("file ", file, "not found in config!!!!", data);
		data.inputFiles.splice(index, 1);
		var fileContent = JSON.stringify(config.data);
		var fileName = gulpConfig.path.src + "/" + root + "/gulp-config.json";
		fs.writeFile(fileName, fileContent, 'utf8', function () {
			setTimeout(devIndex, 0);
		});
	},
	getConfigForRoot: function (root) {
		var configs = Object.keys(configFiles);
		for (let i = 0; i < configs.length; i++) {
			let configName = configs[i];
			let config = configFiles[configName];
			//console.log("check root", root, config.path);
			if (config.path === root) return config;
		}
		return false;
	},
	findConfigForFile: function (file) {
		var configs = Object.keys(configFiles);
		file = replaceall("\\", "/", file).replace(".es6.", ".");
		for (let i = 0; i < configs.length; i++) {
			let configName = configs[i];
			let config = configFiles[configName];
			for (let j = 0; j < config.data.length; j++) {
				let files = config.data[j].inputFiles;
				for (let k = 0; k < files.length; k++) {
					//console.log("check", file, files[k]);
					if (file === files[k]) return config;
				}
			}
		}
		return false;
	}
};


var devIndex = function () {
	var error = false;
	var allFiles1 = getFiles().slice(0);
	var filesCnt = {};
	for (let i = 0; i < allFiles1.length; i++) {
		let set = allFiles1[i];
		let files = set.inputFiles;
		for (let j = 0; j < files.length; j++) {
			let file = gulpConfig.path.public + "/" + files[j];
			if (filesCnt[file]) {
				console.error("File is already loaded", files[j], file);
				error = true;
			} else filesCnt[file] = true;
			if (!fileExists(file)) {
				console.log("File not exist", files[j], file);
				// error = true;
			}
		}
	}
	var target = gulp.src(gulpConfig.path.src + 'index.html');
	var cssFiles = getBundles(".css")[0].inputFiles.slice(0);
	var headJsFiles = getBundles(".js")[0].inputFiles.slice(0);
	var bodyJsFiles = getBundles(".js")[1].inputFiles.slice(0);
	for (let i = 0; i < cssFiles.length; i++) {
		if (cssFiles[i].includes("theme.")) cssFiles[i]  = "";
		else cssFiles[i] = cssFiles[i].replace("[ENV]", dev.short);
	}
	for (let i = 0; i < headJsFiles.length; i++) {
		headJsFiles[i] = headJsFiles[i].replace("[ENV]", dev.short);
	}
	for (let i = 0; i < bodyJsFiles.length; i++) {
		bodyJsFiles[i] = bodyJsFiles[i].replace("[ENV]", dev.short);
	}
	return target
		.pipe(htmlReplace({
			'css': cssFiles,
			'head-js': headJsFiles,
			'body-js': bodyJsFiles,
			'base': '<base href="/" />',
			'environment': '<div id="APP_ENV_CONSTANT" style="display: none">DEVELOPMENT</div>'
		}))
		.pipe(rename(function (path) {
			devWatchFinish = true;
			logFile('Index File copied', path);
		}))
		.pipe(gulp.dest(gulpConfig.path.public));
};
gulp.task('Dev-Index', devIndex);

var devWatchFinish = false;
var showError = function (error) {
	console.log(error);
	this.emit('end');
}
gulp.task("Dev-Copy-Es6", ["Clean-wwwroot"],
	function () {
		var tasksEnded = 0;

		function runEndTask() {
			tasksEnded++;
			if (tasksEnded !== 4) return;
			devIndex();
		}

		return gulp.src(files.development.restFiles, {base: gulpConfig.path.src})
			.pipe(rename(function (file) {
				let fullPath = pathFn.join(file.dirname, file.basename) + file.extname;
				if (fullPath === gulpConfig.favicon) file.dirname = "";
				logFile("Rest file copied", file);
			}))
			.pipe(gulp.dest(gulpConfig.path.public + "/"))
			.on("end", function () {
				console.log("Rest files copy ended");
				runEndTask();
			}),
			gulp.src(files.common.scssFiles, {base: gulpConfig.path.src})
				.pipe(rename(function (file) {
					logFile("Scss file copied", file);
				}))
				.pipe(sourceMaps.init())
				.pipe(sass().on('error', sass.logError))
				.pipe(sourceMaps.write())
				.pipe(gulp.dest(gulpConfig.path.public + "/"))
				.on("end", function () {
					console.log("Scss files copy ended");
					runEndTask();
				}),
			gulp.src(files.common.es5Files, {base: gulpConfig.path.src})
				.pipe(rename(function (file) {
					logFile("Es5 file copied", file);
				}))
				.pipe(gulp.dest(gulpConfig.path.public + "/"))
				.on("end", function () {
					console.log("Es5 file copy ended");
					runEndTask();
				}),
			gulp.src(files.development.es6Files, {base: gulpConfig.path.src})
				.pipe(rename(function (file) {
					if (file.basename.endsWith('.es6')) file.basename = file.basename.slice(0, -4);
					if (file.basename.endsWith("." + dev.short)) file.basename = file.basename.replace("." + dev.short, "");
					logFile("Es6 file copied", file);
				}))
				.pipe(gulp.dest(gulpConfig.path.public + "/"))
				.on("end", function () {
					console.log("Es6 file copy ended");
					runEndTask();
				});
	});

gulp.task("Dev-Watch-Es6", [],
	function () {
		watch(files.development.restFiles, {base: gulpConfig.path.src, ignoreInitial: true, verbose: true, usePolling: true}, function (obj) {
			if (typeof obj.event !== "string" || obj.extname.indexOf("_tmp___") > -1) {
				// console.log("restfile NOT EXECUTED for", obj.path, obj.extname);
				return;
			}
			// console.log("restfile", obj.path, obj.extname);
			if (['add', 'unlink'].indexOf(obj.event) > -1) indexHtml.updateConfigFiles(obj.relative, obj.event);
			gulp.src(obj.path, {base: gulpConfig.path.src})
				.pipe(plumber())
				.pipe(gulpif(function (file) {
					return fileExists(file.path);
				}, gulp.dest(gulpConfig.path.public + "/")));
		});
		watch(files.common.scssFiles, {base: gulpConfig.path.src, ignoreInitial: true, verbose: true, usePolling: true}, function (obj) {
			if (typeof obj.event !== "string") return;
			if (['add', 'unlink'].indexOf(obj.event) > -1) indexHtml.updateConfigFiles(obj.relative.replace(".scss", ".css"), obj.event);
			gulp.src(obj.path, {base: gulpConfig.path.src})
				.pipe(plumber())
				.pipe(sourceMaps.init())
				.pipe(sass().on('error', sass.logError))
				.pipe(sourceMaps.write())
				.pipe(gulp.dest(gulpConfig.path.public + "/"));
		});
		watch(files.common.es5Files, {base: gulpConfig.path.src, ignoreInitial: true, verbose: true, usePolling: true}, function (obj) {
			gulp.src(obj.path, {base: gulpConfig.path.src})
				.pipe(plumber())
				.pipe(gulpif(function (file) {
					return fileExists(file.path);
				}, gulp.dest(gulpConfig.path.public + "/")));
		});
		watch(files.development.es6Files, {base: gulpConfig.path.src, ignoreInitial: true, verbose: true, usePolling: true}, function (obj) {
			if (typeof obj.event !== "string") return;
			// console.log("es6file", obj.path, obj.extname);
			if (['add', 'unlink'].indexOf(obj.event) > -1) indexHtml.updateConfigFiles(obj.relative.replace(".es6.", "."), obj.event);
			gulp.src(obj.path, {base: gulpConfig.path.src})
				.pipe(plumber())
				.pipe(rename(function (file) {
					let filePath = getFilePath(file, gulpConfig.path.src);
					if (!fileExists(filePath)) return false;
					if (file.basename.endsWith('.es6')) file.basename = file.basename.slice(0, -4);
					if (file.basename.endsWith("." + dev.short)) file.basename = file.basename.replace("." + dev.short, "");
				}))
				.pipe(gulp.dest(gulpConfig.path.public + "/"));
		});
		watch(files.jsHint.files, {base: gulpConfig.path.src, ignoreInitial: true, verbose: false, usePolling: true}, function (obj) {
			gulp.src(obj.path, {base: gulpConfig.path.src})
				.pipe(plumber())
				.pipe(jshint(files.jsHint.config))
				.pipe(jshint.reporter(stylish));
		});
		if (gulpConfig.deployFtp && gulpConfig.deployFtp.devWatch) {
			let profile = gulpConfig.deployFtp.profiles[gulpConfig.deployFtp.devWatch];
			watch(files.wwwroot, {base: gulpConfig.path.public, ignoreInitial: true, verbose: false, usePolling: true}, function (obj) {
				gulp.src(obj.path, {base: gulpConfig.path.public})
					.pipe(sftp({
						host: profile.host,
						port: profile.port,
						remotePlatform: profile.remotePlatform,
						remotePath: profile.remotePath,
						user: profile.user,
						pass: profile.pass
					}));
			});
		}
	});

gulp.task("Dev-Copy-Es5", ["Clean-wwwroot"],
	function () {
		var tasksEnded = 0;

		function runEndTask() {
			tasksEnded++;
			if (tasksEnded !== 4) return;
			// runSequence('Dev-Watch-Es5');
			devIndex();
		}

		return gulp.src(files.development.restFiles, {base: gulpConfig.path.src})
			.pipe(rename(function (file) {
				let fullPath = pathFn.join(file.dirname, file.basename) + file.extname;
				if (fullPath === gulpConfig.favicon) file.dirname = "";
				logFile("Rest file copied", file);
			}))
			.pipe(gulp.dest(gulpConfig.path.public + "/"))
			.on("end", function () {
				console.log("Rest files copy ended");
				runEndTask();
			}),
			gulp.src(files.common.scssFiles, {base: gulpConfig.path.src})
				.pipe(rename(function (file) {
					logFile("Scss file copied", file);
				}))
				.pipe(sourceMaps.init())
				.pipe(sass().on('error', sass.logError))
				.pipe(sourceMaps.write())
				.pipe(gulp.dest(gulpConfig.path.public + "/"))
				.on("end", function () {
					console.log("Scss files copy ended");
					runEndTask();
				}),
			gulp.src(files.common.es5Files, {base: gulpConfig.path.src})
				.pipe(rename(function (path) {
					logFile("Es5 file copied", path);
				}))
				.pipe(gulp.dest(gulpConfig.path.public + "/"))
				.on("end", function () {
					console.log("Es5 files copy ended");
					runEndTask();
				}),
			gulp.src(files.development.es6Files, {base: gulpConfig.path.src})
				.pipe(sourceMaps.init())
				.pipe(babel({presets: gulpConfig.babelPresets, compact: false}))
				.pipe(sourceMaps.write())
				.pipe(rename(function (path) {
					logFile("Es6 file copied", path);
					if (path.basename.endsWith('.es6')) path.basename = path.basename.slice(0, -4);
					if (path.basename.endsWith("." + dev.short)) path.basename = path.basename.replace("." + dev.short, "");
				}))
				.pipe(gulp.dest(gulpConfig.path.public + "/"))
				.on("end", function () {
					console.log("Es6 files copy ended");
					runEndTask();
				});
	});
gulp.task("Dev-Watch-Es5", [],
	function () {
		watch(files.development.restFiles, {base: gulpConfig.path.src, ignoreInitial: true, verbose: true}, function (obj) {
			gulp.src(obj.path, {base: gulpConfig.path.src})
				.pipe(plumber())
				.pipe(rename(function (file) {
					indexHtml.updateConfigFiles(pathFn.join(file.dirname, file.basename + file.extname), "restDevFiles");
				}))
				.pipe(gulp.dest(gulpConfig.path.public + "/"));
		});
		watch(files.common.scssFiles, {base: gulpConfig.path.src, ignoreInitial: true, verbose: true}, function (obj) {
			gulp.src(obj.path, {base: gulpConfig.path.src})
				.pipe(plumber())
				.pipe(rename(function (file) {
					indexHtml.updateConfigFiles(pathFn.join(file.dirname, file.basename + file.extname), "scssFiles");
				}))
				.pipe(sourceMaps.init())
				.pipe(sass().on('error', sass.logError))
				.pipe(sourceMaps.write())
				.pipe(gulp.dest(gulpConfig.path.public + "/"));
		});
		watch(files.common.es5Files, {base: gulpConfig.path.src, ignoreInitial: true, verbose: true}, function (obj) {
			gulp.src(obj.path, {base: gulpConfig.path.src})
				.pipe(plumber())
				.pipe(rename(function (file) {
					indexHtml.updateConfigFiles(pathFn.join(file.dirname, file.basename + file.extname), "es5Files");
				}))
				.pipe(gulp.dest(gulpConfig.path.public + "/"));
		});
		watch(files.development.es6Files, {base: gulpConfig.path.src, ignoreInitial: true, verbose: true}, function (obj) {
			gulp.src(obj.path, {base: gulpConfig.path.src})
				.pipe(plumber())
				.pipe(sourceMaps.init())
				.pipe(babel({presets: gulpConfig.babelPresets, compact: false}))
				.pipe(sourceMaps.write())
				.pipe(rename(function (file) {
					indexHtml.updateConfigFiles(pathFn.join(file.dirname, file.basename + file.extname), "es6DevFiles");
					if (file.basename.endsWith('.es6')) file.basename = file.basename.slice(0, -4);
					if (file.basename.endsWith("." + dev.short)) file.basename = file.basename.replace("." + dev.short, "");
				}))
				.pipe(gulp.dest(gulpConfig.path.public + "/"));
		});
		//runSequence('dev-watch-jshint');
		watch(files.jsHint.files, {base: gulpConfig.path.src, ignoreInitial: false, verbose: true}, function (obj) {
			gulp.src(obj.path, {base: gulpConfig.path.src})
				.pipe(plumber())
				.pipe(jshint(files.jsHint.config))
				.pipe(jshint.reporter(stylish));
		});
	});


function getFilePath(file, src) {
	let filePath = src.replace("/", "") + "\\" + file.dirname + "\\" + file.basename + file.extname;
	return filePath;
}

function getFiles() {
	var allTasks = [];

	for (let i = 0; i < tasks.length; i++) {
		let task = tasks[i];
		var newTask = {task: task.extension, outputFileName: task.outputFileName, inputFiles: [], exceptions: []};
		for (let config in configFiles) {
			getFilesForTask(configFiles[config].data, newTask);
		}
		allTasks.push(newTask);
	}
	return allTasks;
}

function getFilesForTask(config, task) {
	let files = getTaskFiles(config, task.task, task.outputFileName);
	if (files.length === 0) throw "Not found files for: task: " + JSON.stringify(task) + "\n in Config: " + JSON.stringify(config);
	for (let j = 0; j < files[0].inputFiles.length; j++) {
		task.inputFiles.push(files[0].inputFiles[j]);
	}
	for (let j = 0; j < files[0].exceptions.length; j++) {
		task.exceptions.push(files[0].exceptions[j]);
	}
}

function getTaskFiles(collection, taskName, outputFileName) {
	return collection.filter(function (bundle) {
		if (!bundle.exceptions) bundle.exceptions = [];
		return taskName === bundle.task && outputFileName === bundle.outputFileName;
	});
}

var replaceall = function (replaceThis, withThis, inThis) {
	withThis = withThis.replace(/\$/g, "$$$$");
	return inThis.replace(new RegExp(replaceThis.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|<>\-\&])/g, "\\$&"), "g"), withThis);
};
