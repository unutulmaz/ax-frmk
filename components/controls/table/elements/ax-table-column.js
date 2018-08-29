class axTableColumn extends axElement {
	constructor(element, scope, editTemplate) {
		super(scope, element);
		this.attributes = {
			'bind-to': ""
		};
		if (element) return this.create(element, scope, editTemplate);
		else return true;
	}

	create(element, scope, editTemplate) {

		this.extractAttributesValues(element, scope);
		var td = axElement.createDOMElement("td", this.source.attributes);
		var columnIndex = this.getSourceAttribute("column-index");
		var columnRightIndex = scope.columns.no - columnIndex - 1;
		if (scope.attrs.noEmptyColumn === "true") columnRightIndex++;
		td.setAttribute("role", "grid-cell");
		td.setAttribute("right-index", columnRightIndex);
		td.setAttribute("tabindex", columnIndex);
		td.setAttribute("column-for", td.getAttribute("header"));
		td.removeAttribute("header");
		//if (scope.attrs.leftFreezedColumns > columnIndex) td.setAttribute('left-freezed-column', 'body');
		//if (scope.attrs.rightFreezedColumns > 0 && scope.attrs.rightFreezedColumns + (this.scope.hasEmptyColumn ? 1 : 0) > columnRightIndex && !td.hasClass("empty-column")) td.setAttribute('right-freezed-column', 'body');
		if (td.hasClass("empty-column")) td.addClass("last-column");
        else if ( scope.attrs.rightFreezedColumns === columnRightIndex ) td.addClass('last-column');

        // console.log(columnIndex, td.hasAttribute('right-freezed-column'));
		if (scope.columns.hideable[columnIndex].hidden) td.setAttribute('hidden-column', '');
		else if (td.hasAttribute('hidden-column')) td.removeAttribute('hidden-column');
		td.addClass("body");
		// td.setAttribute("ng-keydown", "$ctrl.objectCellKeyDown(dataItem, $event)");
		var bindTo = this.attributes["bind-to"];
		var axTemplateDefs = this.getDirectChildrenOfType(editTemplate ? "ax-column-edit" : "ax-column-view");
		var hasTemplate = axTemplateDefs.length > 0;
		td.removeAttribute('width');
		td.addStyle("padding-right", "0 !important");
		td.style.width = '';
		if (!td.hasAttribute('hidden-column')) td.style.display = "table-cell";
		if (editTemplate && !hasTemplate) return td;

		element = null;
		if (hasTemplate) {
			if (this.source.style["text-align"] && !axTemplateDefs[0].style["text-align"])
				axTemplateDefs[0].style["text-align"] = this.source.style["text-align"];
			if (editTemplate ) element = new axTableColumnEdit(axTemplateDefs[0], this.scope, this.source);
			else element = new axTableColumnView(axTemplateDefs[0], this.scope, this.source);
			td.appendChild(element);
		} else if (bindTo) {
			// element = this.createType();
			// var width = this.source.style.width;
			// if (width.indexOf("px") > -1) {
			// 	var iconsWidth = this.getSourceAttribute('has-info') ? 35 : 18;
			// 	element.style.width = (parseFloat(width) - iconsWidth) + "px";
			// }
			// td.appendChild(element);
            throw "Nu trebuie sa se ajunga aici ax-table-column: no template found!";
		}
		var errorIcons = angular.element(td).find("[error-for]");
		if (!scope.columnsWithErrorMsg) scope.columnsWithErrorMsg = {};
		if (errorIcons.length > 0) {
			var errorColumn = errorIcons[0].getAttribute("error-for");
			scope.columnsWithErrorMsg[errorColumn] = "";
		}
		if (scope.attrs.tdsResizable === "true") {
			td.style.position = "relative";
			var resizer = createElement('div', { role: 'column-resizer', style: 'position:absolute;top:0;bottom:0;right:0;width:8px;cursor:col-resize' });
			resizer.setAttribute('ng-mousemove', '$ctrl.mouseMoveOverHeader($event)');
			td.appendChild(resizer);
		}
		return td;
	}

}