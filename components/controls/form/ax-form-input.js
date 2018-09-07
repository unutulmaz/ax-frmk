class axFormInput extends axInput {
	constructor() {
		super();
		this.attributes = {
			"bind-to": "",
			"form-scope-variable": "",
			"datasource-value-field": "",
			"datasource-text-field": "",
			"add-empty-option": "true",
			type: "",
			"ax-readonly": "",
			"ax-disabled": "",
			ctrl: "",
			"empty-option-text": "",
			datasource: "",
			"width": "",
			"datasource-filter": "",
			"item-id-field": "",
			"item-display-field": "",
			"item-invariant-field": "",
			"dropdown-model-type": "",
			"model-type": "",
			"selectable-rows": "",
			"selectable-rows-model-type": ""
		};
		this.dataHolder = "$ctrl.datasource";
	}

	extractAttributesValues(element, scope) {
		super.extractAttributesValues(element, scope);
		this.dataHolder = this.attributes["form-scope-variable"] !== "" ? this.attributes["form-scope-variable"] + ".data" : this.dataHolder;
		if (this.attributes["bind-to"]) {
			var bindTo = this.attributes["bind-to"];
			if (bindTo.indexOf(".") > -1) this.source.setAttribute("ng-model", this.dataHolder + "." + this.attributes["bind-to"]);
			else this.source.setAttribute("ng-model", this.dataHolder + "['" + this.attributes["bind-to"] + "']");
		}
		if (this.attributes["ax-readonly"]) {
			if (["checkbox", "select"].indexOf(this.attributes.type) > -1) {
				this.source.setAttribute("ng-disabled", this.attributes["ax-readonly"]);
				this.source.setAttribute("ng-readonly", this.attributes["ax-readonly"]);
			} else this.source.setAttribute("ng-readonly", this.attributes["ax-readonly"]);
		}
		if (this.attributes["ax-disabled"]) {
			this.source.setAttribute("ng-disabled", this.attributes["ax-disabled"]);
		}
	}

	validate() {
		this.validateAttribute("type");
	}

	create(element, scope) {
		var originalElement = angular.copy(element);
		if (element.hasAttribute('input-type')) element.setAttribute('type', element.getAttribute('input-type'));
		this.extractAttributesValues(element, scope);
		this.source.setAttribute("role", "form-input");
		var holderDiv = axElement.createDOMElement("div", this.source.attributes);
		holderDiv.removeAttribute('ng-model');
		holderDiv.removeAttribute('ng-change');
		holderDiv.removeAttribute('ng-show');
		holderDiv.removeAttribute('ng-click');
		holderDiv.removeAttribute('ng-readonly');
		holderDiv.removeAttribute('ng-disabled');
		holderDiv.removeAttribute('row-is-disabled');
		holderDiv.setAttribute("role", "input-holder");
		this.source.removeAttribute("class");
		holderDiv.style.cssText = this.source.style.cssText;
		if (element.style.height) holderDiv.style.height = element.style.height;
		holderDiv.style.position = "relative";
		var errorElement = this.source.hasAttribute("show-fields-errors-as-icons") ? null : this.createError(originalElement); // trebuie sa se execute inaintea creerii lui inputElement (pt. atribute)
		if (originalElement.hasAttribute("ng-class")) this.source.setAttribute("ng-class", originalElement.getAttribute("ng-class"));
		if (!this.source.classList.contains("form-control") && (this.source.getAttribute('type') !== "custom" || this.source.getAttribute('type') === null)) {
			angular.element(this.source).addClass("form-control");
		}
		this.getElement(originalElement, holderDiv);

		axElement.addChildren(holderDiv, this.source);
		if (originalElement.hasAttribute("form-uid")) holderDiv.setAttribute("form-uid", originalElement.getAttribute("form-uid"));
		if (errorElement) holderDiv.appendChild(errorElement);
		return holderDiv;
	}

	createError(inputDef) {
		// console.log("input:", inputDef.getAttribute("bind-to"));
		if (!inputDef.getAttribute("bind-to")) return null;
		var errorHolder = inputDef.hasAttribute("form-scope-variable") ? inputDef.getAttribute("form-scope-variable") : "$ctrl";
		var bindTo = inputDef.getAttribute("bind-to");
		var fieldRef = bindTo.indexOf('.') > -1 ? ("." + bindTo) : ("['" + bindTo + "']");
		var errorModel = inputDef.hasAttribute("error-model") ? inputDef.getAttribute("error-model") : (errorHolder + ".errors.fields" + fieldRef );
		if (inputDef.hasAttribute("form-scope-variable")) {
			if (!this.scope[errorHolder]) this.scope[errorHolder] = {};
			if (!this.scope[errorHolder].fieldsWithErrorMsg) this.scope[errorHolder].fieldsWithErrorMsg = {};
			this.scope[errorHolder].fieldsWithErrorMsg[bindTo] = errorModel;
		} else {
			var axFormTemplate = axElement.axForms[inputDef.getAttribute("form-uid")];
			axFormTemplate.fieldsWithErrorMsg[bindTo] = errorModel;
		}
		var holderDiv = axElement.createDOMElement("div", { role: "input-error", class: "errors", "ng-if": errorModel, errorFor: bindTo });
		inputDef.setAttribute("ng-class", '{hasErrors: ' + errorModel + '}');
		var span = axElement.createDOMElement("div", { 'ng-repeat': 'error in ' + errorModel + " track by $index" });
		span.innerHTML = "{{error}}";
		holderDiv.appendChild(span);
		return holderDiv;
	}

	getElement(source, container) {
		var element, ngChange, ngDisabled, ngBlur, ngFocus;
		var type = this.attributes.type || "";
		var ngModel = this.source.getAttribute("ng-model");
		if (!this.source.hasAttribute('tabindex')) this.source.setAttribute('tabindex', 0);
		let tabIndex = this.source.getAttribute('tabindex');
		//console.log("input", ngModel, tabIndex);
		var elementClass = "form-control";
		var sourceType = "form-input";

		switch (type) {
			case "":
				console.error("Type attribute is required for element: ", this.source);
				return this.source;
			case "custom":
				axElement.addChildren(container, this.source);
				this.removeAllChildren();
				return;
			case "checkbox":
				element = this.createInputElement(sourceType, null, source, type, element, ngDisabled, ngBlur, ngModel, ngFocus, ngChange, false, elementClass);
				this.removeAllChildren();
				break;
			case "list":
				{
					let attrs = {
						'selectable-rows-model-type': source.getAttribute("model-type") || this.attributes["selectable-rows-model-type"] || 'id-field',
						'selectable-rows-model': this.source.getAttribute("ng-model") || this.source.getAttribute("selectable-rows-model"),
						'item-id-field': this.attributes["item-id-field"],
						'item-invariant-field': this.attributes["item-invariant-field"],
						'item-display-field': this.attributes["item-display-field"],
						'auto-focus': false,
						"has-input": true,
						'height': source.style.height || '150px'
					};
					if (this.attributes.datasource) attrs.datasource = this.attributes.datasource;
					if (this.attributes.config) attrs.config = this.attributes.config;
					if (source.style.cssText) attrs.style = source.style.cssText;
					if (ngChange || source.getAttribute("ng-change")) attrs['on-selection-change'] = ngChange || source.getAttribute("ng-change");
					if (source.hasAttribute('row-is-disabled')) attrs['row-is-disabled'] = source.getAttribute('row-is-disabled');
					if (source.hasAttribute('show-search')) attrs['show-search'] = source.getAttribute('show-search');
					if (source.hasAttribute('show-clear-button')) attrs['show-clear-button'] = source.getAttribute('show-clear-button');
					if (source.hasAttribute('selectable-rows')) attrs['selectable-rows'] = source.getAttribute('selectable-rows');
					if (source.hasAttribute('order-by')) attrs['list-order-by'] = source.getAttribute('order-by');
					if (source.hasAttribute('add-empty-row')) attrs['add-empty-row'] = source.getAttribute('add-empty-row');
					if (source.hasAttribute('order-by')) attrs['order-by'] = source.getAttribute('order-by');
					attrs.width = source.getAttribute('width') || source.style.width;
					this.source.removeAttribute("ng-model");
					if (source.getAttribute('selectable-rows') === "false") {
						if (!attrs.datasource && attrs["selectable-rows-model"] ) { // este list de tip children items
							attrs.datasource = attrs["selectable-rows-model"];
						}
						delete attrs['selectable-rows'];
						delete attrs['selectable-rows-model'];
						delete attrs['selectable-rows-model-type'];
					}
					element = this.createDOMElement('ax-list', source.attributes, source.innerHTML);
					if (!element.style.position) element.style.position = "relative";
					this.source.innerHTML = "";
					element.addAttributes(attrs);
					if (this.attributes.width) element.style.width = this.attributes.width;
					element.setAttribute("tabIndex", 0);
				}
				break;
			case "dropdown-list":
			case "file":
			case "textarea":
			case "datetime":
			case "number":
			case "decimal":
			case "integer": //jshint ignore:line
			default:
				element = this.createInputElement(sourceType, null, source, type, element, ngDisabled, ngBlur, ngModel, ngFocus, ngChange, false, elementClass);
		}
		container.appendChild(element);
	}
}

axElements["form-input"] = axFormInput;
