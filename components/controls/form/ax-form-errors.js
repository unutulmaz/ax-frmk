class axFormErrors extends axElement {
	constructor() {
		super();
		this.attributes = {
			"form-scope-variable": ""
		};
	}

	create(element, scope) {
		this.extractAttributesValues(element, scope);
		var errorModel = (this.attributes["form-scope-variable"] !== "" ? this.attributes["form-scope-variable"] : "$ctrl") + ".errors.global";
		var holderDiv = axElement.createDOMElement("div", {
			role: "form-error",
			class: "errors",
			tabindex: 0,
			"ng-if": errorModel + ".length>0"
		});
		var div = axElement.createDOMElement("div", {"ng-repeat": "error in " + errorModel});
		var errorDiv = axElement.createDOMElement("label");
		errorDiv.innerHTML = "{{error.label? (error.label+':&nbsp;'):'' }}";
		div.appendChild(errorDiv);
		var errorMsg = axElement.createDOMElement("span", {"ng-repeat": "message in error.messages", bindHtmlCompile: "message"});
		div.appendChild(errorMsg);
		holderDiv.appendChild(div);
		this.removeAllChildren();
		return holderDiv;
	}

	validate() {
		//this.validateAttribute("form-scope-variable",
		//    "Control 'ax-form-errors' must be a direct child of a ax-form. The form must have 'scope-variable' set");
	}
}

axElements["form-errors"] = axFormErrors;
