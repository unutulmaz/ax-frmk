if (typeof XLSX !== 'undefined' && XLSX) {
	XLSX.fileHandle = function fileHandle(f, config) {
		var reader = new FileReader();
		var data;
		reader.onload = function (e) {
			if (!e) {
				data = reader.content;
			} else {
				data = e.target.result;
			}

			/* if binary string, read with type 'binary' */
			var options = angular.extend({ type: 'binary' }, angular.isFunction(config.readConfig) ? config.readConfig() : config.readConfig);
			try {
				var workbook = XLS.read(data, options);

				if (config.read) config.read(workbook);


			} catch (ex) {
				if (config.error) config.error(ex);
			}
		};

		//extend FileReader
		if (!FileReader.prototype.readAsBinaryString) {
			FileReader.prototype.readAsBinaryString = function (fileData) {
				var binary = "";
				var pt = this;
				var reader = new FileReader();
				reader.onload = function (e) {
					var bytes = new Uint8Array(reader.result);
					var length = bytes.byteLength;
					for (var i = 0; i < length; i++) {
						binary += String.fromCharCode(bytes[i]);
					}
					pt.content = binary;
					$(pt).trigger('onload');
				};
				reader.readAsArrayBuffer(fileData);
			};
		}

		reader.readAsBinaryString(f);
	};
	var sheet = {
		getRows: function (range, sheet) {
			var rows = [];
			for (let row = range.s.r; row <= range.e.r; row++) {
				let rowCells = this.parseCols(range, row, sheet);
				rows.push(rowCells);
			}
			return { rows: rows, range: range };
		},
		parseCols: function (range, row, sheet) {
			var rowCells = [];
			for (let col = range.s.c; col <= range.e.c; col++) {
				let cellAddress = XLS.utils.encode_cell({ r: row, c: col });
				let cell = {};
				let val = sheet[cellAddress];
				if (val) {
					cell.value = val.v;
					cell.type = val.t;
					if (sheet['!merges']) {
						let merge = this.checkForMerge({ r: row, c: col }, sheet);
						if (merge) cell.mergedTo = merge;
					}
				} else cell.value = undefined;
				rowCells.push(cell);
			}
			return rowCells;
		},
		checkForMerge(cel, sheet) {
			for (let i = 0; i < sheet['!merges'].length; i++) {
				let merge = sheet['!merges'][i];
				if (cel.r === merge.s.r && cel.c === merge.s.c) return merge.e;
			}
			return null;
		}
	};
	XLSX.sheet = sheet;
}
var keyCodes = {
	Backspace: 8,
	Tab: 9,
	Del: 46,
	Return: 13,
	Home: 36,
	End: 35,
	Enter: 13,
	Escape: 27,
	Spacebar: 32,
	LeftArrow: 37,
	UpArrow: 38,
	RightArrow: 39,
	PageDown: 34,
	PageUp: 33,
	Insert: 45,
	Delete: 46,
	DownArrow: 40,
	letter: {
		I: 73,
		D: 68,
		S: 83,
		E: 69,
		N: 78,
		Q: 81
	},
	function: {
		f1: 111,
		f2: 113,
		f3: 114,
		f4: 115,
		f5: 116,
		f6: 117,
		f7: 118,
		f8: 119,
		f9: 120,
		f10: 121,
		f11: 122,
		f12: 123
	},
	isPlus: function (code) {
		return (code === this.Plus1Sign || code === this.Plus2Sign);
	},
	PlusSign: 43,
	Plus1Sign: 107,
	Plus2Sign: 187,
	isMinus: function (code) {
		return (code === this.Minus1Sign || code === this.Minus2Sign);
	},
	MinusSign: 45,
	Minus1Sign: 109,
	Minus2Sign: 189,
	keyCodeToLetter: function (keyCode) {
		return String.fromCharCode(keyCode || event.keyCode);
	},
	isLetter: function (keyCode) {
		return keyCode >= 65 && keyCode <= 90;
	}
};

var extendPrototypeObject = function (destination, source) {
	angular.extend(destination, source);
	var protoMethods = Object.getOwnPropertyNames(source.constructor.prototype);
	// ReSharper disable once MissingHasOwnPropertyInForeach
	var destinationPrototype = Object.getPrototypeOf(destination);
	for (let i = 0; i < protoMethods.length; i++) {
		let methodName = protoMethods[i];
		if (["constructor"].indexOf(methodName) > -1) continue;
		destinationPrototype[methodName] = source.constructor.prototype[methodName];
	}
	//console.log(destinationPrototype);
	return destination;
};
var detectMouseLeftButton = function (evt) {
	evt = evt || window.event;
	if ("buttons" in evt) {
		return evt.buttons === 1;
	}
	var button = evt.which || evt.button;
	return button === 1;
};


// window.saveAs
// Shims the saveAs method, using saveBlob in IE10. 
// And for when Chrome and FireFox get round to implementing saveAs we have their vendor prefixes ready. 
// But otherwise this creates a object URL resource and opens it on an anchor tag which contains the "download" attribute (Chrome)
// ... or opens it in a new tab (FireFox)
// @author Andrew Dodson
// @copyright MIT, BSD. Free to clone, modify and distribute for commercial and personal use.
if (typeof navigator !== 'undefined' && navigator) {
	window.saveAs || (window.saveAs = (window.navigator.msSaveBlob ? function (b, n) {
		return window.navigator.msSaveBlob(b, n);
	} : false) || window.webkitSaveAs || window.mozSaveAs || window.msSaveAs || (function () {

		window.URL || (window.URL = window.webkitURL);// jshint ignore:line


		if (!window.URL) {
			return false;
		}

		return function (blob, name) {
			var url = URL.createObjectURL(blob);

			// Test for download link support
			var a = document.createElement("a");
			if ("download" in a) {
				a.setAttribute("href", url);
				a.setAttribute("download", name);

				// Create Click event
				var clickEvent = document.createEvent("MouseEvent");
				clickEvent.initMouseEvent("click", true, true, window, 0,
					clickEvent.screenX, clickEvent.screenY, clickEvent.clientX, clickEvent.clientY,
					clickEvent.ctrlKey, clickEvent.altKey, clickEvent.shiftKey, clickEvent.metaKey,
					0, null);

				// dispatch click event to simulate download
				a.dispatchEvent(clickEvent);

			}
			else {
				// fallover, open resource in new tab.
				window.open(url, "_blank", "");
			}
		};

	})());// jshint ignore:line

	window.saveAsXls = function (html, fileName) {
		var characterCoding = document.inputEncoding || document.characterSet || document.charset;
		characterCoding = "charset=UTF-8";
		var dataType = 'data:application/vnd.ms-excel;' + characterCoding;
		var BOM = '\ufeff';
		var blob = new Blob([BOM + html], { type: dataType });
		window.saveAs(blob, fileName + ".xls");
	};
	window.saveAsJson = function (object, fileName) {
		var characterCoding = document.inputEncoding || document.characterSet || document.charset;
		characterCoding = "charset=UTF-8";
		var dataType = 'data:application/json;' + characterCoding;
		var BOM = '\ufeff';
		var text = JSON.stringify(object);
		var blob = new Blob([BOM + text], { type: dataType });
		window.saveAs(blob, fileName + ".json");
	};
}

if (typeof navigator !== 'undefined' && navigator) {
	var mouseWhellEventName = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel";
	var mouseWhellScrollStep = 100;
}

var Debugger = function (gState, klass) {
	let debug = {};

	if (gState && klass) {
		for (let m in console)
			if (typeof console[m] == 'function')
				debug[m] = console[m].bind(window.console, klass.toString() + ": ");
	} else {
		for (let m in console) {
			if (typeof console[m] == 'function')
				debug[m] = function () { };
		}
	}
	return debug;
};
