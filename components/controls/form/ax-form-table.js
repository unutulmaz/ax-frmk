class axFormTable extends axElement {
	constructor() {
		super();
		this.columns = [];

	}

	create(element, scope) {
		this.extractAttributesValues(element, scope);
		this.source.setAttribute("role", "form-column");
		this.columns = this.getDirectChildrenOfType("AX-FORM-TABLE-COLUMN");
		this.setLabelLayoutForFields();
		var table = this.createTable();
		// console.log("Created table:", table);
		return table;
	}

	createTable() {
		var table = axElement.createDOMElement("table", this.source.attributes);
		if (this.source.hasAttribute("cols-width")) {
			let colsWidth = this.source.getAttribute("cols-width").split(/;|,/);
			let colGroup = createElement("colgroup");
			let first = table.hasClass("form-section-body");
			colsWidth.each(function (width) {
				width = width.includes("px") ? (parseInt(width) - (first ? 0 : 0)) + "px" : width;
				createElement("col", { style: "width:" + width }, "", colGroup);
				first = false;
			});
			table.appendChild(colGroup);
		}
		//console.log("def table", this.source);
		var rowIndex = 0;
		var rowHasField = true;
		var controls = {};
		this.columns.each(function (column, i) {
			controls[i] = {};
		}, this);

		do {
			rowHasField = false;
			var leftTd;
			var tr = axElement.createDOMElement("tr", { rowIndex: rowIndex });
			for (var i = 0; i < this.columns.length; i++) {
				var column = this.columns[i];
				var labelsLayout = column.getAttribute("labels-layout");
				if (labelsLayout === "left") leftTd = axElement.createDOMElement("td", { role: "label", columnIndex: i });
				var rightTd = axElement.createDOMElement("td", { role: "input", columnIndex: i });
				if (rowIndex + 1 > column.children.length) {
					if (labelsLayout === "left") tr.appendChild(leftTd);
					tr.appendChild(rightTd);
					continue;
				}
				var fields = this.getDirectChildrenOfType('AX-FORM-FIELD', column);
				var currentFieldDef = fields[rowIndex];
				var fieldConstructor = new axFormField();
				var field = fieldConstructor.createTds(currentFieldDef);
				var bindTo = field.input && field.input.hasAttribute("bind-to") ? field.input.getAttribute("bind-to") : "";
				if (bindTo && leftTd) leftTd.setAttribute("control-for", bindTo);
				if (bindTo && rightTd) rightTd.setAttribute("control-for", bindTo);
				if (i === 0) {
					axElement.addAttributesToElement(tr, currentFieldDef.attributes);
					tr.removeAttribute("column-index");
				}
				if (currentFieldDef.hasAttribute("colspan")) {
					var td = axElement.createDOMElement("td", { colspan: currentFieldDef.getAttribute("colspan"), columnIndex: i });
					let tdContent = "";
					if (field.label) tdContent += field.label.outerHTML;
					if (field.input) tdContent += field.input.outerHTML;
					if (!field.label && !field.input) tdContent += axElement.getChildrenHtml(currentFieldDef);
					controls[i][rowIndex] = { colspan: tdContent };
					tr.appendChild(td);
				} else if (labelsLayout === "left") {
					controls[i][rowIndex] = {};
					if (field.label) controls[i][rowIndex].label = field.label.outerHTML;
					if (field.input) controls[i][rowIndex].input = field.input.outerHTML;
					if (currentFieldDef.hasAttribute("rowspan")) {
						let rowspan = parseInt(currentFieldDef.getAttribute("rowspan"));
						leftTd.setAttribute("rowspan", rowspan);
						rightTd.setAttribute("rowspan", rowspan);
						i = i + rowspan - 1;
					}
					tr.appendChild(leftTd);
					tr.appendChild(rightTd);
				} else {
					if (currentFieldDef.hasAttribute("rowspan")) {
						rightTd.setAttribute("rowspan", currentFieldDef.getAttribute("rowspan"));
					}
					if (field.label) rightTd.appendChild(field.label);
					if (field.input) rightTd.appendChild(field.input);
					controls[i][rowIndex] = { input: (field.label ? field.label.outerHTML : "") + (field.input ? field.input.outerHTML : "") };
					tr.appendChild(rightTd);
					if (currentFieldDef.hasAttribute("rowspan")) {
						let rowspan = parseInt(currentFieldDef.getAttribute("rowspan"));
						i = i + rowspan - 1;
					}
				}

				rowHasField = true;
			}
			rowIndex++;
			if (rowHasField) table.appendChild(tr);
		} while (rowHasField);// jshint ignore:line
		let tabIndex = 0;
		let self = this;
		for (let columnIndex in controls) {
			let rows = controls[columnIndex];
			for (let rowIndex in rows) {
				let tdContent = rows[rowIndex];
				//console.log("control", rowIndex, columnIndex, tdContent);
				let row = $(table).find(">tr[row-index=" + rowIndex + "]");
				let td, content;
				if (tdContent.colspan) {
					let td = row.find(">td[column-index=" + columnIndex + "]");
					td.html(tdContent.colspan);
					if (self.columns.length > 1)
						td.find("[role=input-holder] [tabindex]").each(function (i, control) {//jshint ignore:line
							control.setAttribute("tabindex", tabIndex);
							tabIndex = tabIndex + 10;
						});
				}
				if (tdContent.label) {
					let td = row.find(">td[column-index=" + columnIndex + "][role=label]");
					td.html(tdContent.label);
					if (self.columns.length > 1)
						td.find("[role=input-holder] [tabindex]").each(function (i, control) {//jshint ignore:line
							control.setAttribute("tabindex", tabIndex);
							tabIndex = tabIndex + 10;
						});
				}
				if (tdContent.input) {
					let td = row.find(">td[column-index=" + columnIndex + "][role=input]");
					td.html(tdContent.input);
					if (self.columns.length > 1)
						td.find("[role=input-holder] [tabindex]").each(function (i, control) {//jshint ignore:line
							control.setAttribute("tabindex", tabIndex);
							tabIndex = tabIndex + 10;
						});
				}
			}
		}
		//console.log("table", table);

		return table;
	}

	setLabelLayoutForFields() {
		for (var i = 0; i < this.columns.length; i++) {
			var column = this.columns[i];
			var labelsLayout = column.getAttribute("labels-layout");
			var fields = column.getElementsByTagName("AX-FORM-FIELD");
			for (var j = 0; j < fields.length; j++) {
				var field = fields[j];
				var labelLayout = field.getAttribute("label-layout");
				if (!labelLayout) field.setAttribute("label-layout", labelsLayout);
			}
		}
	}
}
axElements["form-table"] = axFormTable;
