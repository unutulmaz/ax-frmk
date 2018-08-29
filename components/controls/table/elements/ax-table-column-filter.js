class axTableColumnFilter extends axInput {
	constructor(element, dataTableTemplate) {
		super();
		this.attributes = {
			"bind-to": "",
			"filter-type": ""
		};
		return this.create(element, dataTableTemplate);
	}

	extractAttributesValues(element) {
		super.extractAttributesValues(element);
	}

	validate() {
		this.validateAttribute("filter-type");
	}

	create(element, dataTableTemplate) {
		this.template = dataTableTemplate;
		if (element.hasAttribute('type') && !element.hasAttribute('filter-type')) element.setAttribute('filter-type', element.getAttribute('type'));
		var originalElement = angular.copy(element);
		this.extractAttributesValues(element);
		var bindTo = this.attributes["bind-to"];
		this.source.setAttribute("role", "column-filter");
		this.source.setAttribute("class", "form-control");
		var container = this.createDOMElement("div", {class: "inline"});
		container.style.cssText += this.source.style.cssText;

		container.style.width = "100%";
		container.setAttribute("filter-for", bindTo);
		container.setAttribute("filter-type", this.attributes['filter-type']);
		if (this.getSourceAttribute('editable')) container.setAttribute("editable-column", "true");
		if (this.getSourceAttribute("convert-type")) {
			var format = this.getSourceAttribute("input-format") || "";
			var type = this.getSourceAttribute("convert-type");
			if (!this.getSourceAttribute("convert-display-format")) {
				this.setSourceAttribute("convert-display-format", type === "date" ? axDateFormat : axDateTimeFormat);
			}
			if (!angular.isDefined(this.template.controller.convertDataTypes[type])) console.error("No convert function exist for convert-type: " + type);
			this.template.controller.convertData[bindTo] = {
				inputFormat: format,
				type: type,
				fn: this.template.controller.convertDataTypes[type]
			};
		}
		if (this.attributes["filter-type"] === "custom") {
			axElement.addChildren(container, this.source);
		} else {
			var input = this.createInput(originalElement);
			if (input.hasClearIcon) {
				var clearIcon = this.createDOMElement("i",
					{
						class: "fa filter-clear fa-eraser",
						"ng-if": "$ctrl.filters.values['" + bindTo + "']",
						"ng-click": "$event.stopPropagation();$ctrl.clearFilterColumn('" + bindTo + "')"
					});
				container.appendChild(clearIcon);
			}
			if (input.hasConfig) {
				this.createConfig(input.hasConfig, input.bindTo, container);
				if (originalElement.getAttribute("show-config") === "true") container.setAttribute("show-config", true);

			}
			input.style.width = "100%";

			container.appendChild(input);
			if (this.getSourceAttribute('tooltip')) {
				var icon = this.createDOMElement("i",
					{
						class: "fa fa-question-circle",
						"uib-popover": this.getSourceAttribute('tooltip'),
						"popover-append-to-body": true,
						"popover-placement": "bottom",
						"popover-trigger": "'mouseenter'"
					});
				container.appendChild(icon);
			}
		}
		return container;
	}

	createConfig(type, bindTo, container) {
		var ngDisabled = "$ctrl.getCollection('initial').length==0 || $ctrl.inlineEditing";

		var config = createElement("ax-dropdown-popup",
			{
				ctrl: "$ctrl.$dropdowns.filtersConfig",
				style: "height:100%;position:absolute;right:2px;top:0;",
				role: "search-config",
				ngDisabled: ngDisabled,
				"btn-class": "btn icon filter-config",
				"btn-text": "",
				"caret-class": "fa fa-sliders",
				"popup-width": "auto",
				"popup-relative-top": "1px",
				closeOnMouseleave: !this.template.$dataStore.isMobileDevice,
				"open-params": "'" + bindTo + "';'" + type + "'"
			}, "");
		switch (type) {
			case "text":
			case "string":
				config.setAttribute("popup-relative-left", "-243px");
				config.setAttribute("template-url", "'components/controls/table/templates/ax-table-filter-string.html'");
				if (!this.template.controller.filters.config[bindTo]) this.template.controller.filters.config[bindTo] = {searchType: "Includes"};
				if (!container) return createElement("div", {class: "filter-config", axDynamicTemplateUrl: "'components/controls/table/templates/ax-table-filter-number.html'"});
				break;
			case "datetime":
				type = "date-time";//jshint ignore:line
			case "date-time":
			case "date":
			case "number":
				config.setAttribute("popup-relative-left", "-253px");
				config.setAttribute("template-url", "'components/controls/table/templates/ax-table-filter-number.html'");
				if (!this.template.controller.filters.config[bindTo]) {

					this.template.controller.filters.config[bindTo] = {
						operator: "Between",
						orEqual: true,
						includeNulls: false
					};
					if (!this.template.controller.filters.range[bindTo]) this.template.controller.filters.range[bindTo] = {
						minValue: undefined,
						maxValue: undefined,
						clear: function () {
							this.minValue = undefined;
							this.maxValue = undefined;
						}
					};
					this.template.controller.filters.range[bindTo].operator = "between equal";
				}
				if (!container) return createElement("div", {class: "filter-config", axDynamicTemplateUrl: "'components/controls/table/templates/ax-table-filter-number.html'"});

				break;
		}
		container.appendChild(config);

	}

	createInput(source) {
		var element, clearIcon, input, ngBlur, ngFocus;
		var type = this.attributes['filter-type'];
		var bindTo = this.attributes["bind-to"];
		if ((bindTo === "" || bindTo === "null") && type !== "custom") console.error("No bind-to attribute find for column filter " + source.outerHTML);
		var ngModel = "$ctrl.filters.values['" + bindTo + "']";
		var ngChange = "$ctrl.filterApply()";
		var ngDisabled = "$ctrl.getCollection('initial').length==0 || $ctrl.inlineEditing";
		var elementClass = "form-control";
		var sourceType = "column-filter";
		//this.source.setAttribute("tabindex", '-1');
		//this.source.setAttribute("has-input", true);
		this.source.setAttribute("ng-model", ngModel);
		this.source.setAttribute("ng-change", ngChange);
		if (source.hasAttribute("show-in-popup") && source.getAttribute("show-in-popup") !== "false") {
			let popup = createElement("ax-dropdown-popup", {
				ctrl: "$ctrl.$dropdowns.filtersConfig",
				openParams: "'" + bindTo + "';'" + type + "'",
				ngDisabled: ngDisabled,
				btnText: "''",
				class: "form-control",
				popupWidth: source.getAttribute("popup-width") || "auto",
				popupHeight: source.getAttribute("popup-height") || "auto",
				popupDirection: source.getAttribute("popup-attribute") || "up",
				closeOnMouseleave1: !this.template.$dataStore.isMobileDevice
			});
			popup.showInPopup = true;
			source.removeAttribute("show-in-popup");
			let input = this.createInput(source);
			if (input.hasConfig) {
				let config = this.createConfig(input.hasConfig, input.bindTo);
				popup.appendChild(config);
			} else {
				createElement("button", {
					class: "btn icon fa fa-close",
					style: "position:absolute;right:5px;top:10px;",
					ngClick: "popupClose()"
				}, "", popup);
			}
			createElement("div", {
				style: "padding:10px;text-align:center" + (input.hasConfig?";padding-top:0":""),
				ngIf: true,
				class: "filter-popup-input",
				ngInit: "$ctrl=$parent.launcher.$parent.$ctrl"
			}, input, popup);
			return popup;
		}
		switch (type) {
			case "":
				console.error("type or filter-type attribute is required for element: ", this.source);
				return this.source;
			case "custom":
				return null;
			case "dropdown-list":
				var selectable = source.getAttribute("selectable-rows") || source.getAttribute("list-selectable-rows");
				if (!this.template.controller.filters.arrayValues) this.template.controller.filters.arrayValues = {};
				if (!this.template.controller.filters.arrayValues[bindTo]) this.template.controller.filters.arrayValues[bindTo] = {};
				let $controller = this.template.controller;
				var filter = {
					selectedModel: [],
					selectedValues: [],
					bindTo: bindTo,
					filterStrict: source.getAttribute("filter-strict") === 'false' ? false : true,
					modelValueFieldName: source.getAttribute("item-id-field") || source.getAttribute("list-item-id-field") || "",
					selectable: selectable,
					clear: function () {
						this.selectedValues = [];
						if (selectable === 'single') this.selectedModel = undefined;
						else this.selectedModel = [];
					},
					onOpen() {
						dropdownsStack.closePopupsFor($controller.element.linked);
						this.openFinish = true;
						return true;
					},
					getValue: function (item) {
						let value = item[this.modelValueFieldName];
						if (value === null) return null;
						if (!angular.isDefined(value)) value = "";
						if (this.convertData) value = this.convertData(value);
						if (value === null) return null;
						if (!angular.isString(value)) value = value.toString();
						if (!this.filterStrict) value = value.toLowerCase().trim();
						return value;
					},
					onSelectionChange: function () {
						var values = [];
						if (selectable === 'single') {
							if (this.selectedModel && !axUtils.isEmptyObject(this.selectedModel)) {
								let value = this.getValue(this.selectedModel);
								values.push(value);
							}
						} else {
							for (let i = 0; i < this.selectedModel.length; i++) {
								let item = this.selectedModel[i];
								let value = this.getValue(item);
								values.push(value);
							}
						}
						this.selectedValues = values;
					}
				};

				angular.extend(this.template.controller.filters.arrayValues[bindTo], filter);
				ngChange = source.getAttribute("ng-change") || "$ctrl.filters.arrayValues['" + bindTo + "'].onSelectionChange();$ctrl.filterApply()";
				ngModel = source.getAttribute("ng-model") || "$ctrl.filters.arrayValues['" + bindTo + "'].selectedModel";
				source.setAttribute("show-clear-button", "true");
				source.setAttribute("model-type", "object");
				source.setAttribute("ctrl", "$ctrl.filters.arrayValues['" + bindTo + "']");
				return this.createInputElement(sourceType, bindTo, source, type, element, ngDisabled, ngBlur, ngModel, ngFocus, ngChange, false, elementClass);
			case "boolean":
				this.attributes["filter-type"] = "dropdown-list";
				source.setAttribute("datasource", "$ctrl.booleanValues");
				source.setAttribute("selectable-rows", "multiple");
				source.setAttribute("item-id-field", "value");
				source.setAttribute("item-display-field", "text");
				source.setAttribute("order-by", "-value");
				source.setAttribute("list-height", "135px");
				source.setAttribute("show-check-all", "false");
				source.setAttribute("show-uncheck-all", "false");
				return this.createInput(source);
			case "string":
			case "text":
				if (this.source.hasAttribute("invariant-field")) {
					bindTo = this.source.getAttribute("invariant-field");
					this.source.setAttribute("bind-to", bindTo);
					this.source.setAttribute("ng-model", "$ctrl.filters.values['" + bindTo + "']");
				}

				this.source.setAttribute("ng-model-options", "{updateOn: 'default blur clear', debounce: {'default': 150, 'blur': 0, 'clear': 0 }}");
				// this.source.setAttribute("ng-change", "$ctrl.filters.values['" + bindTo + "'].length>2? " + ngChange + ":false");
				ngChange = undefined;
				input = this.createInputElement(sourceType, bindTo, source, "text", element, ngDisabled, ngBlur, ngModel, ngFocus, ngChange, false, elementClass);
				input.hasConfig = "string";
				input.bindTo = bindTo;
				return input;
			case "number":
				this.source.setAttribute("type", "text");
				this.source.setAttribute("ng-model-options", "{updateOn: 'default blur clear', debounce: {'default': 150, 'blur': 0, 'clear': 0 }}");
				input = this.createInputElement(sourceType, bindTo, source, "text-range", element, ngDisabled, ngBlur, ngModel, ngFocus, ngChange, false, elementClass);
				input.hasConfig = "number";
				input.bindTo = bindTo;
				return input;
			case "datetime":
			case "date":
				//ngBlur = ngChange;
				//ngChange = "";
				this.source.removeAttribute("ng-change");
				this.source.setAttribute("ng-model-options", "{updateOn: 'default blur clear', debounce: {'default': 300, 'blur': 0, 'clear': 0 }}");
				input = this.createInputElement(sourceType, bindTo, source, type + "-range", element, ngDisabled, ngBlur, ngModel, ngFocus, ngChange, true, elementClass);
				input.hasConfig = type;
				input.bindTo = bindTo;
				return input;
			default:
				return this.createInputElement(sourceType, bindTo, source, type, element, ngDisabled, ngBlur, ngModel, ngFocus, ngChange, true, elementClass);
		}
		//this.removeAllChildren();
		return element;
	}

}
