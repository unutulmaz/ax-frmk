class axTableColumnEdit extends axInput {
	constructor(element, scope, axColumn) {
		super();
		this.attributes = {
			"bind-to": "",
			"type": "",
		};
		this.axColumn = axColumn;
		if (element) return this.create(element, scope);
		else return false;
	}

	create(element, scope) {
		this.controller = scope;
		if (element.hasAttribute('edit-type')) element.setAttribute('type', element.getAttribute('edit-type'));
		if (element.hasAttribute('input-type')) element.setAttribute('type', element.getAttribute('input-type'));
		this.$controller = scope;
		var originalElement = angular.copy(element);
		this.extractAttributesValues(element, scope);
		var container = this.createDOMElement("div");
		if (this.source.hasAttribute("class")) container.setAttribute("class", this.source.getAttribute("class"));
		container.setAttribute("role", "column-input");
		container.style.cssText = "position:relative !important;width:100%;height:100%";
		container.style.cssText += this.source.style.cssText;
		container.classList.add("inline");
		this.source.setAttribute("class", "form-control grid-control");
		if (element.getAttribute("type") === "checkbox") this.source.style.cssText = "position:relative;margin-left:auto;margin-right:auto";
		else this.source.style.cssText = "margin-right:0; position:relative;width:100%;";

		var bindTo = this.attributes["bind-to"];
		if (this.attributes.type === "custom") {
			axElement.addChildren(container, this.source);
		} else {
			var input = this.createInput(bindTo, originalElement);
			container.appendChild(input);
		}
		let tooltip = this.getSourceAttribute("tooltip");
		if (this.hasSourceAttribute("tooltip")) {
			let icon = this.createDOMElement("i",
				{
					class: "fa fa-question-circle",
					"uib-popover-html": tooltip ? tooltip : "$ctrl.getTooltipFor('" + bindTo + "')",
					"popover-append-to-body": true,
					"popover-placement": "top-right",
					"popover-trigger": "'mouseenter'"
				});
			container.appendChild(icon);
		}
		container.removeAttribute('ng-model');
		container.removeAttribute('ax-on-change');
		container.removeAttribute('ng-change');
		var icon = this.errorIcon(bindTo);
		container.appendChild(icon);
		//var overlay = axElement.createDOMElement("div",
		//    {
		//        style: "position: absolute;top:0;left: 0;width: 100%;height: 100%;margin: 0",
		//        role: "loader-overlay",
		//        "ng-show": "!$ctrl.canEdit"
		//    });
		//container.appendChild(overlay);
		return container;
	}

	errorIcon(bindTo) {
		var icon = this.createDOMElement("i",
			{
				class: "fa fa-exclamation",
				"error-for": bindTo,
				"uib-popover-html": "$ctrl.getErrorFor(dataItem, '" + bindTo + "')",
				"popover-append-to-body": true,
				"popover-placement": "top-right",
				"popover-trigger": "'mouseenter click'",
				"ng-if": "$ctrl.dataItemHasFieldErrors(dataItem,'" + bindTo + "')"
			});
		return icon;
	}

	createInput(bindTo, source) {
		let dataItem = this.controller.attrs.editRow === "inline-cell" ? "$parent.$parent.dataItem" : "$parent.$parent.dataItem";
		var element, ngDisabled, ngBlur = this.controller.attrs.editRow === "inline-cell" && this.controller.$api ? "": "$ctrl.validateField( '" + bindTo + "', " + dataItem + ", false, $event ) " , ngChange = "";
		var type = this.attributes.type || "";
		var ngModel = this.source.getAttribute("ng-model");
		if (this.controller.attrs.editRow === "inline-cell" && !this.controller.attrs.parentConfig) ngChange = "$ctrl.save(" + dataItem + ")";
		var ngFocus = "$ctrl.objectHasFocus($event, " + dataItem + ", '" + bindTo + "');";
		if (this.scope.attrs.editRow === "inline-cell")
			ngDisabled = "($ctrl.dataItemGetAttr(" + dataItem + ",'status')==='dirty' " + " || $ctrl.rowIsDisabled({dataItem:" + dataItem + ", test:true}))";
		this.source.setAttribute('tabindex', 0);
		var elementClass = "form-control grid-control";
		var sourceType = "column-input";

		return this.createInputElement(sourceType, bindTo, source, type, element, ngDisabled, ngBlur, ngModel, ngFocus, ngChange, false, elementClass);
	}
}
