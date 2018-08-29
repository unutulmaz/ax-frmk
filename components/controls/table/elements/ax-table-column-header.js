class axTableColumnHeader extends axElement {
	constructor(element, dataTableTemplate) {
		super();
		return this.create(element, dataTableTemplate);
	}


	create(element, dataTableTemplate) {
		this.extractAttributesValues(element);
		let controller = dataTableTemplate.controller;
		var columnIndex = this.source.getAttribute("column-index");
		var columnRightIndex = controller.columns.no - columnIndex - 1;
		if (dataTableTemplate.attributes["no-empty-column"] === "true") columnRightIndex++;

		this.source.setAttribute("role", "column-header");

		var th = this.createDOMElement("th", this.source.attributes);
		th.setAttribute("column-for", th.getAttribute("header"));
		th.removeAttribute("header");
		var hasColspan = parseInt(th.getAttribute("colspan")) > 1;
		if (!hasColspan) {
			if (controller.columns.hideable[columnIndex].hidden) th.setAttribute('hidden-column', '');
			else if (th.hasAttribute('hidden-column')) th.removeAttribute('hidden-column');
		}
		if (controller.attrs.leftFreezedColumns > columnIndex) th.setAttribute('left-freezed-column', 'body');
		if (controller.attrs.rightFreezedColumns > 0 && controller.attrs.rightFreezedColumns + (dataTableTemplate.hasEmptyColumn ? 1 : 0) > columnRightIndex) th.setAttribute('right-freezed-column', 'body');
		if (th.hasClass("empty-column")) th.addClass("last-column");
		else if (controller.attrs.rightFreezedColumns === columnRightIndex) th.addClass('last-column');

		th.style.position = 'relative';
		if (!th.hasAttribute('hidden-column')) th.style.display = "table-cell";
		if (this.source.hasAttribute("sortable") && !hasColspan) {
			var fieldName = this.source.getAttribute("sortable");
			var itemClass = "glyphicon glyphicon-sort";
			if (fieldName === "") {
				fieldName = this.source.getAttribute("header-for");
				th.setAttribute('sortable', fieldName);
			}

			if (!this.source.hasAttribute("header") && this.source.hasAttribute("title")) {
				th.setAttribute("header", this.source.getAttribute("title"));
			}
			th.removeAttribute("title");
			var ordered = controller.columns.orderBy;
			var sortableClasses = dataTableTemplate.config.sortableClasses;
			if (ordered.includes(fieldName)) itemClass = sortableClasses.sortASC;
			else if (ordered.includes('-' + fieldName)) itemClass = sortableClasses.sortDESC;
			else itemClass = "";
			var span = this.createDOMElement('span',
				{
					class: "column-sort " + itemClass
				});
			var wrapper = createElement('div', {"style": "position:relative;", class: "inline"}, this.source.innerHTML + span.outerHTML);
			this.source.innerHTML = wrapper.outerHTML;
		}
		if (hasColspan || this.source.getAttribute("header-menu") === "false" || th.hasClass("empty-column")) {
			th.innerHTML = this.source.innerHTML.trim() || "<div style='color:transparent;overflow: hidden;height:0;'>Empty</div>";
			if (!th.hasClass("empty-column")) {
				let rows = parseInt(th.getAttribute("row-index")) + parseInt(th.getAttribute("rowspan") || 1) - 1;
				if (rows <= dataTableTemplate.controller.header.rows.headerRows) createElement("div", {class: "th-bottom-border"}, "", th);
			}
		}
		else {
			var axPopup = this.createDOMElement('ax-dropdown-popup',
				{
					style: "width:100%;height:100%;text-align:center",
					tabindex: -1,
					class: "column-menu1",
					"btn-class": "icon",
					"btn-html": this.source.innerHTML,
					"caret-class": "fa",
					"close-on-escape": "true",
					"close-on-mouseleave": (dataTableTemplate.$dataStore.isMobileDevice || dataTableTemplate.attributes.debug === "true") ? "false" : "true",
					"popup-width": "auto",
					"template-url": "'components/controls/table/templates/ax-table-column-menu.html'",
					ctrl: "$ctrl.$dropdowns.columnMenu"
				});
			if (dataTableTemplate.attributes["show-commands-tooltips"]) axPopup.setAttribute("uib-tooltip", dataTableTemplate.getMessage('columnHeader', 'openMenu'));
			th.appendChild(axPopup);

		}
		if (!th.classList.contains('empty-column')) {
			var resizer = createElement('div', {role: 'column-resizer', style: 'position:absolute;top:0;bottom:0;right:0;width:8px;cursor:col-resize;'});
			if (th.hasClass("W100") && !th.hasAttribute("rowspan")) resizer.style.cursor = "initial";
			resizer.setAttribute('ng-mousemove', '$ctrl.mouseMoveOverHeader($event)');
			th.appendChild(resizer);
		}

		return th;
	}
}
