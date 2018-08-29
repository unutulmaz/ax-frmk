class axTableHeader {
	/**
	 * @param {axTableTemplate} dataTableTemplate
	 */
	constructor(dataTableTemplate) {
		this.template = dataTableTemplate;
		this.controller = dataTableTemplate.controller;
		var template = dataTableTemplate;
		template.buildColumnsHeaderStructure = function () {
			var headersStructure = [];
			let rowIndex = 1;
			//let leftFreezedColumn = this.controller.attrs.leftFreezedColumns - 1;
			//let rightFreezedColumn = this.columnsNo - this.controller.attrs.leftFreezedColumns;
			var headerRow = this.controller.header.rows[rowIndex];
			for (let i = 0; headerRow && i < headerRow.length; i++) {
				let header = headerRow[i];
				var column = this.getHeaderColumn(header, true, rowIndex);
				// console.log("header", column.title, "rowSpan:", column.rowSpan, "attr:", header.getAttribute("rowspan"));
				if (column.rowSpan > 1) header.setAttribute("rowspan", column.rowSpan);
				if (this.controller.attrs.editRow === "editor" && column.children.length === 0) this.getEditorControlForColumn(column);
				headersStructure.push(column);
			}
			this.controller.header.structure = headersStructure;
			// console.log("headersStructure", headersStructure);
		};
		template.getEditorControlForColumn = function (column, section) {
			let source = this.controller.columns.hideable[column.index];
			// console.log("getEditorControlForColumn ", column, section);
			if (this.editorForm && this.editorForm.length > 0) {
				let control = axTableEditor.createControl(this, source);
				if (!control) return;
				if (section) section.appendChild(control);
				else {
					let columnIndex = control.getAttribute("editor-column-index");
					this.editorForm.find(">ax-form-table>ax-form-table-column[column-index=" + columnIndex + "]").appendChild(control);
				}
			}

		};
		template.getChildColumns = function (parentColumn, rowIndex, parentHeader) {
			let headerRow = this.controller.header.rows[rowIndex];
			//if (!headerRow) return;
			let section = (this.attributes["edit-row"] !== "editor" || this.element.editorDef.getAttribute("group-controls-in-sections") === "false" || parentColumn.colSpan === 1) ? undefined : axTableEditor.createSection(template, parentColumn, parentHeader);
			// console.log("section", section, rowIndex, parentColumn.colSpan);
			let isLastParent = true;
			for (let i = 0; i < headerRow.length; i++) {
				let header = headerRow[i];
				let column = this.getHeaderColumn(header, false, rowIndex);
				if (column.index < parentColumn.index) continue;
				if (column.index >= parentColumn.index + parentColumn.colSpan) break;
				// if (this.controller.header.rows[rowIndex + column.rowSpan]) this.getChildColumns(column, rowIndex + column.rowSpan, header);
				if (column.children.length > 0) isLastParent = false;
				else {
					column.rowSpan = this.controller.header.rows.headerRows - rowIndex + 1;
					if (column.rowSpan > 1) header.setAttribute("rowspan", column.rowSpan);
					// console.log("header", column.title, "rowSpan:", column.rowSpan);
				}
				if (isLastParent) this.getEditorControlForColumn(column, section);

				parentColumn.children.push(column);
			}
			parentColumn.lastParent = isLastParent;
		};
		template.getHeaderColumn = function (header, freezable, rowIndex) {
			let columnIndex = parseInt(header.getAttribute('column-index'));
			let source = this.controller.columns.hideable[columnIndex];
			let column = {
				title: source.title,
				def: header,
				hideable: source.hideable,
				canView: source.canView,
				index: source.index,
				hidden: source.hidden,
				isScrollVisible: source.isScrollVisible,
				width: source.width,
				rowIndex: rowIndex,
				editorColumnIndex: parseInt(source.def.getAttribute('editor-column-index') || 1),
				colSpan: parseInt(header.getAttribute('colspan') || 1),
				rowSpan: parseInt(header.getAttribute('rowspan') || 1),
				freezeable: freezable,
				lastParent: false,
				children: [],
				headerTitle: header.getAttribute("header-title")
			};
			if (source.def.hasAttribute('show-in-editor')) column.showInEditor = source.def.getAttribute('show-in-editor') === "true";
			column.bindTo = column.colSpan > 1 ? undefined : source.bindTo;
			// if (column.colSpan === 1) column.rowSpan = this.controller.header.rows.headerRows - rowIndex + 1;
			if (column.rowSpan + rowIndex - 1 < this.controller.header.rows.headerRows) {
				this.getChildColumns(column, rowIndex + column.rowSpan, header);
				if (column.children.length === 0) column.rowSpan = this.controller.header.rows.headerRows - rowIndex + 1;
			}
			if (column.rowSpan + rowIndex - 1 === this.controller.header.rows.headerRows && !header.classList.contains("last-row")) header.setAttribute("class", (header.getAttribute("class") || "") + " last-row");
			return column;
		};
		template.createFixedHeader = function (table, tableWrapper) {
			var headerTable = angular.element(angular.copy(table));
			angular.element(table).find('thead').remove();
			template.controller.element.hasFixedHeader = true;
			headerTable.find('tbody').remove();
			headerTable.addClass('header-clone');
			headerTable[0].style.cssText = "table-layout:fixed;width:0!important;border:none;min-width:100% !important;";
			headerTable.attr('id', this.attributes.config + '-header-clone');
			var headerWrapper = createElement('div', {role: "table-header"});
			headerWrapper.style.cssText = "overflow:auto;position:absolute;top:0;left:0;right:0";
			headerTable.find('[left-freezed-column], [right-freezed-column]:not(.empty-column)').remove();
			headerWrapper.appendChild(headerTable[0]);
			if (this.controller.attrs.rightFreezedColumns === 0) {
				var fakeScrollbar = createElement("div",
					{
						role: "fake-scrollbar",
						header: '',
						style: "position:absolute;top:0;height:0;right:0;width:17px;"
					});
				tableWrapper.appendChild(fakeScrollbar);
			}
			tableWrapper.appendChild(headerWrapper);
		};
		template.createHeader = function (changed) {
			var thead = this.createHeaderTitleRows(false, changed);
			if (this.hasFilters) this.createHeaderFilterRow(thead, changed);
			return thead;
		};
		template.createHeaderTitleRows = function (exporting, changed) {
			var thead = this.createDOMElement("thead");
			changed = exporting ? false : changed;
			let leftFreezedColumn = exporting ? -1 : this.controller.attrs.leftFreezedColumns - 1;
			let rightFreezedColumn = this.columnsNo - ((exporting ? 0 : this.controller.attrs.rightFreezedColumns) + (this.hasEmptyColumn ? 1 : 0));
			var headerRows = this.controller.header.rows;
			let hiddenColumns = 0;
			let debug = false;
			debug && console.log("headers defs", headerRows, exporting, changed); //jshint ignore:line
			for (let rowIndex = 1; rowIndex <= headerRows.headerRows; rowIndex++) {
				let headerRow = angular.copy(headerRows[rowIndex]);
				let tr = this.createDOMElement("tr", {role: "titles", rowIndex: rowIndex});
				let headersHtml = "";
				let countHidden = rowIndex === 1;
				//if (rowIndex === 1 && changed) debug = true;
				debug && console.log("header row ----", rowIndex); //jshint ignore:line
				for (let i = 0; headerRow && i < headerRow.length; i++) {
					let thDef = headerRow[i];
					headersHtml += thDef.innerHTML.replace(/ /g, '');
					let colSpan = thDef.hasAttribute("colspan") ? parseInt(thDef.getAttribute("colspan")) : 1;
					let th = new axTableColumnHeader(thDef, this);
					let columnIndex = parseInt(thDef.getAttribute("column-index"));
					let column = this.controller.columns.hideable[columnIndex];
					//debug && countHidden && console.log("---column", column.title);
					th.style.width = this.getColumnWidth(columnIndex, colSpan);
					let leftColSpan = 0, leftColSpan1 = 0, colspan = 0;
					if (colSpan > 1) {
						this.setColumnColumnsRange(th, colSpan, columnIndex);
						if (columnIndex <= leftFreezedColumn && columnIndex + colSpan > leftFreezedColumn + 1) {
							let left = angular.copy(th);
							left.setAttribute("splitter-start", colSpan);
							leftColSpan = Math.min(leftFreezedColumn + 1, leftFreezedColumn - columnIndex + 1);
							let leftColSpan1 = this.setColumnColumnsRange(left, leftColSpan, columnIndex, true);
							left.setAttribute("class", ((left.getAttribute("class") || "") + " last-column").trim());
							hiddenColumns += countHidden ? (changed ? leftColSpan : (leftColSpan - leftColSpan1)) : 0;
							debug && countHidden && console.log("let-freezed", column.title, colSpan, (changed ? leftColSpan : (leftColSpan - leftColSpan1)));//jshint ignore:line

							if (leftColSpan1 > 0 && !changed) {
								if (left.hasAttribute("hidden-column") && left.getAttribute("hidden-column") !== "false") left.removeAttribute("hidden-column");
								tr.appendChild(left);
							}
							columnIndex = columnIndex + leftColSpan;
							column = this.controller.columns.hideable[columnIndex];
							th.setAttribute("splitter-end", "");
							th.setAttribute("column-index", columnIndex);
							th.removeAttribute("left-freezed-column");
							colSpan = colSpan - leftColSpan;
							this.setColumnColumnsRange(th, colSpan, columnIndex, true);
						}
						if (columnIndex > leftFreezedColumn && columnIndex < rightFreezedColumn && columnIndex + colSpan > rightFreezedColumn) {
							let left = angular.copy(th);
							left.setAttribute("splitter-start", colSpan);
							leftColSpan = rightFreezedColumn - columnIndex;
							let leftColSpan1 = this.setColumnColumnsRange(left, leftColSpan, columnIndex, true);
							//left.setAttribute("class", ((left.getAttribute("class") || "") + " last-column").trim());
							hiddenColumns += countHidden ? ((changed ? colSpan : leftColSpan) - leftColSpan1) : 0;
							debug && countHidden && console.log("body-freezed", column.title, colSpan, ((changed ? colSpan : leftColSpan) - leftColSpan1));//jshint ignore:line

							if (leftColSpan1 > 0) {
								if (left.hasAttribute("hidden-column") && left.getAttribute("hidden-column") !== "false") left.removeAttribute("hidden-column");
								tr.appendChild(left);
								//console.log("added to right", column.title, leftColSpan - leftColSpan1, leftColSpan1);
							}
							if (changed) continue;
							columnIndex = columnIndex + leftColSpan;
							column = this.controller.columns.hideable[columnIndex];
							th.setAttribute("splitter-end", "");
							th.setAttribute("column-index", columnIndex);
							th.setAttribute("right-freezed-column", "body");
							colSpan = colSpan - leftColSpan;
							this.setColumnColumnsRange(th, colSpan, columnIndex, true);
						} else {
							//this.setColumnColumnsRange(th, colSpan, columnIndex, true);
							this.setColumnColspan(th);
						}
					} else {
						this.setColumnColspan(th);
					}
					if (colSpan === 0) {
						colSpan = 2;
						debug && countHidden && console.log("add colSpan=2", column.title);//jshint ignore:line
					}
					colspan = exporting ? (th.hasAttribute("export-colspan") ? parseInt(th.getAttribute("export-colspan")) : 1) : (th.hasAttribute("colspan") ? parseInt(th.getAttribute("colspan")) : (column.isScrollVisible ? 1 : 0));
					let hidden = colSpan - colspan;

					if (changed && leftColSpan1 === 0 && (column.leftFreezedColumn || column.rightFreezedColumn)) {
						hiddenColumns += countHidden ? colSpan : 0;
						debug && countHidden && console.log("left/right freezed", column.title, colSpan, colSpan);//jshint ignore:line
						continue;
					}
					if (hidden === colSpan) {
						hiddenColumns += countHidden ? hidden : 0;
						debug && countHidden && console.log("hidden===colSpan", column.title, hidden);//jshint ignore:line
						continue;
					}
					let isHidden = thDef.hasAttribute("hidden-column") && thDef.getAttribute("hidden-column") !== "false";
					let removeFromHtml = column.hidden && colSpan === 1;

					if (removeFromHtml) {
						hiddenColumns += countHidden ? colSpan : 0;
						debug && countHidden && console.log("removeFromHtml", column.title, colSpan);//jshint ignore:line
						continue;
					}
					hiddenColumns += countHidden ? hidden : 0;
					debug && countHidden && console.log("added header", column.title, hidden);//jshint ignore:line
					th.removeAttribute("hidden-column");
					tr.appendChild(th);
				}
				if (headersHtml !== "") thead.appendChild(tr);
			}
			let rowsColspan = {0: this.columnsNo - hiddenColumns};
			for (let i = 1; i <= headerRows.headerRows; i++) {
				rowsColspan[i] = {colspan: 0, columns: []};
			}
			let addColSpan = function (rowIndex, colspan, th) {
				rowsColspan[rowIndex].colspan += colspan;
				if (rowsColspan[rowIndex].columns[th.getAttribute("column-index")])
					console.error("Header rows error: remove ax-column-header for rowIndex:", rowIndex, "column-index:", th.getAttribute("column-index"), "column-for: colspan", rowsColspan[rowIndex].columns[th.getAttribute("column-index")]);

				rowsColspan[rowIndex].columns[th.getAttribute("column-index")] = th.getAttribute("column-for") + ": " + colspan;
				// debug && console.log(rowsColspan[rowIndex].columns[th.getAttribute("column-index")], rowIndex, colspan, th.outerHTML);
			};
			// console.log(thead.outerHTML);
			for (let rowIndex = 1; rowIndex <= thead.children.length; rowIndex++) {
				let tr = thead.children[rowIndex - 1];
				for (let i = 0; i < tr.children.length; i++) {
					let th = tr.children[i];
					if (th.hasAttribute("hidden-column")) continue;
					let colspan = th.hasAttribute("colspan") ? parseInt(th.getAttribute("colspan")) : 1;
					// debug && rowIndex === 1 && console.log("th", th);//jshint ignore:line
					addColSpan(rowIndex, colspan, th);
					if (parseInt(th.getAttribute("rowspan")) > 1) {
						let rowSpan = parseInt(th.getAttribute("rowspan"));
						for (let i = parseInt(rowIndex) + 1; i < parseInt(rowIndex) + rowSpan; i++) {
							addColSpan(i, colspan, th);
						}
					}
				}
			}
			debug && console.info("Colspan status", "columnsNo:", this.columnsNo, "rowColspan[0]:", rowsColspan[0], "hidden columns: ", hiddenColumns);//jshint ignore:line

			for (let rowIndex in rowsColspan) {
				if (rowIndex === "0" || rowsColspan[rowIndex].colspan === 0 || exporting) continue;
				if (rowsColspan[rowIndex].colspan !== rowsColspan[0]) {
					console.error("Colspan error un row ", "columnsNo:", this.columnsNo, "rowColspan[0]:", rowsColspan[0], "hidden columns: ", hiddenColumns, "row " + rowIndex + ":", rowsColspan[rowIndex].colspan);
					console.log("check row def", rowsColspan[rowIndex].columns);
				}
			}
			if (this.attributes["edit-row"] === "editor" && !changed) {
				this.element.editorHtml = this.editorContent.html();
				this.editorContent.html("");
			}
			return thead;
		};
		template.createHeaderFilterRow = function (thead, changed) {
			var filterRow = this.createDOMElement("tr", {role: 'filters', ngKeydown: "$ctrl.objectFilterKeyDown($event)", ngClick: "$event.stopPropagation()"});
			var self = this;
			this.controller.filterRightBorder = createElement("div", {style: "position:absolute;right:0;top:0;width:0;height:100%;", class: "right-border"}).outerHTML;
			this.controller.filterLeftBorder = createElement("div", {style: "position:absolute;left:0;top:0;width:0;height:100%;", class: "left-border"}).outerHTML;
			let hasFilters = false;
			this.controller.columns.hideable.each(function (column) {
				let item = column.def;
				var th = axElement.createDOMElement("th", item.attributes);
				th.addStyle("padding", 0);
				th.addStyle("position", "relative");
				th.removeAttribute("sortable");
				th.setAttribute("column-for", item.getAttribute("header"));
				var columnIndex = th.getAttribute("column-index");
				var axFilterDef = self.getDirectChildrenOfType("AX-COLUMN-FILTER", item);
				hasFilters = hasFilters || (!column.hidden && axFilterDef.length > 0);
				if (!column.isScrollVisible || column.hidden) return;
				if (th.hasAttribute('hidden-column')) th.removeAttribute('hidden-column');
				var columnRightIndex = self.controller.columns.no - columnIndex - 1;

				if (axFilterDef.length > 1) console.error(getDataTableErrMsg(1001), item);
				if (axFilterDef.length === 1) {
					var element = new axTableColumnFilter(axFilterDef[0], self);
					self.controller.columns.filters[columnIndex] = {
						html: self.controller.filterLeftBorder + element.outerHTML + self.controller.filterRightBorder,
						name: axFilterDef[0].getAttribute("label")
					};
					th.innerHTML = element.outerHTML;
				}
				if (!th.hasClass("empty-column")) th.innerHTML = self.controller.filterLeftBorder + th.innerHTML + self.controller.filterRightBorder;
				filterRow.appendChild(th);
			});
			if (hasFilters) thead.appendChild(filterRow);
		};


	}//end constructor


}