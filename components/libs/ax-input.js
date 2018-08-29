class axInput extends axElement {
	constructor(element, scope, axColumn) {
		super();
	}

	extractAttributesValues(element, scope, holder) {
		super.extractAttributesValues(element, scope);
		if (this.attributes["bind-to"]) {
			this.source.setAttribute("ng-model", "dataItem['" + this.attributes["bind-to"] + "']");
		}
	}

	validate() {
		this.validateAttribute("type");
		if (this.attributes.datasource) {
			this.validateAttribute("item-id-field", "For datasource, you need to set a item-id-field for options");
		}
	}

	createInputElement(sourceType, bindTo, source, type, element, ngDisabled, ngBlur, ngModel, ngFocus, save, hasClearIcon, elementClass) {
		var input, rangeSeparatorClass = "fa fa-minus", minValue, maxValue, separator, isDate = false;
		switch (type) {
			case "dropdown-list": {
				let selectable = source.getAttribute("selectable-rows") || source.getAttribute("list-selectable-rows") || "single";
				let attrs = {
					'has-input': true,
					'style': source.style.cssText,
					class: elementClass,
					'disable-animation': source.getAttribute('disable-animation') || false,
					'close-on-mouseleave': source.getAttribute('close-on-mouseleave1') || source.getAttribute('close-on-blur1') || false,
					'empty-option-text': this.attributes['empty-option-text'] || "''",
					'dropdown-model-type': source.getAttribute('model-type') || source.getAttribute("dropdown-model-type") || source.getAttribute("selectable-rows-model-type") || 'id-field',
					'dropdown-model': ngModel || this.source.getAttribute("dropdown-model"),
					'list-selectable-rows': selectable,
					'list-item-id-field': source.getAttribute("item-id-field") || "",
					'list-item-display-field': source.getAttribute("item-display-field") || source.getAttribute("item-id-field") || "",
					'popup-height': source.getAttribute('list-height') || source.getAttribute('popup-height') || '150px',
					'list-height': '100%'

				};
				if (source.hasAttribute("datasource")) attrs.datasource = source.getAttribute("datasource");
				if (save || source.getAttribute("ng-change")) attrs["on-selection-change"] = save || source.getAttribute("ng-change") || source.getAttribute("on-selection-change");
				if (ngDisabled) attrs["ng-disabled"] = ngDisabled;
				if (!source.style['margin-right']) attrs.style += ';margin-right:0;';
				if (source.hasAttribute('ctrl')) attrs.ctrl = source.getAttribute('ctrl');
				if (source.hasAttribute('show-search')) attrs['list-show-search'] = source.getAttribute('show-search');
				if (source.hasAttribute('show-clear-button')) attrs['show-clear-button'] = source.getAttribute('show-clear-button');
				if (source.hasAttribute('item-show-check')) attrs['list-item-show-check'] = source.getAttribute('item-show-check');
				if (source.hasAttribute('list-width')) attrs['list-width'] = source.getAttribute('list-width');
				else if (source.hasAttribute('popup-width')) attrs['list-width'] = source.getAttribute('popup-width');
				else if (source.getAttribute('popup-width') || source.style.width || source.getAttribute('width')) attrs['list-width'] = source.getAttribute('popup-width') || source.style.width || (source.getAttribute('width') ? parseInt(source.getAttribute('width')) - 1 + 'px' : '');
				if (source.hasAttribute('popup-max-width')) attrs['popup-max-width'] = source.getAttribute('popup-max-width');
				if (source.hasAttribute('popup-height')) attrs['popup-height'] = source.getAttribute('popup-height');
				if (source.hasAttribute('popup-max-height')) attrs['popup-max-height'] = source.getAttribute('popup-max-height');
				if (source.hasAttribute('add-empty-option')) attrs['list-add-empty-row'] = source.getAttribute('add-empty-option');
				if (source.hasAttribute('add-empty-row')) attrs['list-add-empty-row'] = source.getAttribute('add-empty-row');
				if (source.hasAttribute('item-invariant-field')) attrs['list-item-invariant-field'] = source.getAttribute('item-invariant-field');
				attrs['list-order-by'] = source.getAttribute('order-by') || source.getAttribute('item-invariant-field') || source.getAttribute('item-display-field') || source.getAttribute('item-id-field');
				if (selectable === 'multiple') {
					attrs['list-show-check-all'] = source.getAttribute('show-check-all') || 'true';
					attrs['list-show-uncheck-all'] = source.getAttribute('show-uncheck-all') || 'true';
					attrs['list-selectable-rows-checked-class'] = source.getAttribute('selectable-rows-checked-class') || 'fa fa-check-square-o';
					attrs['list-selectable-rows-unchecked-class'] = source.getAttribute('selectable-rows-unchecked-class') || 'fa fa-square-o';
				}
				this.source.removeAttribute('width');
				this.source.removeAttribute('ng-model');
				this.source.removeAttribute('ng-change');
				element = this.createDOMElement('ax-dropdown-list', this.source.attributes, source.innerHTML);
				if (source.hasAttribute("width")) attrs.style += "width: " + source.getAttribute("width") + ";";
				this.source.innerHTML = "";
				if (ngFocus) element.setAttribute("ng-focus", ngFocus);
				if (ngBlur) element.setAttribute("ng-blur", ngBlur);
				if (source.hasAttribute("link-popup-template-url")) {
					for (let i = 0; i < source.attributes.length; i++) {
						let attrName = source.attributes[i].nodeName;
						if (!attrName.startsWith("link-popup")) continue;
						element.setAttribute(attrName, source.attributes[i].nodeValue);
					}
				}
				element.addAttributes(attrs);
				//if (!element.hasStyle("width") && !element.hasAttribute("list-width")) throw "Dropdown list must have a width set!:\n-" + element.outerHTML +"\n";
			}
				break;

			case "number-spin": {
				element = axElement.createDOMElement('div', this.source.attributes);
				element.addClass("number-spin");
				element.addClass("inline");
				if (ngDisabled) element.setAttribute("ng-disabled", ngDisabled);
				element.removeAttribute("ng-model");
				var ngChange = this.source.getAttribute("ax-on-change") || "";
				var step = parseFloat(this.source.getAttribute("step")) || 1;
				//var maxValue = parseFloat(this.source.getAttribute("max-value"));
				//var minValue = parseFloat(this.source.getAttribute("min-value"));

				var ngClick = "$event.stopPropagation();" + ngDisabled + " ?false:((" + ngModel + " = " + ngModel + " - " + step + ") || true) && " + ngChange + " && " + save + "";
				var buttonMinus = axElement.createDOMElement('i', {class: "fa fa-minus", "ng-click": ngClick});
				element.appendChild(buttonMinus);

				input = axElement.createDOMElement("input", {type: "text", "ng-model": ngModel, "readonly": "readonly"});
				input.setAttribute("has-input", "true");
				input.setAttribute("ng-focus", ngFocus);
				if (ngBlur) input.setAttribute("ng-blur", ngBlur);
				input.setAttribute("ng-disabled", ngDisabled);
				input.setAttribute("ng-keydown", ngDisabled + "?false: $ctr.config.objectKeyPress($event, dataItem, '" + this.attributes['bind-to'] + "')");
				element.appendChild(input);
				ngClick = "$event.stopPropagation();" + ngDisabled + " ?false:((" + ngModel + " = " + ngModel + " + " + step + ") || true) && " + ngChange + " && " + save + "";
				var buttonPlus = axElement.createDOMElement('i', {class: "fa fa-plus", "ng-click": ngClick});
				buttonPlus.setAttribute("ng-disabled", ngDisabled);
				element.appendChild(buttonPlus);
			}
				break;
			case "text-range": {
				delete this.source.style.width;
				element = axElement.createDOMElement('div', {class: "", "ng-class": "$ctrl.filters.range['" + bindTo + "'].operator"});
				if (ngDisabled) element.setAttribute("ng-disabled", ngDisabled);

				element.hasClearIcon = false;

				minValue = axElement.createDOMElement('ax-text', this.source.attributes);
				minValue.style.width = "";
				minValue.setAttribute("ng-model", "$ctrl.filters.range['" + bindTo + "'].minValue");
				minValue.setAttribute("ng-change", save);
				minValue.setAttribute("ng-show", "['between','between equal','bigger-than', 'bigger-than equal','exact'].indexOf($ctrl.filters.range['" + bindTo + "'].operator.replace(' equal',''))>-1");

				if (ngDisabled) minValue.setAttribute("ng-disabled", ngDisabled);
				element.appendChild(minValue);

				separator = axElement.createDOMElement('i', {"ng-class": "$ctrl.filters.range['" + bindTo + "'].operator", class: "operator"});
				if (ngDisabled) separator.setAttribute("ng-disabled", ngDisabled);
				element.appendChild(separator);
				maxValue = axElement.createDOMElement('ax-text', this.source.attributes);
				maxValue.style.width = "";
				maxValue.setAttribute("ng-model", "$ctrl.filters.range['" + bindTo + "'].maxValue");
				maxValue.setAttribute("ng-change", save);
				maxValue.setAttribute("ng-show", "['between','between equal','less-than', 'less-than equal'].indexOf($ctrl.filters.range['" + bindTo + "'].operator)>-1");

				if (ngDisabled) maxValue.setAttribute("ng-disabled", ngDisabled);

				element.appendChild(maxValue);
			}
				break;
			case "textarea": {
				var height = parseInt(this.source.style.height);
				this.source.style.height = height + "px";
				//nu funct. selectare text daca pun la div.class=form-control
				element = axElement.createDOMElement("div", {style: this.source.style.cssText});
				element.style.position = "relative";
				this.source.style.cssText = "";
				input = axElement.createDOMElement('textarea', this.source.attributes);
				input.setAttribute("has-input", "true");
				input.style.cssText = "position:relative;width:100%;height:100%";
				if (ngDisabled) input.setAttribute("ng-disabled", ngDisabled);
				element.appendChild(input);
				if (ngFocus) element.setAttribute("ng-focus", ngFocus);
				if (ngBlur || save) element.setAttribute("ng-blur", ngBlur + (save && ngBlur ? " && " + save : ""));
			}
				break;
			case "datetime-range":
				this.source.setAttribute("type", "datetime");//jshint ignore:line
			case "date-range": {
				if (this.source.getAttribute("type") !== "datetime") this.source.setAttribute("type", "date");
				element = axElement.createDOMElement('div', {"ng-class": "$ctrl.filters.range['" + bindTo + "'].operator"});
				element.hasClearIcon = false;
				this.source.removeAttribute("ng-change");
				minValue = axElement.createDOMElement('ax-datetime', this.source.attributes);
				minValue.style.width = "";
				minValue.setAttribute("ng-model", "$ctrl.filters.range['" + bindTo + "'].minValue");
				minValue.setAttribute("save-data", save);
				minValue.setAttribute("ng-show", "['between','between equal','bigger-than', 'bigger-than equal','exact'].indexOf($ctrl.filters.range['" + bindTo + "'].operator.replace(' equal',''))>-1");

				if (ngDisabled) minValue.setAttribute("ng-disabled", ngDisabled);
				element.appendChild(minValue);

				separator = axElement.createDOMElement('i', {"ng-class": "$ctrl.filters.range['" + bindTo + "'].operator", class: "operator"});

				if (ngDisabled) separator.setAttribute("ng-disabled", ngDisabled);
				element.appendChild(separator);
				maxValue = axElement.createDOMElement('ax-datetime', this.source.attributes);
				maxValue.style.width = "";
				maxValue.setAttribute("ng-model", "$ctrl.filters.range['" + bindTo + "'].maxValue");
				maxValue.setAttribute("save-data", save);
				maxValue.setAttribute("ng-show", "['between','between equal','less-than', 'less-than equal'].indexOf($ctrl.filters.range['" + bindTo + "'].operator)>-1");

				if (ngDisabled) maxValue.setAttribute("ng-disabled", ngDisabled);
				element.appendChild(maxValue);
			}
				break;
			case "date":
				this.source.setAttribute("type", "date");
				isDate = true;//jshint ignore:line
			case "datetime": {
				if (!isDate) this.source.setAttribute("type", "datetime");
				element = axElement.createDOMElement('ax-datetime', this.source.attributes);
				if (ngDisabled) element.setAttribute("ng-disabled", ngDisabled);
				if (ngFocus) element.setAttribute("ng-focus", ngFocus);
				if (ngBlur) element.setAttribute("ng-blur", ngBlur);
				if (save) {
					element.setAttribute("save-data", save);
					if (save === element.getAttribute("ng-change")) element.removeAttribute("ng-change");
				}
			}
				break;
			case "number":
				this.source.setAttribute("type", "number");//jshint ignore:line
			case "password":
				if (type === "password") this.source.setAttribute("type", "password");//jshint ignore:line
			case "text": {
				element = axElement.createDOMElement('ax-text', this.source.attributes);
				if (ngDisabled) element.setAttribute("ng-disabled", ngDisabled);
				if (ngFocus) element.setAttribute("ng-focus", ngFocus);
				if (ngBlur) element.setAttribute("ax-blur", ngBlur);
				if (save) {
					element.setAttribute("save-data", save);
					if (save === element.getAttribute("ng-change")) element.removeAttribute("ng-change");
				}
			}
				break;
			case "autocomplete": {
				element = axElement.createDOMElement('ax-autocomplete', this.source.attributes, this.source.innerHTML);
				if (ngDisabled) element.setAttribute("ng-disabled", ngDisabled);
				if (ngFocus) element.setAttribute("ng-focus", ngFocus);
				if (ngBlur) element.setAttribute("ng-blur", ngBlur);
				if (save) {
					element.setAttribute("save-data", save);
					if (save === element.getAttribute("ng-change")) element.removeAttribute("ng-change");
				}
			}
				break;
			case "text-with-zoom": {
				element = axElement.createDOMElement('div', this.source.attributes);
				element.addClass("text-with-zoom");
				element.addClass("inline");
				element.removeClass("form-control");
				element.removeAttribute("ng-model");
				input = axElement.createDOMElement('input', this.source.attributes);
				if (this.scope.attrs.editRow === "editor") input.addClass("form-control");
				input.setAttribute("has-input", "true");
				input.setAttribute('type', "text");
				input.setAttribute('tabindex', 0);
				if (ngDisabled) input.setAttribute("ng-disabled", ngDisabled);
				input.setAttribute("ng-focus", ngFocus);
				input.setAttribute("ng-blur", (ngBlur ? ngBlur : "") + (ngBlur && save ? " && " : "") + (save ? save : ""));
				input.style["margin-right"] = null;
				input.style["margin-top"]=0;
				input.style["margin-bottom"]=0;

				element.appendChild(input);
				let printableElement = createElement('div', {
					class: 'printable',
					style: element.style.cssText,
					ngBind: ngModel
				}, "", element);


				let attrs = {
					'disable-animation': false,
					style: "position:absolute;right:1px;",
					"btn-class": "btn icon",
					caretClass: "fa fa-edit",
					"btn-text": "",
					"close-on-blur": "true",
					"close-on-escape": "true",
					"popup-width": "auto",
					"popup-max-height": source.getAttribute("popup-max-height") || "400px",
					"bind-to": bindTo,
					"save-data": input.getAttribute("ng-blur"),
					"open-params": "$parent.$parent.dataItem;'" + bindTo + "'",
					caretStyle: "",
					ctrl: "$ctrl.$dropdowns.fieldEdit",
					"template-url": "'components/controls/table/templates/ax-table-field-edit.html'"
				};
				var dropdown = this.createDOMElement("ax-dropdown-popup", attrs);
				dropdown.setAttribute("ng-focus", ngFocus);
				// if (ngBlur) dropdown.setAttribute("ng-blur", ngBlur);
				if (ngDisabled) dropdown.setAttribute("ng-disabled", ngDisabled);
				dropdown.addAttributes(attrs);
				dropdown.setAttribute("tabIndex", 1);
				element.appendChild(dropdown);
			}
				break;
			case "checkbox": {
				element = axElement.createDOMElement('ax-checkbox', this.source.attributes, this.source.innerHTML);
				if (element.style["margin-left"] !== "auto") {
					element.style["margin-right"] = null;
					element.style["margin-left"] = null;
				}
				element.setAttribute("has-input", "true");
				if (source.style["text-align"]) element.style["text-align"] = source.style["text-align"];
				if (ngFocus) element.setAttribute("ng-focus", ngFocus);
				if (ngBlur) element.setAttribute("ng-blur", ngBlur);
				if (save) element.setAttribute("save-data", save);
				if (ngDisabled) element.setAttribute("ng-disabled", ngDisabled);
			}
				break;
			case "radio-options": {
				element = axElement.createDOMElement('ax-radio-options', this.source.attributes);
				element.style["margin-right"] = null;
				element.style["margin-left"] = null;
				element.setAttribute("has-input", "true");
				if (source.style["text-align"]) element.style["text-align"] = source.style["text-align"];
				if (ngFocus) element.setAttribute("ng-focus", ngFocus);
				if (ngBlur) element.setAttribute("ng-blur", ngBlur);
				if (save) element.setAttribute("save-data", save);
				if (ngDisabled) element.setAttribute("ng-disabled", ngDisabled);
			}
				break;
			case "decimal":
			case "integer":
			case "number": {
				element = axElement.createDOMElement('input', this.source.attributes);
				element.setAttribute("has-input", "true");
				element.setAttribute('type', "number");
				if (source.style["text-align"]) element.style["text-align"] = source.style["text-align"];
				if (ngFocus) element.setAttribute("ng-focus", ngFocus);
				if (ngBlur || save) element.setAttribute("ng-blur", (ngBlur ? ngBlur : "") + (save && ngBlur ? " && " + save : ""));
				if (ngDisabled) element.setAttribute("ng-disabled", ngDisabled);
				if (hasClearIcon) element.hasClearIcon = hasClearIcon;
			}
				break;
			case "file": {
				element = axElement.createDOMElement('ax-file', this.source.attributes);
				if (ngDisabled) element.setAttribute("ng-disabled", ngDisabled);
				if (ngFocus) element.setAttribute("ng-focus", ngFocus);
				// if (ngBlur) element.setAttribute("ng-blur", ngBlur);
			}
				break;

			default: {
				if (type.startsWith("input")) {
					type = type.replace("input-", "");
					element = axElement.createDOMElement('input', this.source.attributes);
					element.setAttribute("has-input", "true");
					element.setAttribute('type', type);
					if (source.style["text-align"]) element.style["text-align"] = source.style["text-align"];
					if (ngFocus) element.setAttribute("ng-focus", ngFocus);
					if (ngBlur || save) element.setAttribute("ng-blur", (ngBlur ? ngBlur : "") + (save && ngBlur ? " && " + save : ""));
					if (ngDisabled) element.setAttribute("ng-disabled", ngDisabled);
					if (hasClearIcon) element.hasClearIcon = hasClearIcon;
				} else console.error("No input type exist for " + type);
			}
			//element.style.cssText = "position:static;left:0;right:0"; nu stiu de ce trebuie asa
		}
		if (["column-input", "column-filter"].indexOf(sourceType) > -1) this.removeAllChildren();
		return element;
	}
}
