class axUtils {
	constructor() {
	}

	static niceColors() {
		return ["#FF6600", "#FCD202", "#B0DE09", "#0D8ECF", "#2A0CD0", "#CD0D74", "#CC0000", "#00CC00", "#0000CC", "#DDDDDD", "#999999", "#333333", "#990000"];
	}

	/**
	 * @param {Object} obj
	 * @param {Function} f function to iterate in loop with params(key, value)
	 */
	static forKeys(obj, f) {
		for (var key in obj) {
			if (obj.hasOwnProperty(key) && typeof obj[key] !== 'function') {
				if (f(key, obj[key])) {
					break;
				}
			}
		}
	}

	static triggerWindowResize($timeout, time) {
		if ($timeout) $timeout(function () {
			window.dispatchEvent(new Event('resize'));
		}, time || 0);
		else window.dispatchEvent(new Event('resize'));
	}

	static htmlToPlainText(element) {
		// console.log("htmlToPlaintext", element);
		let source = angular.isString(element) ? angular.element(element)[0] : element;
		var text = "";
		var scanChildren = function (children) {
			for (let i = 0; i < children.length; i++) {
				//console.log("Add node:", oldChild.nodeName, oldChild);
				let child = children[i];
				if (child.nodeName === "#text") text += child.nodeValue + " ";
				else if (child.childNodes) scanChildren(child.childNodes);
			}
		};
		scanChildren(source.childNodes);
		return text.trim();
	}

	static getCssStyle(className) {
		var classes = document.styleSheets[0].rules || document.styleSheets[0].cssRules;
		for (var x = 0; x < classes.length; x++) {
			if (classes[x].selectorText == className) {
				(classes[x].cssText) ? alert(classes[x].cssText) : alert(classes[x].style.cssText);
			}
		}
	}

	/**
	 * @param {HTMLElement} element
	 * @param {String} style css styles separated by ';'
	 */
	static elementHasStyle(element, style) {
		if (element.style[style]) return true;
		var cssVals = element.style.cssText.split(";");
		for (let i = 0; i < cssVals.length; i++) {
			let cssItem = cssVals[i];
			if (cssItem.indexOf(":") === -1) continue;
			let name = cssItem.split(":")[0].trim();
			if (name === style) return true;
		}
		return false;
	}

	/**
	 * @param {HTMLElement} elem
	 */
	static findHighestZIndex(elem) {
		var elems = angular.element(elem).parents();
		var highest = 0;
		for (var i = 0; i < elems.length; i++) {
			var zindex = document.defaultView.getComputedStyle(elems[i], null).getPropertyValue("z-index");
			if ((zindex > highest) && (zindex != 'auto')) {
				highest = zindex;
			}
		}
		return highest;
	}

	static addVersion(url) {
		if (url === null || url === undefined) return url;
		let version = "v=" + applicationInfo.version;
		if (url.indexOf("?") === -1) {
			url += "?" + version;
		}
		var urlParts = url.split("?");
		var base = urlParts[0];
		let queryParts = urlParts[1].split("&");
		let updated = "";
		for (let i = 0; i < queryParts.length; i++) {
			let queryPart = queryParts[i];
			if (queryPart.startsWith("v=")) queryParts[i] = version;
		}
		urlParts[1] = queryParts.join("&");
		let newUrl = urlParts.join("?");
		return newUrl;
	}

	static getMonthForPeriodKind(kind) {
		var month;
		switch (kind.toUpperCase().substr(0, 1)) {
			case "M":
				month = 1;
				break;
			case "Q":
				month = 3;
				break;
			case "S":
				month = 6;
				break;
			case "Y":
				month = 12;
				break;
			default:
				throw "No kind type knowed! " + item.kind;
		}
		return month;
	}

	static getLastIndexForPeriodKind(kind) {
		switch (kind.toUpperCase().substr(0, 1)) {
			case "M":
				return 12;
			case "Q":
				return 4;
			case "S":
				return 2;
			case "Y":
				return 1;
			default:
				throw "No kind type knowed! " + item.kind;
		}
	}

	static getPeriodName(item) {
		return item.kind.substr(0, 1) + item.index + "/" + item.year;
	}

	static objectOverwrite(destination, source, excludes, getProto, bothDirection) {
		if (source === undefined) return destination;
		if (bothDirection)
			for (let prop in destination) {
				if (excludes && excludes.includes(prop)) continue;
				if (destination.hasOwnProperty(prop)) {
					if (_.isObject(destination[prop])) {
						if (destination[prop] === null) destination[prop] = _.isArray(source[prop]) ? [] : {};
						source[prop] = axUtils.objectOverwrite(destination[prop], source[prop], false, false, bothDirection);
					} else if (typeof source[prop] !== "undefined") destination[prop] = source[prop];
					else source[prop] = destination[prop];
				}
			}
		if (_.isArray(source)) {
			destination = [];
			for (let i = 0; i < source.length; i++) {
				destination.push(source[i]);
			}
		} else {
			var props = Object.getOwnPropertyNames(source);
			if (getProto && _.isObject(source)) {
				var protoProps = Object.getOwnPropertyNames(Object.getPrototypeOf(source));
				protoProps.each(function (prop) {
					if (props.includes(prop)) return;
					props.push(prop);
				});
			}
			for (let i = 0; i < props.length; i++) {
				if (props[i] === "constructor") continue;
				if (excludes && excludes.includes(props[i])) continue;
				//console.log("source", source, props[i]);
				destination[props[i]] = source[props[i]];
			}
		}
		//destination = angular.extend(destination, source);
		return destination;
	}

	static testForScope(destination, path) {
		if (_.isObject(destination))
			for (let prop in destination) {
				if (destination.hasOwnProperty(prop)) {
					let item = destination[prop];
					path[prop] = {};
					if (["$dataStore", "$ctrl"].includes(prop)) continue;
					console.log("path", destination, path, prop);
					if (_.isObject(item) && item.tagName) continue;
					if (_.isObject(item) && item.$evalAsync && item.$watch) throw "This si scope object";
					else if (_.isObject(item) && item.toString && item.toString() === "[object Window]") throw "this is window object";
					else if (_.isObject(item)) axUtils.testForScope(item, path[prop]);
					// else if (_.isArray(item)) axUtils.testForScope(item, path[prop]);
				}
			}
		else if (_.isArray(destination)) {
			destination.each(function (item, i) {
				path[i] = {};
				// axUtils.testForScope(item, path[i]);
			});
		}
		return destination;
	}

	static addEventListener(element, event, callback, passive) {
		if (!element) return;
		if (element.attachEvent) element.attachEvent("on" + event, callback);
		else if (element.addEventListener) {
			var supportsPassive = false;
			try {
				var opts = Object.defineProperty({}, 'passive', {
					get: function () {
						supportsPassive = true;
					}
				});
				window.addEventListener("test", null, opts);
			} catch (e) {
			}
			if (passive === undefined) passive = true;
			element.addEventListener(event, callback, supportsPassive ? {passive: passive} : false);
		}
		else console.error("Element not has addEventListener method", element);
	}

	static removeEventListener(element, event, callback) {
		if (!element) return;
		if (element.detachEvent) element.dettachEvent("on" + event, callback);
		else if (element.removeEventListener) element.removeEventListener(event, callback);
		else console.error("Element not has removeEventListener method", element);
	}

	static createEvent(element, eventName, eventProp) {
		var customEvent = new Event(eventName);
		angular.extend(customEvent, eventProp || {});
		element.dispatchEvent(customEvent);
	}

	static columnResize(event) {
		if (!detectMouseLeftButton(event)) {
			//console.log('final', event);
			axUtils.removeEventListener(angular.element(document)[0], 'mousemove', axUtils.columnResize);
			this.columnResizing = false;
			return;
		}
		var th = angular.element(event.currentTarget).closest('th');
		var oldWidth = parseFloat(th.css('min-width'));
		var newWidth = oldWidth + event.movementX;
		event.finalWidth = newWidth;
		th.css({'min-width': newWidth + 'px', 'max-width': newWidth + 'px'});
	}

	static currentStyle(element, propertyName) {
		try {
			return window.getComputedStyle(element, null).getPropertyValue(propertyName);
		} catch (e) {
			return element.currentStyle[propertyName];
		}
	}

	static camelCase(input) {
		return input.toLowerCase().replace(/-(.)/g, function (match, group1) {
			return group1.toUpperCase();
		});
	}

	static reverseCamelCase(input) {
		return input
		// insert a space between lower & upper
			.replace(/([a-z])([A-Z])/g, '$1-$2')
			// space before last upper in a sequence followed by lower
			.replace(/\b([A-Z]+)([A-Z])([a-z])/, '$1-$2$3')
			// uppercase the first character
			.toLowerCase();
	}

	static Guid() {
		var d = new Date().getTime();
		if (window.performance && typeof window.performance.now === "function") {
			d += window.performance.now(); //use high-precision timer if available
		}
		var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,
			function (c) {
				var r = (d + Math.random() * 16) % 16 | 0;
				d = Math.floor(d / 16);
				return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
			});
		return uuid;

	}

	static findExtendedObject(data, objectFind) {
		for (var i = 0; i < data.length; i++) {
			var item = data[i];
			let isNotEquale = false;
			for (let j in objectFind) {
				if (objectFind.hasOwnProperty(j)) {
					if (objectFind[j] === item[j]) continue;
					isNotEquale = true;
					break;
				}
			}
			if (isNotEquale) continue;
			else return item;
		}
		return false;
	}

	static findOriginalObjectIndex(data, objectFind) {
		if (!data) return false;
		for (var i = 0; i < data.length; i++) {
			var item = data[i];
			let isNotEquale = false;
			for (let j in item) {
				if (item.hasOwnProperty(j)) {
					if (objectFind[j] === item[j]) continue;
					isNotEquale = true;
					break;
				}
			}
			if (isNotEquale) continue;
			else return i;
		}
		return -1;
	}

	static isEmptyObject(item) {
		for (let prop in item) {
			if (!item.hasOwnProperty(prop)) continue;
			return false;
		}
		return true;
	}

	static findObject(data, columnToSearch, value) {
		if (!data) return false;
		for (var i = 0; i < data.length; i++) {
			var item = data[i];
			if (typeof (item[columnToSearch]) === 'undefined') continue;
			if (item[columnToSearch] == value) return item;
		}
		return false;
	}

	static findObjectIndex(data, columnToSearch, value) {
		for (var i = 0; i < data.length; i++) {
			var item = data[i];
			if (!angular.isDefined(item[columnToSearch])) continue;
			if (item[columnToSearch] == value) return i;
		}
		return -1;
	}

	static getScopeVariable(variable, scope) {
		return scope.$eval(variable);
	}

	static setScopeVariable(variable, scope, value) {
		return $parse(variable).assign(scope, value);
	}

	static createScopeVariable(variable, scope, value) {
		return $parse(variable).assign(scope, value);
	}

	static getDistinctObjectsById(data, fieldList) {
		var values = [];
		var fields = fieldList.split(',');
		var idField = fields[0];
		for (var i = 0; i < data.length; i++) {
			var item = data[i];
			var newElement = {};
			for (var j in fields) {
				if (fields.hasOwnProperty(j)) {
					var field = fields[j];
					newElement[field] = item[field];
				}
			}
			if (values.findIndex(x => x[idField] == newElement[idField]) === -1) values.push(newElement); // jshint ignore:line
		}
		return values;
	}

	static getDirectChildrenOfType(source, tagName) {
		var children = [];
		for (let i = 0; i < source.children.length; i++) {
			var child = source.children[i];
			if (child.tagName !== tagName.toUpperCase()) continue;
			children.push(child);
		}
		return children;
	}

	static date(date) {
		return moment(moment(date).format('YYYY-MM-DDT00:00:00'));
		//return moment(moment(date).format('YYYY-MM-DD 00:00:00 0000'));
	}

	static removeTimeZoneOffset(dt) {
		var m = moment(dt).utc();
		dt = moment(m).utc().add(m.utcOffset(), 'm').toDate();
		return dt;
	}

	static DOM(date) {
		return parseInt(moment(date).format('DD'));
	}

	static range(start, end) {
		return moment().range(this.date(start), this.date(end));
	}

	static dateIsInRange(date, start, end) {
		return moment(date).diff(start) >= 0 && end.diff(moment(date)) > 0;
	}

	static between(start, end, period) {
		return moment(end).diff(start, period);
	}

	static daysBetween(start, end) {
		return moment(end).diff(start, 'days');
	}

}

if (typeof navigator !== 'undefined' && navigator) {
	axUtils.navigator = {
		isOpera: (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0,

		// Firefox 1.0+
		isFirefox: typeof InstallTrigger !== 'undefined',

		// Safari 3.0+ "[object HTMLElementConstructor]"
		isSafari: /constructor/i.test(window.HTMLElement) || (function (p) {
			return p.toString() === "[object SafariRemoteNotification]";
		})(!window.safari || (typeof safari !== 'undefined' && safari.pushNotification)),

		// Internet Explorer 6-11
		isIE: /*@cc_on!@*/false || !!document.documentMode,

		// Chrome 1+
		isChrome: !!window.chrome && !!window.chrome.webstore
	};
	// Edge 20+
	axUtils.navigator.isEdge = !axUtils.navigator.isIE && !!window.StyleMedia;
	// Blink engine detection
	axUtils.navigator.isBlink = (axUtils.navigator.isChrome || axUtils.navigator.isOpera) && !!window.CSS;
}

if (typeof window === 'undefined')
	module.exports = axUtils;


class axTest {
	constructor() {

	}

	createDumb() {
	}
}