class axTableScroller extends axElement {
	constructor() {
		super();
	}

	/**
	 * @param {axTableTemplate} dataTableTemplate
	 * @returns {HTMLElement}
	 */
	create(dataTableTemplate) {
		this.template = dataTableTemplate;
		/**
		 * @type {axTableController}
		 */
		this.controller = dataTableTemplate.controller;
		this.controller.$scroller = this;
		var tableScroller;
		if (dataTableTemplate.attributes["has-horizontal-virtual-scroll"] === "true")
			tableScroller = this.createDOMElement("ax-table-body",
				{
					role: "table-scroller",
					template: "$ctrl.element.bodyHtml",
					style: "display:block;overflow:hidden;padding-right:0px;position:absolute;top:0;right:0;bottom:0;left:0;"
				});
		else {
			tableScroller = this.createDOMElement("div",
				{
					role: "table-scroller",
					style: "overflow:hidden;padding-right:0px;position:absolute;top:0;right:0;bottom:0;left:0;"
				});
		}
		tableScroller.setAttribute("hm-panup", "$ctrl.hammer('panup', $event)");
		tableScroller.setAttribute("hm-pandown", "$ctrl.hammer('pandown', $event)");
		tableScroller.setAttribute("hm-recognizer-options", "[{preventDefault: true, stopPropagation:true, directions: 'DIRECTION_UP|DIRECTION_DOWN'}]");
		if (dataTableTemplate.element.type === "list") tableScroller.setAttribute("ng-click", "$event.stopPropagation()");
		this.tableAttributes = dataTableTemplate.transformListToObject(dataTableTemplate.attributes["table-attributes"]);
		//if (dataTableTemplate.attributes['table-overflow-x']) tableScroller.style['overflow-x'] = dataTableTemplate.attributes['table-overflow-x'];
		//if (dataTableTemplate.attributes['table-overflow-y']) tableScroller.style['overflow-y'] = dataTableTemplate.attributes['table-overflow-y'];
		this.tableAttributes.class = this.template.element.theme + " ax-table" + " element-" + this.template.element.type;
		var table = this.createDOMElement("table", this.tableAttributes);
		table.setAttribute("table-id", this.controller.tableId || axUtils.Guid());
		if (this.controller.attrs.editRow === 'inline-cell')
			table.setAttribute("ng-class", "{'lock-edit': !$ctrl.canEdit, 'unlock-edit': $ctrl.canEdit}");

		table.style.cssText = "table-layout:fixed !important;width:1px;display:table !important;top:initial;bottom:initial;left:initial;right:initial;min-width:100% !important;margin:0;width:1px;";

		var header = null;
		if (dataTableTemplate.attributes["no-header"] !== "true") {
			if (this.attributes["has-fixed-header"] !== 'true') {
				header = dataTableTemplate.createHeader();
				table.appendChild(header);
			}
		} else dataTableTemplate.createHeader = function () {
			return createElement('thead');
		};
		var columnsGroup = this.createColGroup();
		var axDtElement = dataTableTemplate.element.source[0];
		//dataTableTemplate.tableWidth = columnsGroup.tableWidth;
		//this.controller.element.tableWidth = dataTableTemplate.tableWidth;
		if (axDtElement.style.position === "absolute" && (axDtElement.style.right || axDtElement.style.left)) {
		} else if (axDtElement.style.width === "100%") {
			table.style.minWidth = "100%";
			//axDtElement.style.cssText += ";min-width:100% !important";
		} else if (!axUtils.elementHasStyle(axDtElement, "width") || axDtElement.style.width === "auto") {
			axDtElement.style.width = (dataTableTemplate.tableWidth + 18) + "px";
			//21px, for right-freezd column>0
		}
		table.appendChild(columnsGroup);
		if (header) dataTableTemplate.headerTable = table;
		this.createBody(table);
		dataTableTemplate.table = angular.copy(table);
		tableScroller.appendChild(table);
		if (dataTableTemplate.attributes.draggable !== "false") {
			tableScroller.setAttribute("data-as-sortable", dataTableTemplate.attributes.draggable);
			tableScroller.setAttribute("is-disabled", dataTableTemplate.attributes["draggable-is-disabled"]);
			tableScroller.setAttribute("data-ng-model", "$ctrl.datasource");
			tableScroller.setAttribute("ng-class", "{true:'draggable-disabled'}[" + dataTableTemplate.attributes["draggable-is-disabled"] + "]");
		}
		if (dataTableTemplate.attributes["has-horizontal-virtual-scroll"] === "true") {
			dataTableTemplate.controller.element.bodyHtml = tableScroller.innerHTML;
			$(tableScroller).find("table>tbody").remove();
			//$(tableScroller).find("table").remove();
		}
		return tableScroller;
	}

	changeBody(marginLeft) {
		var table = this.createDOMElement("table", this.tableAttributes);
		table.setAttribute("table-id", this.controller.tableId);
		if (this.controller.attrs.editRow === 'inline-cell')
			table.setAttribute("ng-class", "{'lock-edit': !$ctrl.canEdit, 'unlock-edit': $ctrl.canEdit}");

		table.style.cssText = "table-layout:fixed !important;width:1px;display:table !important;top:initial;bottom:initial;left:initial;right:initial;min-width:100% !important;margin:0;width:1px;";
		//table.style["margin-left"] = marginLeft + "px";
		table.style.transform = 'translate3d(' + marginLeft + 'px, 0, 0)';
		if (this.template.attributes["no-header"] !== "true") {
			let header = this.template.createHeader(true);
			table.appendChild(header);
		}
		var columnsGroup = this.createColGroup();
		table.appendChild(columnsGroup);
		this.createBody(table);
		return table.outerHTML;
	}

	createCol(self, colGroup, item) {
		var width = item.hasAttribute('width') ? item.getAttribute('width') : "auto";
		var columnIndex = item.getAttribute('column-index');
		var col = axElement.createDOMElement("col",
			{
				style: "width:" + width,
				"column-index": columnIndex
			});
		if (item.classList.contains('empty-column')) col.addClass('empty-column');
		if (item.getAttribute('hidden-column')) col.setAttribute("hidden-column", item.getAttribute('hidden-column'));
		var columnRightIndex = self.controller.columns.no - columnIndex - 1;
		if (self.controller.attrs.noEmptyColumn === "true") columnRightIndex++;
		if (self.controller.attrs.leftFreezedColumns > columnIndex) col.setAttribute('left-freezed-column', '');
		if (!item.classList.contains('empty-column') && self.controller.attrs.rightFreezedColumns > 0 && self.controller.attrs.rightFreezedColumns + (self.template.hasEmptyColumn ? 1 : 0) > columnRightIndex) col.setAttribute('right-freezed-column', '');

		colGroup.appendChild(col);
	}

	createColGroup() {
		var colGroup = createElement("colgroup");
		var self = this;
		if (this.template.attributes["has-horizontal-virtual-scroll"] === "true")
			this.controller.columns.visible.each(function (item) {
				self.createCol(self, colGroup, item.def);
				return true;
			});
		else
			this.controller.columns.hideable.each(function (column) {
				if (column.hidden) return;
				self.createCol(self, colGroup, column.def);
				return true;
			});
		return colGroup;
	}

	createColumn(self, trView, trEmpty, item) {
		if (self.template.attributes['add-empty-row'] === 'true') {
			trEmpty.appendChild(item.empty);
		}
		if (self.template.attributes.draggable !== "false") {
			angular.element(item.view).find("div[role=column-resizer]").remove();
			item.view.setAttribute("as-sortable-item-handle", "");
		}
		trView.appendChild(item.view);
		if (false) {
			let column = angular.copy(item);
			console.log("---- create column", column);
			let tdView = new axTableColumn(column, self.controller, false);
			if (self.template.attributes.draggable !== "false") {
				angular.element(tdView).find("div[role=column-resizer]").remove();
				tdView.setAttribute("as-sortable-item-handle", "");
			}
			if (self.template.attributes['add-empty-row'] === 'true') {
				let tdEmpty = new axTableColumn(column, self.controller, false);
				trEmpty.appendChild(tdEmpty);
			}
			if (self.template.attributes["edit-row"].startsWith("inline")) {
				let tdEdit = new axTableColumn(column, self.controller, true);
				let editTemplate = tdEdit.children[0];
				if (editTemplate) {
					editTemplate.setAttribute('ng-if', this.ngIf.edit);
					tdView.children[0].setAttribute('ng-if', this.ngIf.view);
					tdView.appendChild(editTemplate);
				}
				trView.appendChild(tdView);
			} else
				trView.appendChild(tdView);
		}
	}

	createBodyTr() {
		var trView, trEmpty;
		var trAttributes = this.transformListToObject(this.template.attributes['tbody-tr-attributes']) || {};
		if (this.template.attributes.draggable !== "false") {
			trAttributes["data-as-sortable-item"] = "";
			trAttributes["ng-model"] = "dataItem";
		}
		trAttributes = angular.extend(
			{
				"role": "data-row",
				// :: da rateuri, ng-attr-index la valoare null, nu pune deloc atributul index
				"ng-attr-index": "{{$ctrl.dataItemGetIndex(dataItem, 'visibleItems')}}",
				"ng-click": "$ctrl.clickRow(dataItem, $event)",
				"ng-keydown": "$ctrl.objectCellKeyDown(dataItem, $event)",
				"ng-attr-uid": "{{::dataItem.$$uid}}"
			}, trAttributes);
		if (this.controller.attrs.refreshItemOnSave === "true") trAttributes['ng-if'] = "$ctrl.refreshView(dataItem)";
		else trAttributes['ng-if'] = "!dataItem.isGroupItem";
		if (this.controller.attrs.rowIsDisabled) trAttributes['ng-disabled'] = '$ctrl.rowIsDisabled({dataItem:dataItem})';

		if (this.controller.attrs.leftFreezedColumns > 0 || this.controller.attrs.rightFreezedColumns > 0) {
			trAttributes['ng-mouseenter'] = '!$ctrl.detectMouseLeftButton($event) ? $ctrl.trHover($event):false';
			trAttributes['ng-mouseleave'] = '!$ctrl.detectMouseLeftButton($event) ? $ctrl.trBlur($event):false';
		}

		trView = this.createDOMElement("tr", trAttributes);

		if (this.template.attributes["edit-row"] === "inline") {
			trView.setAttribute("ng-dblclick", "$ctrl.update(dataItem);");
		} else if (this.template.attributes["edit-row"] === "inline-cell") {
			trView.setAttribute("ng-dblclick", "$ctrl.changeEdit();");
		}

		var ngClass = "{true:'hasFocus'}[dataItem.$$uid === $ctrl.currentItem.$$uid]";
		if (this.template.attributes["edit-row"] === "inline-cell" || this.template.attributes["edit-row"] === "inline") {
			ngClass += (ngClass ? "," : "") + "{true:'error'}[$ctrl.dataItemHasErrors(dataItem)]";
		}
		trView.setAttribute("ng-class", "[" + ngClass + "]");

		if (this.template.attributes["row-css-classes"])
			trView.setAttribute('ng-attr-row-class', "{{" + this.template.attributes["row-css-classes"] + "}}");

		trEmpty = angular.copy(trView);
		trEmpty.setAttribute("index", null);
		trEmpty.setAttribute("uid", null);
		trEmpty.setAttribute("class", "empty-row");
		trEmpty.setAttribute("ng-class", "{true:'hasFocus'}[$ctrl.currentItem.$$uid===null]");
		trEmpty.setAttribute("ng-if", "$ctrl.paginator?$ctrl.paginator.fromIndex ===1:$ctrl.scrollTop ===0");
		trEmpty.removeAttribute('ng-attr-uid');
		trEmpty.removeAttribute('row-class');

		var self = this;
		if (this.template.attributes["edit-row"] === "inline-cell")
			this.ngIf = {
				edit: "(($ctrl.canEdit===true?$ctrl.currentItem.$$uid===dataItem.$$uid:false) || $ctrl.dataItemGetAttr(dataItem,'status')==='dirty')" + (this.controller.attrs.rowIsDisabled ? " && !$ctrl.rowIsDisabled({ dataItem: dataItem })" : ""),
				view: "(($ctrl.canEdit===true?$ctrl.currentItem.$$uid!==dataItem.$$uid:true) && $ctrl.dataItemGetAttr(dataItem,'status')!=='dirty')" + (this.controller.attrs.rowIsDisabled ? " || $ctrl.rowIsDisabled({ dataItem: dataItem })" : "")
			};
		else if (this.template.attributes["edit-row"] === "inline")
			this.ngIf = {
				edit: "$ctrl.dataItemGetAttr(dataItem,'editing')",
				view: "!$ctrl.dataItemGetAttr(dataItem,'editing')"
			};
		this.controller.columns.visible.each(function (item, i) {
			self.createColumn(self, trView, trEmpty, item.templates.td);
			return true;
		}, this);
		var rowHeight = this.template.attributes['row-data-height'];
		var td = createElement('td', {style: "width:0px;height:" + rowHeight + "px"});
		var trVirtual = createElement("tr", {}, td);
		return {view: trView, empty: trEmpty, virtual: trVirtual};
	}

	createBody(table) {
		var tBodyAttributes = this.transformListToObject(this.template.attributes['tbody-attributes']);
		tBodyAttributes["ng-repeat"] = "dataItem in $ctrl.getCollection('viewed') track by dataItem.$$uid";
		var tBodyElement = this.createDOMElement("tbody", tBodyAttributes);

		var tr = this.createBodyTr();
		if (this.template.attributes['add-empty-row'] === 'true') {
			var emptyTBody = angular.copy(tBodyElement);
			emptyTBody.removeAttribute("ng-repeat");
			tr.empty.removeAttribute("ng-attr-index");
			tr.empty.setAttribute("index", "null");
			tr.empty.setAttribute("ng-click", "$ctrl.clickRow(-1, $event)");
			emptyTBody.setAttribute("empty-row", true);
			emptyTBody.setAttribute("ng-if", tr.empty.getAttribute("ng-if"));
			tr.empty.removeAttribute("ng-if");
			emptyTBody.appendChild(tr.empty);
			table.appendChild(emptyTBody);
		}
		this.controller.trTemplate = tr;
		this.template.grouping.createHeaders(tBodyElement);
		tBodyElement.appendChild(tr.view);
		this.template.grouping.createFooters(tBodyElement);
		if (this.template.controller.attrs.pageSize === 'ALL') {
			var rowHeight = this.template.attributes['row-data-height'];
			let rowStyle = ";max-height:" + rowHeight + "px !important; min-height:" + rowHeight + "px !important; line-height: " + (rowHeight - 0)  + "px !important";
			// console.log("----------", rowStyle);
			angular.element(tBodyElement).find('tr[role=data-row] > td > [role=column-input],tr[role=data-row] > td > [role=column-view]')
				.each(function () {
					this.style.cssText = this.style.cssText + rowStyle;
					// console.log(this, this.style.cssText);
				});
			rowStyle = ";max-height:" + rowHeight + "px !important; min-height:" + rowHeight + "px !important; line-height: " + (rowHeight - 0) + "px !important";
			// console.log("----------", rowStyle);
			angular.element(tBodyElement).find('tr[role=group-header] > td > *, tr[role=group-footer] > td > *')
				.each(function () {
					this.style.cssText = this.style.cssText + rowStyle;
					// console.log(this, this.style.cssText);
				});
		}
		return table.appendChild(tBodyElement);
	}

}