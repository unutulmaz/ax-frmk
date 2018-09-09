class axFormTemplate extends axElement {
	constructor(element) {
		super();
		this.attributes = {
			"config": "",
			"datasource": "",
			"api": "",
			"api-controller": "",
			"item-id-field":"",
			"labels-layout": "left"
		};
		this.fields = [];
		this.uid = axUtils.Guid();
		this.attributes.uid = this.uid;
		this.controller = new axFormController();
		this.extractAttributesValues(element,this.controller,true);
		this.setLabelsLayoutForColumnFieldSets();
		var div = axElement.createDOMElement("div", this.source.attributes);
		this.fieldsWithErrorMsg = {};
		if (!axElement.axForms) axElement.axForms = {};
		//console.log("template", element);
		//axElement.scope = this.controller;
		axElement.axForms[this.uid] = this;
		this.addChildrenToNew(div);
		delete axElement.axForms[this.uid];
		this.html = div.innerHTML;
	}

	validate() {
		if (!this.source.hasAttribute("controller")) {
			this.validateAttribute("config");
			this.validateAttribute("datasource");
		}
	}
	belongToThisForm(element) {
		return angular.element(element).closest("ax-form")[0] === this.source;
	}
	setLabelsLayoutForColumnFieldSets() {
		var formLabelsLayout = this.attributes["labels-layout"];
		var inputs = this.source.getElementsByTagName("AX-FORM-INPUT");
		for (let i = 0; i < inputs.length; i++) {
			let input = inputs[i];
			if (!this.belongToThisForm(input)) continue;
			input.setAttribute("form-uid", this.uid);
			//input.setAttribute("tabindex", i * 10);
			//console.log("input", i * 10, input);
			if (this.source.hasAttribute("read-only")) input.setAttribute("ng-readonly", "$ctrl.readOnly");
		}
		var fields = this.source.getElementsByTagName("AX-FORM-FIELD");
		for (let i = 0; i < fields.length; i++) {
			let field = fields[i];
			if (!this.belongToThisForm(field)) continue;
			var labelLayout = field.getAttribute("label-layout");
			if (!labelLayout) field.setAttribute("label-layout", formLabelsLayout);
			if (field.hasAttribute("section-header")) {
				field.setAttribute("colspan", 2);
				field.setAttribute("class", "form-section");
				field.setAttribute("ng-click", "$ctrl.sectionToggle($event)");
				createElement("i", {class:"fa fa-caret-down" }, "", field);
			}

		}
		this.fieldsets = this.source.getElementsByTagName("AX-FORM-TABLE-COLUMN");
		for (let i = 0; i < this.fieldsets.length; i++) {
			let fieldset = this.fieldsets[i];
			if (!this.belongToThisForm(fieldset )) continue;
			let labelsLayout = fieldset.getAttribute("labels-layout");
			if (!labelsLayout) fieldset.setAttribute("labels-layout", formLabelsLayout);
		}
	}
}
