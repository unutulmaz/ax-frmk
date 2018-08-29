class axFormSection extends axElement {
	constructor() {
		super();
	}

	create(element, scope) {
		this.extractAttributesValues(element, scope);
		this.uid = axUtils.Guid();
		this.attributes.uid = this.uid;
		this.isCollapsed = false;
		let section = createElement("ax-form-section", this.attributes);
		section.addAttributes(this.source.attributes);
		let source = $(this.source);
		let header = source.find(">ax-form-section-header");
		if (header.length > 0) section.appendChild(this.createSectionHeader(header), source);
		section.appendChild(this.createSectionBody(source));
		return section;
	}
	createSectionHeader(source, section) {
		let header = createElement("ax-form-section-header", source[0].attributes, source.html());
		header.addClass("form-section");
		header.addStyle("cursor", "pointer");
		this.isCollapsed = source.getAttribute("collapsed") === "true";
		if (source.hasNonFalseAttribute("collapsible")) {
			header.setAttribute("ng-click", "$ctrl.sectionToggle($event)");
			let iClass = this.isCollapsed ? "fa fa-caret-right" : "fa fa-caret-down";
			iClass += " btn icon";
			createElement("button", { class: iClass, style:"position:absolute;right:0;top:0;", tabindex:-1 }, "", header);
		}
		return header;
	}
	createSectionBody(source) {
		source.find(">ax-form-section-header").remove();
		let table = createElement("ax-form-table", { class: "form-section-body" }, source.html());
		if (source.hasAttribute("cols-width")) table.setAttribute("cols-width", source.getAttribute("cols-width"));
		if (this.isCollapsed) table.addStyle("display", "none");
		let body = axFormTable.createElement(table, this.scope);
		//console.log("body section", body.outerHTML)
		return body;
	}

}
axElements["form-section"] = axFormSection;
