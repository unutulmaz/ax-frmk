var axElements = {};

class axElement {
	constructor(scope, source) {
		if (scope) this.scope = scope;
		if (source) this.source = source;
		this.attributes = {};

		// ATENTIE!: Nu se folosesc ghilimele la valori
	}

	static compile(html) {
		var wrraper = document.createElement("div");
		wrraper.innerHTML = html;
		var newElement = axElement.createElement(wrraper);
		var htmlToInject = newElement.innerHTML;
		return htmlToInject;
	}

	static createElement(element) {
		if (!element) return null;
		if (!element.tagName) {
			console.error("Element without tagName: ", element);
			return element;
		}
		var tagName = element.tagName;
		var axConstructor = tagName.toLowerCase().replace('ax-', '');
		if (['AX-TABLE', 'AX-DATA-CONTENT', 'AX-LIST', 'AX-FORM'].indexOf(tagName) > -1) return element;
		else if (tagName.startsWith("AX-") && axElements[axConstructor]) return axElement.createViewElement(element);
		else {
			var newElement = axElement.createDOMElement(tagName, element.attributes);
			axElement.addChildren(newElement, element);
			return newElement;
		}
	}

	static addChildren(newElement, oldElement) {
		for (let i = 0; i < oldElement.childNodes.length; i++) {
			var oldChild = oldElement.childNodes[i];
			var newChild;
			//console.log("Add node:", oldChild.nodeName, oldChild);
			if (oldChild.nodeName === "#text") newChild = document.createTextNode(oldChild.nodeValue);
			else if (oldChild.nodeName === "#comment") newChild = document.createComment(oldChild.nodeValue);
			else newChild = axElement.createElement(oldChild);
			newElement.appendChild(newChild);
		}
		return newElement;
	}
	static getChildrenHtml(oldElement) {
		let html = "";
		for (let i = 0; i < oldElement.childNodes.length; i++) {
			var oldChild = oldElement.childNodes[i];
			var newChild;
			//console.log("Add node:", oldChild.nodeName, oldChild);
			if (oldChild.nodeName === "#text") newChild = document.createTextNode(oldChild.nodeValue);
			else if (oldChild.nodeName === "#comment") newChild = document.createComment(oldChild.nodeValue);
			else {
				newChild = axElement.createElement(oldChild);
				html += newChild.outerHTML;
			}
		}
		return html;
	}

	/**
	 *
	 * @param {HTMLElement} element
	 * @returns {HTMLElement}
	 */
	static createViewElement(element) {
		var elementType = element.tagName.substr(3);
		var constructorName = elementType.toLowerCase();
		var axElement = new axElements[constructorName]();
		var axe = axElement.create(element, axElement.scope);
		return axe;
	}

	/**
	 * Transform a list with items separated by ";" and each item contain key=value into an object
	 * @param list
	 * @returns {{}}
	 */
	transformListToObject(list) {
		var array = list ? list.split(";") : [];
		var newObj = {};
		for (let i = 0; i < array.length; i++) {
			var item = array[i];
			var itemArray = item.split("=");
			if (itemArray[0] === "") continue;
			if (itemArray[0].indexOf(" ") > 0) console.error("The property name cannot contain space: ", itemArray[0]);
			if (itemArray.length === 1) newObj[itemArray[0]] = undefined;
			else {
				newObj[itemArray[0]] = itemArray[1];
			}
		}
		return newObj;
	}

	transformHtmlToElement(html) {
		var div = document.createElement('div');
		div.innerHTML = html;
		return div.childNodes[0];
	}

	/**
	 *
	 * @param tagName
	 * @param attributes
	 * @returns {axElement}
	 */
	static createDOMElement(tagName, attributes, innerHTML, parent) {
		var element = document.createElement(tagName);
		if (attributes && attributes.constructor === Object) {
			for (let attribute in attributes) {
				if (attributes.hasOwnProperty(attribute)) {
					let attributeName = axUtils.reverseCamelCase(attribute);
					element.setAttribute(attributeName, attributes[attribute]);
				}
			}
		} else if (attributes) {
			for (let i = 0; i < attributes.length; i++) {
				let attribute = attributes[i];
				if (!attribute.nodeName) continue;
				element.setAttribute(attribute.nodeName, attribute.nodeValue);
			}
		}
		if (angular.isString(innerHTML)) element.innerHTML = innerHTML;
		else if (angular.isObject(innerHTML)) element.appendChild(innerHTML);

		element.addClass = function (className) {
			if (this.hasClass(className)) return;
			this.className += (this.className ? " " : "") + className;
		};
		element.removeClass = function (className) {
			var listExisting = this.className.split(" ");
			var listToRemove = className.split(" ");
			for (let i = 0; i < listToRemove.length; i++) {
				let index = listExisting.indexOf(className);
				if (index === -1) continue;
				listExisting.splice(index, 1);
			}
			this.className = listExisting.join(" ");
		};
		element.hasClass = function (className) {
			var listExisting = this.className.split(" ");
			return listExisting.indexOf(className) > -1;
		};

		element.addCssText = function (cssText) {
			var cssList = cssText.split(";");
			for (let i = 0; i < cssList.length; i++) {
				if (cssList[i].split(":").length !== 2) continue;
				this.addStyle(cssList[i].split(":")[0], cssList[i].split(":")[1]);
			}
		};
		element.addStyle = function (style, value) {
			var cssVals = this.style.cssText.split(";");
			var newStyle = "";
			for (let i = 0; i < cssVals.length; i++) {
				let cssItem = cssVals[i];
				if (cssItem.indexOf(":") === -1) continue;
				let name = cssItem.split(":")[0].trim();
				if (name === style) continue;
				newStyle += cssItem + ";";
			}
			this.style[style] = value;
			newStyle += style + ":" + value + ";";
			this.style.cssText = newStyle;
		};
		element.hasStyle = function (style) {
			if (this.style[style]) return true;
			var cssVals = this.style.cssText.split(";");
			for (let i = 0; i < cssVals.length; i++) {
				let cssItem = cssVals[i];
				if (cssItem.indexOf(":") === -1) continue;
				let name = cssItem.split(":")[0].trim();
				if (name === style) return true;
			}
			return false;
		};
		element.addAttributes = function (attributes, element) {
			if (!attributes) return;
			element = element || this;
			if (attributes && attributes.constructor === Object)
				for (let attribute in attributes) {
					if (attributes.hasOwnProperty(attribute)) {
						element.setAttribute(attribute, attributes[attribute]);
					}
				}
			else for (let i = 0; i < attributes.length; i++) {
				if (!attributes[i].nodeName);
				element.setAttribute(attributes[i].nodeName, attributes[i].nodeValue);
			}
		};
		element.addChildren = axElement.addChildren;
		if (angular.isObject(parent)) parent.appendChild(element);
		return element;
	}

	/**
	 *
	 * @param {HTMLElement} element
	 * @param {object} scope
	 * @returns {HTMLElement}
	 */
	create(element, scope) {
		this.extractAttributesValues(element, scope);
		var newElement = axElement.createElement(element);
		return newElement;
	}

	extendAttributes(attributes) {
		angular.extend(this.attributes, attributes);
	}

	createDOMElement(tagName, attributes, innerHTML, parent) {
		return axElement.createDOMElement(tagName, attributes, innerHTML, parent);

	}

	addAttributes() {
		let attributes = this.attributes;
		for (let attribute in attributes) {
			if (attributes.hasOwnProperty(attribute)) {
				this.source.setAttribute(attribute, attributes[attribute]);
			}
		}
	}

	static addAttributesToElement(element, attributes) {
		if (attributes.length === 0) return;
		for (let i in attributes) {
			if (attributes.hasOwnProperty(i)) {
				var attribute = attributes[i];
				element.setAttribute(attribute.name, attribute.value);
			}
		}
	}

	static addJsonAttributesToElement(element, attributes) {
		if (attributes.length === 0) return;
		for (let attribute in attributes) {
			var value = attributes[attribute];
			element.setAttribute(attribute, value);
		}
	}

	hasSourceAttribute(attribute) {
		return this.source.hasAttribute(attribute);
	}

	getSourceAttribute(attribute) {
		return this.source.getAttribute(attribute);
	}

	setSourceAttribute(attribute, value) {
		return this.source.setAttribute(attribute, value);
	}
	addCssText(cssText) {
		var cssList = cssText.split(";");
		for (let i = 0; i < cssList.length; i++) {
			if (cssList[i].split(":").length !== 2) continue;
			this.source.addStyle(cssList[i].split(":")[0], cssList[i].split(":")[1]);
		}
	}
	addStyle(attribute, value) {
		var cssVals = this.source.style.cssText.split(";");
		var newStyle = "";
		for (let i = 0; i < cssVals.length; i++) {
			let cssItem = cssVals[i];
			if (cssItem.indexOf(":") === -1) continue;
			let name = cssItem.split(":")[0].trim();
			if (name === style) continue;
			newStyle += cssItem + ";";
		}
		this.source.style[style] = value;
		newStyle += style + ":" + value + ";";
		this.source.style.cssText = newStyle;
	}

	addChildrenToNew(newElement) {
		return axElement.addChildren(newElement, this.source);
	}


	/**
	 * Metoda cauta atributele definite ca specifice si culege valorile acestora si apoi le sterge din lista de atribute ale sursei
	 * In cazul atributelor width si height - le muta in atributul style al sursei
	 * Pt. readonly si disabled (daca sunt declarate ca atribute specifice - le pastreaza in lista de atribute doar daca au valoarea true
	 * @param element
	 * @param scope
	 */
	extractAttributesValues(element, scope, dontRemoveAttributes) {
		if (element.tagName !== 'AX-TABLE') this.source = element ;
		if (scope) this.scope = scope;
		var clone = angular.copy(element);
		let attributes1 = this.attributes;
		for (let i = 0; i < clone.attributes.length; i++) {
			let attribute = clone.attributes[i];
			if (!attribute.nodeName || attribute.nodeValue === 'null') continue;
			if (attributes1.hasOwnProperty(attribute.nodeName)) {
				attributes1[attribute.nodeName] = attribute.nodeValue;
				//if (!dontRemoveAttributes) element.removeAttribute(attribute.nodeName);
			}
		}
		if (clone.attributes.hasOwnProperty("width")) {
			var width = clone.attributes.width.nodeValue.replace(";", "");
			element.style.width = "";
			element.style.cssText += "width: " + width + ";";
			if (!dontRemoveAttributes) element.removeAttribute('width');
		}
		if (clone.attributes.hasOwnProperty("height")) {
			var height = clone.attributes.height.nodeValue.replace(";", "");
			element.style.height = "";
			element.style.cssText += "height: " + height + ";";
			if (!dontRemoveAttributes) element.removeAttribute('height');
		}
		if (clone.attributes.hasOwnProperty("readonly")) {
			if (clone.attributes.readonly.nodeValue === "true" || clone.attributes.readonly.nodeValue === "readonly") element.setAttribute('readonly', 'readonly');
			else if (!dontRemoveAttributes) element.removeAttribute('readonly');
		}
		if (clone.attributes.hasOwnProperty("disabled")) {
			if (clone.attributes.disabled.nodeValue === "true" || clone.attributes.disabled.nodeValue === "disabled") element.setAttribute('disabled', 'disabled');
			else if (!dontRemoveAttributes) element.removeAttribute('disabled');
		}
		this.validate();

	}

	validateAttribute(attribute, message) {
		if (this.attributes[attribute]) return true;
		var errorMessage = message || "Attribute validation error: Empty attribute value for: " + attribute;
		console.log("Source error: ", this.source);
		throw errorMessage;
	}

	validate() {
	}

	/**
	 * Adauga la element copii source de un anumit tagName
	 * @param element
	 * @param tagName
	 */
	appendChildrenOfType(element, tagName) {
		var children = this.getDirectChildrenOfType(tagName);
		for (let i = 0; i < children.length; i++) {
			var child = children[i];
			element.appendChild(child);
		}
	}

	/**
	 * intoarce copii de un anumit tagName al source sau al unui alt element
	 * @param {string} tagName
	 * @param {Object} source
	 * @returns {Array}
	 */
	getDirectChildrenOfType(tagName, source) {
		source = source ? source : this.source;
		var children = [];
		for (let i = 0; i < source.children.length; i++) {
			var child = source.children[i];
			if (child.tagName !== tagName.toUpperCase()) continue;
			children.push(child);
		}
		return children;
	}

	/**
	 * itereaza copii directi source
	 * @param tagName
	 * @param callback
	 * @returns {number} number of children of type = tagName
	 */
	forEachChildrenOfType(tagName, callback, source) {
		var cnt = 0;
		source = source || this.source;
		for (let i = 0; i < source.children.length; i++) {
			var obj = source.children[i];
			if (obj.tagName !== tagName.toUpperCase()) continue;
			cnt++;
			if (callback) callback(obj, this);
		}
		return cnt;
	}

	forEachChildren(callback) {
		for (let i = 0; i < this.source.children.length; i++) {
			var obj = this.source.children[i];
			callback(obj, this);
		}
	}

	/**
	 * Sterge toti copii din source element
	 */
	removeAllChildren() {
		while (this.source.firstChild) {
			this.source.removeChild(this.source.firstChild);
		}
	}

	/**
	 * Sterge din source copii de un anumit tip (tagName)
	 * @param tagName
	 */
	removeChildrenOfType(tagName, element) {
		element = element || this.source;
		do {
			var children = this.getDirectChildrenOfType(tagName, element);
			if (children.length > 0) element.removeChild(children[0]);
			if (children.length === 0) break;
		} while (true);
	}
}

var createElement = axElement.createDOMElement;

jQuery.fn.extend({
	jQueryExtended: true,
	outerHTML: function (s) {
		return s ? this.before(s).remove() : jQuery("<p>").append(this.eq(0).clone()).html();
	},
	slideShow: function (origin, durationInMs, finishCallback, tandemElement, absolute) {
		let self = this;
		if (tandemElement) {
			let totalWidth = tandemElement.width();
			let selfWidth = parseInt(this.css("width")) || totalWidth;
			if (absolute) {
				if (origin === "left") {
					self.css({ "left": -selfWidth + "px", "visibility": "", "display": "block" });
					if (this[0].style.width !== "100%") {self.css("right", "initial");}
					this.animate({ left: 0 }, {
						duration: durationInMs,
						progress: function () {
							let left = parseInt(self.css("left")) + selfWidth;
							tandemElement[0].style.left = left + "px";
						},
						done: function () {
							if (finishCallback) finishCallback(this);
						}
					});
				} else if (origin === "right") {
					self.css({ "left": "initial", "right": -selfWidth, "visibility": "", "display": "block" });
					this.animate({ right: 0 }, {
						duration: durationInMs,
						progress: function () {
							let right = parseInt(self.css("right"));
							tandemElement[0].style.right = (right + selfWidth) + "px";
						},
						done: function () {
							if (finishCallback) finishCallback(this);
						}
					});
				}
			} else {
				this.css({ "width": 0 });
				this.animate({ width: selfWidth }, {
					duration: durationInMs,
					start: function () {
						self.css({ "visibility": "", "display": "block" });
					},
					progress: function () {
						let width = self.width();
						tandemElement.width(totalWidth - width);
					},
					done: function () {
						if (finishCallback) finishCallback(this);
					}
				});
			}
		} else {
			let animation = "scale-" + (["top", "bottom"].includes(origin) ? "vertically" : "horizontally") + "-in";
			this[0].style.visibility = "";
			this[0].style.display = "block";
			this[0].style["transform-origin"] = origin;
			this[0].style.animation = animation + ' ' + durationInMs + "ms";
			if (finishCallback) setTimeout(finishCallback, durationInMs);
		}
	},
	slideHide: function (origin, durationInMs, finishCallback, tandemElement) {
		let self = this;
		if (tandemElement) {
			if (origin === "right") {
				let totalWidth = tandemElement.parent().width();
				tandemElement[0].style.left = 0;
				this.animate({ left: totalWidth }, {
					duration: durationInMs + "ms",
					done: function () {
						self[0].style.display = "none";
						if (finishCallback) finishCallback();
					},
					progress: function () {
						let selfVisibleWidth = parseInt(self.css("left"));
						tandemElement[0].style.right = (totalWidth - selfVisibleWidth) + "px";
					}
				});
			} else if (origin === "left") {
				let width = self.width();
				this.animate({ left: - width }, {
					duration: durationInMs + "ms",
					done: function () {
						self[0].style.display = "none";
						if (finishCallback) finishCallback();
					},
					progress: function () {
						let left = parseInt(self.css("left")) + width;
						//console.log(left, self.css("left"), width);
						tandemElement[0].style.left = left + "px";
					}
				});
			}
		} else {
			let animation = "scale-" + (["top", "bottom"].includes(origin) ? "vertically" : "horizontally") + "-out";
			this[0].style["transform-origin"] = origin;
			this[0].style.animation = animation + ' ' + durationInMs + "ms";

			setTimeout(
				function () {
					if (finishCallback) finishCallback();
					self[0].style.display = "none";
				}, durationInMs - 30);
		}
	},
	hasAttribute: function (attrName) {
		attrName = axUtils.reverseCamelCase(attrName);
		return this[0].hasAttribute(attrName);
	},
	removeAttribute: function (attrName) {
		attrName = axUtils.reverseCamelCase(attrName);
		return this[0].removeAttribute(attrName);
	},
	getAttribute: function (attrName) {
		attrName = axUtils.reverseCamelCase(attrName);
		return this[0].getAttribute(attrName);
	},
	setAttribute: function (attrName, value) {
		attrName = axUtils.reverseCamelCase(attrName);
		return this[0].setAttribute(attrName, value);
	},
	appendChild: function (child) {
		if (child.jQueryExtended) this[0].appendChild(child[0]);
		else this[0].appendChild(child);
	},
	hasNonFalseAttribute: function (attrName, value) {
		return this[0].hasAttribute(attrName) && this[0].getAttribute(attrName) !== "false";
	},
	addCssText: function (cssText) {
		var cssList = cssText.split(";");
		for (let i = 0; i < cssList.length; i++) {
			if (cssList[i].split(":").length !== 2) continue;
			this.addStyle(cssList[i].split(":")[0], cssList[i].split(":")[1]);
		}
	},
	getAttributes() {
		let attributes = {};
		if (this.length === 0) return attributes;
		for (let i = 0; i < this[0].attributes.length; i++) {
			let attrNode = this[0].attributes[i];
			let attrName = axUtils.camelCase(attrNode.nodeName);
			attributes[attrName] = attrNode.nodeValue;
		}
		return attributes;
	},
	addStyle: function (style, value) {
		var cssVals = this[0].style.cssText.split(";");
		var newStyle = "";
		for (let i = 0; i < cssVals.length; i++) {
			let cssItem = cssVals[i];
			if (cssItem.indexOf(":") === -1) continue;
			let name = cssItem.split(":")[0].trim();
			if (name === style) continue;
			newStyle += cssItem + ";";
		}
		this[0].style[style] = value;
		newStyle += style + ":" + value + ";";
		this[0].style.cssText = newStyle;
	},
	hasStyle: function (style) {
		if (this[0].style[style]) return true;
		var cssVals = this[0].style.cssText.split(";");
		for (let i = 0; i < cssVals.length; i++) {
			let cssItem = cssVals[i];
			if (cssItem.indexOf(":") === -1) continue;
			let name = cssItem.split(":")[0].trim();
			if (name === style) return true;
		}
		return false;
	},
	addAttributes: function (attributes, element) {
		if (!attributes) return;
		element = element || this[0];
		if (attributes && attributes.constructor === Object)
			for (let attribute in attributes) {
				if (attributes.hasOwnProperty(attribute)) {
					element.setAttribute(attribute, attributes[attribute]);
				}
			}
		else for (let i = 0; i < attributes.length; i++) {
			if (!attributes[i].nodeName);
			element.setAttribute(attributes[i].nodeName, attributes[i].nodeValue);
		}
	}
});

class axDocument {
	constructor(config, type) {
		//this.docType = '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">';
		this.docType = '<!DOCTYPE html>';
		this.exportType = type;
		this.config = config;
		this.createHtml();
		this.createHead();
		this.body = createElement("body");
	}
	createHtml() {
		let attrs = this.exportType === "xls" ? {
			"xmlns:o": "urn:schemas-microsoft-com:office:office",
			"xmlns:x": "urn:schemas-microsoft-com:office:excel",
			"xmlns": "http://www.w3.org/TR/REC-html40"
		} : { lang: "end" };
		this.html = createElement("html", attrs);
		if (this.config.find("ax-export-style").length > 0) this.addStyle(this.config.find("ax-export-style").html());
		if (this.config.find("ax-export-style-" + this.exportType).length > 0) this.addStyle(this.config.find("ax-export-style-" + this.exportType).html());
	}
	createHead() {
		this.head = createElement("head");
		if (this.exportType === "xls")
			this.head.innerHTML =
				`	<meta http-equiv=Content-Type content="text/html; charset=windows-1252">
	<meta name="ProgId" content="Excel.Sheet">
	<meta name="Generator" content="Microsoft Excel 11">`;

		if (this.config.find("ax-export-links").length > 0) this.addLinks(this.config.find("ax-export-links")[0].children);
		if (this.config.find("ax-export-scripts").length > 0) this.addScripts(this.config.find("ax-export-scripts")[0].children);
	}
	addLinks(items) {
		if (!items) return;
		items.each(function (item) {
			createElement("link", item.attributes, "", this.head);
		}, this);
	}
	addScripts(items) {
		if (!items) return;
		items.each(function (item) {
			createElement("script", item.attributes, "", this.head);
		}, this);
	}
	addStyle(style) {
		if (!style) return;
		createElement("style", {}, style.replaceAll("&gt;", ">"), this.html);
	}
	getHtml() {
		let html = this.docType;
		this.html.appendChild(this.head);
		this.html.appendChild(this.body);
		html += this.html.outerHTML;
		return html;
	}
}

