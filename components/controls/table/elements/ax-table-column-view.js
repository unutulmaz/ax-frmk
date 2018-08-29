class axTableColumnView extends axElement {
	constructor(element, scope, axColumn) {
		super();
		this.attributes = {
			"bind-to": "",
			"double-binding": "false",
			"type": ""
		};
		this.axColumn = axColumn;
		return this.create(element, scope);
	}


	create(element, scope) {
		if (element.hasAttribute('view-type')) element.setAttribute('type', element.getAttribute('view-type'));

		this.extractAttributesValues(element, scope);
		this.$controller = scope;
		var bindTo = this.attributes["bind-to"];
		var header = this.attributes.header;
		this.source.setAttribute("role", "column-view");
		var container = this.createDOMElement("div", this.source.attributes);
		container.setAttribute("view-for", bindTo);

		if (this.getSourceAttribute('editable')) container.setAttribute("editable-column", "true");
		container.style.cssText = this.source.style.cssText;
		container.style.cssText += ";position:relative;text-overflow:ellipsis;overflow-x:hidden;overflow-y:auto;";
		container.style.cssText += ";display:block !important "; //nu pune !important la display:block - va anula efectul ng-hide;
		if (container.style["text-align"] === "center") container.style.padding = 0;
		if (this.source.style['overflow-y']) container.style['overflow-y'] = this.source.style['overflow-y'];
		if (this.attributes.type !== "custom") {
			element = this.createType(container);
		}

		axElement.addChildren(container, this.source);
		if (this.source.hasAttribute('has-input') !== "" && container.children.length > 0) {
			bindTo = bindTo || this.getSourceAttribute('has-input');
			let children = angular.element(container).find("[has-input]:not([ng-focus]):not([ng-blur])");
			for (let i = 0; i < children.length; i++) {
				let child = children[i];
				child.setAttribute("ng-focus", "$ctrl.objectHasFocus($event, $parent.dataItem, '" + (bindTo || header) + "');");
				child.setAttribute("ng-blur", "$ctrl.validateField('" + (bindTo || header) + "', $parent.dataItem)");
			}
		}
		return container;
	}

	createType(container) {
		var element, dateFormat, text;
		var bindTo = this.attributes['bind-to'];
		//var doubleBinding = (this.scope.attrs.editRow !== "") || this.attributes['double-binding'] == "true";
		var doubleBinding = this.attributes['double-binding'] == "true";
		var binding = doubleBinding ? "" : "::";
		var ngModel = "dataItem[\"" + bindTo + "\"]";
		//console.log("bindto", bindTo, doubleBinding, binding, this.attributes.type.toLowerCase());
		switch (this.attributes.type.toLowerCase()) {
			case "boolean-checkbox":
				element = this.createDOMElement("i",
					{
						class: "fa",
						'ng-class': "{'fa-square-o':!" + ngModel + ", 'fa-check-square-o':" + ngModel + "}"
					});
				if (!this.source.style["text-align"]) {
					container.style["text-align"] = "center";
					container.style.padding = "0";
				}
				// container.style["padding-top"] = "1px";
				container.appendChild(element);
				container.innerHTML += "<span class='boolean-value' >{{::" + ngModel + "}}</span>";
				break;
			case "boolean-radio":
				element = this.createDOMElement("i",
					{
						class: "fa",
						'ng-class': "{'fa-circle-o':!" + ngModel + ", 'fa-check-circle-o':" + ngModel + "}"
					});
				if (!this.source.style["text-align"]) {
					container.style["text-align"] = "center";
					container.style.padding = "0";
				}
				container.appendChild(element);
				break;
			case "date-time":
			case "datetime":
				if (this.attributes["datetime-format"]) dateFormat = this.attributes["datetime-format"];
				else dateFormat = axDateTimeFormat;// jshint ignore:line
			// fara break!!!!!!
			case "date":
				dateFormat = dateFormat || (this.attributes["date-format"] ? this.attributes["date-format"] : axDateFormat);
				element = this.createDOMElement("span", {"ng-bind": binding + ngModel + " |date: '" + dateFormat + "'"});
				if (!this.source.style["text-align"]) {
					container.style["text-align"] = "left";
					//container.style.padding = "0";
				}
				container.appendChild(element);
				break;
			case "number":
				var decimals = parseInt(this.source.getAttribute("decimals") || axNumberFormat.decimals);
				var locale = this.source.getAttribute("locale") || axNumberFormat.locale;
				var useGrouping = this.source.hasAttribute("use-grouping") ? this.source.getAttribute("use-grouping") === "true" : axNumberFormat.grouping;
				var minimumFractionDigits = this.source.hasAttribute("minimum-fraction-digits") ? this.source.getAttribute("minimum-fraction-digits") : decimals;
				var maximumFractionDigits = this.source.hasAttribute("maximum-fraction-digits") ? this.source.getAttribute("maximum-fraction-digits") : decimals;
				var options = {
					style: this.source.getAttribute("format-style") || axNumberFormat.style,
					useGrouping: useGrouping,
					minimumFractionDigits: minimumFractionDigits,
					maximumFractionDigits: maximumFractionDigits
				};
				var format = ".toLocaleString('" + locale + "', " + JSON.stringify(options) + ")";
				element = this.createDOMElement("span", {"ng-bind": binding + ngModel + format});
				container.style["text-align"] = this.source.style["text-align"] || "right";
				container.appendChild(element);
				break;
			case "gutter-icons":
				container.style.padding = "0";
				let iError = this.createDOMElement("i",
					{
						class: "fa fa-exclamation",
						style:"width:100%",
						"ng-if": "$ctrl.dataItemGetAttr(dataItem, 'errors').global",
						"uib-popover-html": "$ctrl.getErrorFor(dataItem)",
						"popover-append-to-body": true,
						"popover-trigger": "'mouseenter click'",
						"popover-placement": "top-left"
					});
				// this.$controller.element.errorIconTemplate = iError;
				container.appendChild(iError);
				break;
			case "crud-buttons":
				container.style["text-align"] = "center";
				container.style.padding = "0";
				container.style.width= "100%";
				// container.style.display = "inline-flex";

				let ngFocus = "$ctrl.objectHasFocus($event, $parent.dataItem, 'Actions')";
				element = this.createDOMElement("div",
					{
						class: "inline",
						style: "border:none;padding:0;margin:auto"
					});
				if (this.scope.attrs.editRow === 'inline') {
					let iSave = this.createDOMElement("button",
						{
							"ng-click": "$ctrl.save(dataItem, $event)",
							"ng-show": "$ctrl.dataItemGetAttr(dataItem,'editing') === true",
							"uib-tooltip": "Save change for current item, Shortcut: Ctrl+S",
							"has-input": true,
							role: "save-item",
							class: "btn icon form-control fa fa-save"
						});
					if (this.scope.attrs.rowIsDisabled)
						iSave.setAttribute("ng-disabled", "$ctrl.rowIsDisabled({dataItem:dataItem})");
					element.appendChild(iSave);
					var iUndo = this.createDOMElement("button",
						{
							"ng-click": "$ctrl.undo(dataItem, $event)",
							"uib-tooltip": "Undo editing current Item, Shortcut: Escape",
							"ng-show": "$ctrl.dataItemGetAttr(dataItem,'editing') === true",
							"has-input": true,
							class: "btn icon form-control fa fa-undo"
						});
					element.appendChild(iUndo);
				}
				if (["popup"].indexOf(this.scope.attrs.editRow) > -1) {
					var iRead = this.createDOMElement("button",
						{
							"ng-click": "$ctrl.read(dataItem)",
							class: "icon border form-control fa fa-eye",
						});
					element.appendChild(iRead);
				}
				if (["inline"].includes(this.scope.attrs.editRow)) {
					var iEdit = this.createDOMElement("button",
						{
							"ng-click": "$ctrl.update(dataItem, $event)",
							"ng-if": "!$ctrl.inlineEditing && !$ctrl.readOnly;",
							"uib-tooltip": "Edit current item, Shortcut: F2",
							"ng-show": "$ctrl.dataItemGetAttr(dataItem,'editing') !== true",
							role: "edit-item",
							class: "btn icon grid-cell-btn form-control fa fa-edit",
							"has-input": true,
						});
					if (this.scope.attrs.rowIsDisabled)
						iEdit.setAttribute("ng-disabled", "$ctrl.rowIsDisabled({dataItem:dataItem})");
					element.appendChild(iEdit);
				}
				if (["inline", "inline-cell"].includes(this.scope.attrs.editRow)) {
					var iDelete = this.createDOMElement("ax-dropdown-popup",
						{
							ctrl: "$ctrl.$dropdowns.delete",
							role: "delete-item",
							"has-input": "true",
							"ng-if": "!$ctrl.readOnly",
							tabindex: 0,
							class: "form-control",
							"btn-class": "btn icon grid-cell-btn ",
							"btn-text": "",
							"caret-class": "fa fa-trash-o",
							"close-on-blur": "true",
							"close-on-escape": "true",
							"popup-width": "auto",
							"uib-tooltip": "Delete current item, Shortcut: Ctrl+D",
							"popup-relative-left": "-377.5px",
							"popup-max-height": "400px",
							"open-params": "$parent.dataItem;",
							"template-url": "'components/controls/dropdown/dropdown-confirm.html'"
						});
					let ngIf = "!$ctrl.readOnly";
					if (this.scope.attrs.rowIsDisabled)
						ngIf += "&& !$ctrl.readOnly && !$ctrl.rowIsDisabled({dataItem:dataItem})";
					if (["inline"].indexOf(this.scope.attrs.editRow) > -1) ngIf += "&& !$ctrl.inlineEditing";
					else if ("inline-cell" === this.scope.attrs.editRow) ngIf += " && $ctrl.canEdit";
					iDelete.setAttribute("ng-if", ngIf);
					element.appendChild(iDelete);
				}
				container.appendChild(element);

				break;
			default:
				element = this.createDOMElement("span", {"ng-bind": binding + ngModel});
				container.appendChild(element);

		}
		return element;

	}
}
