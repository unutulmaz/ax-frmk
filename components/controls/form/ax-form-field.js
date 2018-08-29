class axFormField extends axElement {
	constructor() {
		super();
		this.attributes = {
			"label-layout": "left"
		};
	}

	createTds(element, scope) {
		this.extractAttributesValues(element, scope);
		var field = {
			label: this.createLabel(),
			input: this.createInput()
		};
		// console.log("Created field:", field);
		return field;
	}

	create(element, scope) {
		this.extractAttributesValues(element, scope);
		var holderDiv = axElement.createDOMElement("div", this.source.attributes);
		if (this.attributes["label-layout"] === "left") holderDiv.addClass("inline");
		var label = this.createLabel();
		if (label) holderDiv.appendChild(label);
		var input = this.createInput();
		if (input) holderDiv.appendChild(input);
		this.addChildrenToNew(holderDiv);
		// console.log("Created field:", holderDiv);
		return holderDiv;
	}

	validate() {
		var axInputs = this.getDirectChildrenOfType("ax-form-input", null);
		if (axInputs.length > 100) {
			throw "Cannot have more then one AX-FORM-INPUT child in AX-FORM-FIELD";
		}
		var axLabels = this.getDirectChildrenOfType("label", null);
		if (axLabels.length > 100) {
			throw "Cannot have more then one LABEL child in AX-FORM-FIELD";
		}
	}

	createLabel() {
		var axLabels = this.getDirectChildrenOfType("label", null);
		if (axLabels.length === 0) {
			return null;
		} else {
			var axLabel = axLabels[0];
			this.source.removeChild(axLabel);
			axLabel.setAttribute("role", "form-label");
			var labelElement = axElement.createDOMElement("label", axLabel.attributes);
			labelElement.innerHTML = axLabel.innerHTML;
			return labelElement;
		}
	}

	createInput() {
		var axInputs = this.getDirectChildrenOfType("ax-form-input", null);
		if (axInputs.length === 0) {
			return null;
		} else {
			var axInput = axInputs[0];
			var inputElement = axElement.createViewElement(axInput);
			return inputElement;
		}
	}
}

axElements["form-field"] = axFormField;
