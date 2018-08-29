class axTableController {
	/**
	 * @param {axTableController} $controller
	 */
	constructor($controller) {
		this.$api = null;
		this.editFormTemplate = "";
		this.booleanValues = [{value: true, text: "True"}, {value: false, text: "False"}, {value: null, text: ""}];
		this.currentPage = 1;
		this.movedToColumn = -1;
		this.working = 0;
		this.createObjects($controller);
		this.scrollTop = 0;
		this.hasChanges = false;
		this.$$virtualTest = false;
		this.changePagination = false;
		this.debug = Debugger($controller.attrs.debug === "true", $controller.attrs.config || 'axTableCtrl');
		this._show = $controller.attrs.hideable === "false";
		/**
		 * @type {axTableAttrs}
		 * */
		this.attrs = $controller.attrs;
		if ($controller.$template) {
			/**
			 * @type {axTableTemplate}
			 */
			this.$template = $controller.$template;
		}
		if ($controller.$layout) {
			/**
			 * @type {axTableLayout}
			 * */
			this.$layout = $controller.$layout;
		}
		if ($controller.$dataSource) {
			/**
			 * @type {axTableDatasource}
			 * */
			this.$dataSource = $controller.$dataSource;
			this.$dataSource.table = $controller;
		}
	}

	$destroy() {
		if (this.$destroying) return;
		this.debug.log("ax-table destroyng");
		if (this.config) {
			this.config.$ctrl = null;
			this.config = null;
		}
		this.$destroying = true;
		this.$dataSource.$destroy();
		this.$dataSource = null;
		this.distinctValues = null;
		this.$template.$destroy();
		this.$template = null;
		this.$layout.$destroy();
		// this.$layout.__proto__ = null;
		this.$layout = null;
		// delete this.$layout ;
		this.$dataStore = null;
		this.$interpolate = null;
		this.$parse = null;
		this.dateParser = null;
		this.$ngDialog = null;
		this.$dropdowns.$destroy();
		this.$dropdowns = null;
		delete this.$dropdowns;

		this.columns = null;
		this.groups = null;
		this.header = null;
		delete this.header;
		this.trTemplate = null;
		if (this.$$grid) {
			this.$$grid.datasource = null;
			if (this.$$grid.$$table.$destroying) {
				this.$$grid.$$table = null;
				delete this.$$grid.$$table;
			}
		}
		this.__proto__ = null;//jshint ignore:line
		delete this.__proto__;//jshint ignore:line
	}

	/**
	 * @param {axTableController} $controller
	 */
	createObjects($controller) {
		this.$dropdowns = new axTableDropdowns($controller);
		this.groupAsSortable = {
			name: "groupAsSortable",
			accept: function (sourceItemHandleScope, destSortableScope) {
				return destSortableScope.element.scope().$parent.$parent.group;
			},
			itemMoved: function (event) {
				var group = event.dest.sortableScope.element.scope().$parent.$parent.group;
				var sourceDataTable, destDataTable = event.dest.sortableScope.$parent.$ctrl;
				if (!group) {
					if (destDataTable.dataItemAdd(angular.copy(event.source.itemScope.modelValue)), true) {
						sourceDataTable = event.source.sortableScope.$parent.$ctrl;
						sourceDataTable.dataItemRemove(event.source.itemScope.modelValue);
					}
				} else {
					if (!group.dataItemGroupField) throw "No dataItemGroupField provided for group level";
					if (!group.dataItemIndexField) throw "No dataItemIndexField provided for group level";
					var originalItem = event.source.itemScope.modelValue;
					//var originalUid = originalItem.$$uid;
					//var dataItem = destDataTable.dataItemClean(originalItem);
					//dataItem.$$uid = originalUid;
					var data = event.dest.sortableScope.modelValue;
					for (let i = 0; i < data.length; i++) {
						let item = data[i];
						item[group.dataItemIndexField] = i + 1;
						if (originalItem.$$uid === item.$$uid) item[group.dataItemGroupField] = group.value;
					}
					destDataTable.datasourceChanged(false, originalItem);
					sourceDataTable = event.source.sortableScope.$parent.$ctrl;
					sourceDataTable.datasourceChanged(false);
				}
			},
			orderChanged: function (event) {
				var controller = event.dest.sortableScope.element.scope().$ctrl;
				var group = event.dest.sortableScope.element.scope().$parent.$parent.group;
				if (!group.dataItemIndexField) return false;
				if (!group.dataItemIndexField) throw "No dataItemIndexField provided for level";
				var dataItem = controller.dataItemClean(event.source.itemScope.modelValue);
				var data = event.dest.sortableScope.modelValue;
				for (let i = 0; i < data.length; i++) {
					data[i][group.dataItemIndexField] = i + 1;
				}
				controller.datasourceChanged(false, dataItem);
				return true;
			},
			clone: false,
			allowDuplicates: false
		};
		this.totalRecords = {
			initial() {
				return $controller.getCollection('initial', true) || 0;
			},
			filtered() {
				return $controller.getCollection('filtered', true) || 0;
			},
			viewed() {
				return $controller.getCollection('viewed', true) || 0;
			}
		};
	}

	show(initial) {
		if (this._show) return;
		this.debug.log("table.show", initial);
		this.element.linked.removeClass("ng-hide");
		this.element.linked.css({"visibility": "hidden"});
		this._show = true;
		let $controller = this;
		if (initial) {
			$controller.$timeout(function () {
				$controller.$layout.create($controller, $controller.scope());
				$controller.$layout.init();
				$controller.element.linked.find(">ax-table-content").css("visibility", "");
				$controller.element.linked.css({"visibility": ""});

			});
		}
		else this.render();
	}

	hide() {
		this.element.linked.addClass("ng-hide");
		this.element.linked.find("ax-table-content").css("visibility", "hidden");
		this._show = false;
	}

	getLoader(loaderSelector) {
		if (loaderSelector === "no") return {remove: angular.noop};
		else return this.$dataStore.loader(loaderSelector || this.$template.element.linked.closest(".ngdialog-content"));
	}

	clearData() {
		if (angular.isObject(this.loadDataApiArgs)) this.loadDataApiArgs = {};
		this.$api = null;
		this.editFormTemplate = "";
	}

	dataItemRemoveAttr(dataItem, attr) {
		return this.$dataSource.dataItemRemoveAttr(dataItem, attr);
	}

	dataItemGetAttr(dataItem, attr) {
		let value = this.$dataSource.dataItemGetAttr(dataItem, attr);
		return value;
	}

	dataItemSetAttr(dataItem, attr, value) {
		return this.$dataSource.dataItemSetAttr(dataItem, attr, value);
	}

	dataItemGetIndex(dataItem, collection) {
		return this.$dataSource.dataItemGetIndex(dataItem, collection);
	}

	dataItemAdd(dataItem, goToDataItem) {
		if (!this.dataLoaded) {
			console.error("Data source is not loaded. You cannot add items, before loaded datasource.");
			if (this.attrs.datasource) console.error("Datasource", this.attrs.datasource, "is not assigned");
			return;
		}
		this.$dataSource.add(dataItem, this.attrs.applyChangesOnSave);
		this.currentColumnIndex = 0;
		this.paginateApply(false, false, goToDataItem ? dataItem : false);
		return true;
	}

	dataItemRemove(dataItem, goToDataItem, callback) {
		let index = this.dataItemGetIndex(dataItem, "visibleItems");
		this.$dataSource.delete(dataItem, this.attrs.applyChangesOnSave);
		this.currentItem = undefined;
		if (this.attrs.applyChangesOnSave) this.datasourceChanged(false);
		else this.paginateApply(false, false);
		let $controller = this;
		this.$timeout(function () {
			if (($controller.getCollection("visibleItems", true) - 1) < index && goToDataItem !== false) {
				let index = $controller.getCollection("visibleItems", true) - 1;
				if (index > -1) {
					let dataItem = $controller.getCollection("visibleItems")[index];
					$controller.goToDataItem(dataItem, false, callback);
				} else {
					$controller.currentItem = null;
					$controller.currentRowIndex = null;
					if (callback) callback();
				}
				return;
			}
			if (goToDataItem !== false) {
				let dataItem = $controller.getCollection("visibleItems")[index];
				$controller.goToDataItem(dataItem, false, callback);
			}
			else if (callback) callback();
			if (goToDataItem === false) $controller.$currentItemChanged($controller.currentItem);
		}, 300);
		return true;
	}

	setDistinctValues(fieldName) {
		var data = this.getCollection("initial");
		var controller = this;
		var values = {};
		var convertType = this.distinctValues[fieldName].convertType;
		var convertFormat = this.distinctValues[fieldName].convertFormat;
		var invariantField = this.distinctValues[fieldName].invariantField;
		var convertObj = {fn: convertDataTypes[convertType] ? angular.copy(convertDataTypes[convertType]) : null};
		if (convertFormat) convertObj.displayFormat = convertFormat;
		var toString = function (value) {
			if (convertObj.fn === null) return value.toString();
			else if (["date", "datetime"].indexOf(convertType) > -1) return convertObj.fn(value, controller.dateParser);
			else return convertObj.fn(value);
		};
		data.each(function (item, i) {
			let value = item[fieldName];
			if (value === undefined || value === null) return;
			let key = toString(value);
			if (!values[key]) values[key] = {value: value, count: 1};
			else values[key].count++;
			if (invariantField) values[key].invariant = item[invariantField];

		});
		var keys = Object.keys(values);
		var distinctValues = [];
		keys.each(function (key, i) {
			let item = {id: key, value: values[key].value, count: values[key].count};
			if (invariantField) item.invariant = values[key].invariant;
			distinctValues.axPush(item);
		});
		this.distinctValues[fieldName].data = distinctValues;
	}

	getDomElement(selector) {
		var axDatatableElement = (this.$template) ? this.$template.element.linked : angular.element(this.element.tag + "[table-id='" + this.tableId + "']");
		if (selector) return axDatatableElement.find(selector);
		else return axDatatableElement;
	}

	displayColumn(columnIndex, type) {
		if (this.columns.hideable[columnIndex].hidden) return "none";
		else return type === "colgroup" ? "initial" : "table-cell";
	}

	getAllSortable() {
		return this.columns.sortable;
	}

	itemHasOverflow($event) {
		return $event.target.width < $event.target.scrollWidth;
	}

	setConfirmDeleteMessage(dataItem) {
		let message = "";
		var itemModel = this.dataItemModel;
		for (let i in itemModel) {
			if (itemModel.hasOwnProperty(i)) {
				let fieldName = itemModel[i];
				message += fieldName + "=" + dataItem[fieldName] + "\n";
			}
		}
		return message;
	}

	columnResize(event) {
		//this.debug.log('scrolleft', 5, axUtils.table.scrollLeft, axUtils.columnResizeScrollLeft);
		axUtils.table.getDomElement(">ax-table-content>[role=table-scroller]").scrollLeft(axUtils.columnResizeScrollLeft);
		//event.preventDefault();
		event.stopPropagation();
		event.cancelBubble = true;
		event.returnValue = false;
		if (!axUtils.columnResizing) return;
		if (!detectMouseLeftButton(event)) {
			axUtils.removeEventListener(angular.element(document)[0], 'mousemove', axUtils.columnResize);
			angular.element('html,body').css('cursor', axUtils.columnResizing.mouseCursor);
			axUtils.columnResizing.element.closest('thead').find('button').css('cursor', 'pointer');
			var width = axUtils.columnResizing.element.css('width');
			axUtils.columnResizing.element.css({width: '', 'min-width': width, 'max-width': width});
			axUtils.table.columnSetWidth(axUtils.columnResizing.element[0], axUtils.columnResizing.columnWidth);
			axUtils.columnResizing = false;
			//this.debug.log('final-----', event);
			return;
		}
		axUtils.columnResizing.movement += event.movementX;
		if (axUtils.columnResizing.colGroupWidth + axUtils.columnResizing.movement < 10) return;
		axUtils.columnResizing.columnWidth = axUtils.columnResizing.colGroupWidth + axUtils.columnResizing.movement;
		var newWidth = axUtils.columnResizing.elementWidth + axUtils.columnResizing.movement;
		axUtils.columnResizing.element.css({'min-width': newWidth + 'px', 'max-width': newWidth + 'px'});
		axUtils.columnResizing.colGroup.css('width', (axUtils.columnResizing.colGroupWidth + axUtils.columnResizing.movement) + 'px');
		axUtils.table.$layout.set.widthChanged();
	}

	mouseMoveOverHeader(event) {
		event.stopPropagation();
		event.preventDefault();
		event.cancelBubble = true;
		event.returnValue = false;
		//this.debug.log('scrolleft', 0, this.getDomElement("[role=table-scroller]").scrollLeft());
		if (!axUtils.columnResizing && detectMouseLeftButton(event)) {
			var element = angular.element(event.currentTarget).closest('th,td').not('.W100');
			if (element.length === 0) return;
			axUtils.columnResizeScrollLeft = this.getDomElement(">ax-table-content>[role=table-scroller]").scrollLeft();
			axUtils.columnResize = this.columnResize;
			var columnIndexEnd = this.getColumnIndexEnd(element);
			element.css({width: element.css('min-width'), 'min-width': '', 'max-width': ''});
			axUtils.columnResizing = {
				element: element,
				movement: 0,
				elementWidth: parseFloat(element.css('width')),
				mouseCursor: angular.element('html,body').css('cursor'),
				colGroup: this.getDomElement('colgroup col[column-index=' + columnIndexEnd + ']')
			};
			axUtils.columnResizing.colGroupWidth = parseFloat(axUtils.columnResizing.colGroup.css('width'));

			//this.debug.log("start", axUtils.columnResizing);
			axUtils.table = this;
			angular.element('html,body').css('cursor', 'col-resize ');
			element.closest('thead').find('button').css('cursor', 'col-resize');
			axUtils.table.getDomElement(">ax-table-content>[role=table-scroller]").scrollLeft(axUtils.columnResizeScrollLeft);
			axUtils.addEventListener(angular.element(document)[0], 'mousemove', axUtils.columnResize);
		}
	}

	columnSetWidth(thElement, width) {
		var columnIndexEnd = this.getColumnIndexEnd(angular.element(thElement));
		var columnIndex = parseInt(thElement.getAttribute('column-index')) - (this.hasGroupingColumn ? 1 : 0);
		if (columnIndex < 0) return;
		if (this.$template && this.$template.element.initial.find) {
			var columnDefs = this.$template.element.initial.find('ax-column');
			var columnDef = columnDefs[columnIndex];
			if (columnDef.getAttribute("width") === "100%") return;
			columnDef.setAttribute('width', width + 'px');
		}
		var colgroups = this.getDomElement('table[table-id=' + this.tableId + ']> colgroup col[column-index=' + columnIndexEnd + ']').css("width", width + 'px');
		if (colgroups.lenght > 0 && colgroups[0].hasAttribute('left-freezed-column')) this.$layout.scroller.set.left();
	}

	getColumnIndexEnd(th) {
		var columnIndexStart = th.attr('column-index');
		var columnIndexEnd = columnIndexStart;
		var columnsRange = th.attr('columns-range');
		if (columnsRange) {
			var columnsRangeArray = columnsRange.split(',');
			columnIndexEnd = columnsRangeArray[columnsRangeArray.length - 1];
		}
		return columnIndexEnd;
	}

	trHover(event) {
		var tr = event.currentTarget;
		var uid = tr.getAttribute('uid');
		var isOnLeft = angular.element(tr).closest('[role=table-left]').length > 0;
		var isOnRight = angular.element(tr).closest('[role=table-right]').length > 0;
		if (!isOnLeft && !isOnRight) {
			//isOnBody = angular.element(tr).closest('[role=table-scroller]').length > 0;
			tr = this.getDomElement('>ax-table-content>[role=table-left]').find('table > tbody> tr[uid="' + uid + '"]');
			tr.addClass('hover');
			tr = this.getDomElement('>ax-table-content>[role=table-right]').find('table > tbody> tr[uid="' + uid + '"]');
			tr.addClass('hover');
		} else if (isOnLeft) {
			tr = this.getDomElement('>ax-table-content>[role=table-scroller]').find('> table> tbody> tr[uid="' + uid + '"]');
			tr.addClass('hover');
			tr = this.getDomElement('>ax-table-content>[role=table-right]').find('table > tbody> tr[uid="' + uid + '"]');
			tr.addClass('hover');
		} else {
			tr = this.getDomElement('>ax-table-content>[role=table-scroller]').find('>table> tbody> tr[uid="' + uid + '"]');
			tr.addClass('hover');
			tr = this.getDomElement('>ax-table-content>[role=table-left]').find('table > tbody> tr[uid="' + uid + '"]');
			tr.addClass('hover');
		}
	}

	trBlur(event) {
		var tr = event.currentTarget;
		var uid = tr.getAttribute('uid');
		var isOnLeft = angular.element(tr).closest('[role=table-left]').length > 0;
		var isOnRight = angular.element(tr).closest('[role=table-right]').length > 0;
		if (!isOnLeft && !isOnRight) {
			//isOnBody = angular.element(tr).closest('[role=table-scroller]').length > 0;
			tr = this.getDomElement('>ax-table-content>[role=table-left]').find('table > tbody> tr[uid="' + uid + '"]');
			tr.removeClass('hover');
			tr = this.getDomElement('>ax-table-content>[role=table-right]').find('table > tbody> tr[uid="' + uid + '"]');
			tr.removeClass('hover');
		} else if (isOnLeft) {
			tr = this.getDomElement('>ax-table-content>[role=table-scroller]').find('>table> tbody> tr[uid="' + uid + '"]');
			tr.removeClass('hover');
			tr = this.getDomElement('>ax-table-content>[role=table-right]').find('table > tbody> tr[uid="' + uid + '"]');
			tr.removeClass('hover');
		} else {
			tr = this.getDomElement('>ax-table-content>[role=table-scroller]').find('>table> tbody> tr[uid="' + uid + '"]');
			tr.removeClass('hover');
			tr = this.getDomElement('>ax-table-content>[role=table-left]').find('table > tbody> tr[uid="' + uid + '"]');
			tr.removeClass('hover');
		}
	}

	//removeTrFocus(dataItem) {
	//    this.currentField = null;
	//}

	removeAllTrsFocus() {
		let tables = this.getNavigableTables();
		tables.find("tbody tr.error").removeClass("error");
	}

	dataClean() {
		var data = this.getCollection('initial');
		for (let i = 0; i < data.length; i++) {
			if (data[i].$$axTable) data[i].$$axTable.dataClean();
			this.dataItemClean(data[i]);
		}
	}

	dataItemClean(dataItem) {
		for (let fieldName in dataItem) {
			if (dataItem.hasOwnProperty(fieldName)) {
				if (fieldName.startsWith("$")) delete dataItem[fieldName];
			}
		}
		return dataItem;
	}

	isSelected(dataItem) {
		dataItem = dataItem || this.addEmptyRowData();
		if (this.attrs.selectableRows === 'single') {
			if (this.attrs.selectableRowsModelType === 'object') return this.selectableRowsModel === dataItem;
			else return (dataItem ? this.selectableRowsModel === dataItem[this.attrs.itemIdField] : this.selectableRowsModel === null);
		} else {
			if (this.attrs.selectableRowsModelType === 'object')
				return axUtils.findObject(this.selectableRowsModel, this.attrs.itemIdField, dataItem ? dataItem[this.attrs.itemIdField] : null) ? true : false;
			else {
				if (!this.selectableRowsModel) this.selectableRowsModel = [];
				return this.selectableRowsModel.indexOf(dataItem[this.attrs.itemIdField]) > -1;
			}
		}
	}

	canClosePopup($event) {
		if ($event) $event.stopPropagation();
		if (this.$parent.popupClose) this.$timeout(this.$parent.popupClose);
	}


	userSelectionChange(dataItem, dontClosePopup, value) {
		if (!this.attrs.selectableRows) return;
		if (dataItem && !angular.isDefined(value)) this.currentItem = dataItem;
		this.selectRow(dataItem, dontClosePopup, value);
		if (this.$dropdownParent) {
			var dropdown = this.$dropdownParent;
			this.$timeout(function () {
				dropdown.toggleButton.onSelectionChange(dataItem);
				//if (dropdown.onSelectionChange) dropdown.onSelectionChange(dataItem);
				//{ dataItem: dataItem } este necesar la filterPane by courses-skills
				if (dropdown.onSelectionChange) dropdown.onSelectionChange({dataItem: dataItem});
			});
		}
		else this.onSelectionChange(dataItem);
	}

	addEmptyRowData() {
		if (this.attrs.addEmptyRow !== "true") return null;
		var dataItem = {$$uid: null, $$rowIndex: null};
		if (this.attrs.itemIdField) dataItem[this.attrs.itemIdField] = null;
		if (this.attrs.itemDisplayField) dataItem[this.attrs.itemDisplayField] = null;
		return dataItem;
	}

	selectRows(value, removeSpinner) {
		if (this.attrs.addEmptyRow === 'true') {
			let dataItem = this.addEmptyRowData();
			if (value !== this.isSelected(dataItem)) {
				this.selectRow(dataItem, true, value);
				if (!this.$dropdownParent) this.onSelectionChange({dataItem: dataItem});
				else if (this.$dropdownParent.onSelectionChange) this.$dropdownParent.onSelectionChange(dataItem);
			}
		}
		if (value) {
			let data = this.getCollection('filtered');
			data.each(function (dataItem, i) {
				if (value === this.isSelected(dataItem)) return;
				this.selectRow(dataItem, true, true);
				if (!this.$dropdownParent) this.onSelectionChange({dataItem: dataItem});
				else if (this.$dropdownParent.onSelectionChange) this.$dropdownParent.onSelectionChange(dataItem);
			}, this);
		} else {
			while (this.selectableRowsModel.length > 0) {
				let dataItem;
				if (this.attrs.selectableRowsModelType === 'object') {
					dataItem = this.selectableRowsModel[0];
				}
				else if (this.attrs.selectableRowsModelType === 'id-field') {
					dataItem = this.datasource.findObject(this.selectableRowsModel[0], this.attrs.itemIdField);

				} else console.error("Code is not writed yet for selectableRowsModelType=" + this.attrs.selectableRowsModelType + "!!!!");
				this.selectRow(dataItem, true, false);
				if (!this.$dropdownParent) this.onSelectionChange({dataItem: dataItem});
				else if (this.$dropdownParent.onSelectionChange) this.$dropdownParent.onSelectionChange(dataItem);
			}
		}
		if (this.$dropdownParent) {
			var dropdown = this.$dropdownParent;
			this.$timeout(function () {
				dropdown.toggleButton.onSelectionChange();
				//dropdown.ctrl.close();
				if (removeSpinner) removeSpinner();
			});
		} else if (removeSpinner) removeSpinner();
		//else this.onSelectionChange();
	}

	selectRow(dataItem, dontClosePopup, value) {
		var selectable = this.attrs.selectableRows;
		if (selectable === '' || this.selectableDisabled()) return;
		if (selectable === 'single') {
			if (this.currentItem) {
				if (!this.rowIsDisabled({dataItem: this.currentItem})) {
					if (this.attrs.selectableRowsModelType === 'object') this.selectableRowsModel = this.currentItem;
					else this.selectableRowsModel = this.currentItem[this.attrs.itemIdField];
				} else return;
			}
			if (!dontClosePopup && this.attrs.dontClosePopup !== "true") this.canClosePopup();
		} else {
			if (this.attrs.selectableRowsModelType === 'object') {
				if (!this.selectableRowsModel) this.selectableRowsModel = [];
				if (dataItem && angular.isDefined(value)) {
					if (!this.rowIsDisabled({dataItem: dataItem})) {
						let index = this.attrs.itemIdField ? axUtils.findObjectIndex(this.selectableRowsModel, this.attrs.itemIdField, dataItem[this.attrs.itemIdField]) : axUtils.findOriginalObjectIndex(this.selectableRowsModel, dataItem);
						if (value) {
							this.selectableRowsModel.push(dataItem);
						} else {
							this.selectableRowsModel.splice(index, 1);
						}
					}
				} else {
					if (!this.rowIsDisabled({dataItem: this.currentItem})) {
						let index = this.attrs.itemIdField
							? axUtils.findObjectIndex(this.selectableRowsModel, this.attrs.itemIdField, this.currentItem ? this.currentItem[this.attrs.itemIdField] : null)// jshint ignore:line
							: axUtils.findOriginalObjectIndex(this.selectableRowsModel, this.currentItem);
						if (index === -1) {
							this.selectableRowsModel.push(this.currentItem);
						} else {
							this.selectableRowsModel.splice(index, 1);
						}
					}
				}
			} else {
				if (dataItem && angular.isDefined(value)) {
					if (!this.rowIsDisabled({dataItem: dataItem})) {
						let index = this.selectableRowsModel.indexOf(dataItem[this.attrs.itemIdField]);
						if (value) {
							this.selectableRowsModel.push(dataItem[this.attrs.itemIdField]);
						} else {
							this.selectableRowsModel.splice(index, 1);
						}
					}
				} else {
					if (!this.selectableRowsModel) this.selectableRowsModel = [];
					if (!this.rowIsDisabled({dataItem: this.currentItem})) {
						let index = this.selectableRowsModel.indexOf(this.currentItem[this.attrs.itemIdField]);
						if (index === -1) {
							this.selectableRowsModel.push(this.currentItem[this.attrs.itemIdField]);
						} else {
							this.selectableRowsModel.splice(index, 1);
						}
					}
				}
			}
		}
	}

	goToDataItem(dataItem, event, callback, visibleIndex) {
		if (!dataItem || this.getCollection('initial', true) === 0 || this.getCollection('viewed', true) === 0) return;
		//this.debug.log("gotoDataItem", dataItem);
		var self = this, pageNo;
		if (dataItem.$$uid === null && this.attrs.addEmptyRow !== "true") return;
		var index = this.dataItemGetIndex(dataItem, "viewed");
		if (index === undefined && this.attrs.addEmptyRow === "true") index = "null";
		if (this.$paginator) {
			let visibleItemsLength = this.getCollection("visibleItems", true);
			let lastVisibleItemIndex = this.$dataSource.getLastVisibleItemIndex();
			if (index === undefined) {
				if (this.dataItemGetAttr(dataItem, "isFirstItem")) index = 0;
				else index = this.dataItemGetIndex(dataItem, "visibleItems");
				if (index === undefined) index = 0;
				if (lastVisibleItemIndex > -1) index = Math.min(index, lastVisibleItemIndex);
				pageNo = Math.floor(index / this.getPageSize()) + 1;
				self.$paginator.goToPage(pageNo, index, visibleIndex);
				if (callback) this.$timeout(callback);
				return;
			} else if (index === lastVisibleItemIndex && this.$paginator.toIndex < visibleItemsLength) {
				index = visibleItemsLength;
				pageNo = Math.floor(index / this.getPageSize()) + 1;
				self.$paginator.goToPage(pageNo, index, visibleIndex);
				if (callback) this.$timeout(callback);
				return;
			} else index = this.dataItemGetIndex(dataItem, 'visibleItems');
		}
		// this.debug.log("gotoDataItem", index, dataItem);
		this.$timeout(function () {
			self.goToRow(index, event, false, callback, visibleIndex);
		});
	}


	clickRow(index, event) {
		if (angular.isObject(index)) {
			let dataItem = index;
			index = this.dataItemGetIndex(dataItem, 'visibleItems');
			if (index === undefined) console.error("visbileItemsIndex error for ", dataItem);
			if (this.isLastViewedItem(dataItem) && this.hasPartialViewedRecordItem()) {
				this.$paginator.fromIndex++;
				return this.paginateApply(false, false, dataItem);
			}
		}
		event.preventDefault();
		if (this.inlineEditing) return event.stopPropagation();

		var currentCell;
		if (event.target.tagName === "TD") currentCell = event.target;
		else currentCell = angular.element(event.target).closest("td")[0];
		if (!currentCell) return; // obiectul click-at s-a distrus;
		var columnIndex = currentCell.getAttribute("column-index");
		var $controller = this;
		if ($controller.attrs.selectOnClickRow !== "false") {
			event.stopPropagation(); // ca sa nu inchida dropdown la on click pe element (caz: DV new dashboard analyze)
			//stopPropagation impiedica dropdown-urile sa se inchida la click pe ax-dtatable
			//this.debug.log("click", event.target);
		}
		var dataItem = (index === -1) ? $controller.addEmptyRowData() : $controller.getCollection('visibleItems')[index];
		var callback = (!dataItem || dataItem.isGroupItem || $controller.attrs.selectOnClickRow === "false" || !this.attrs.selectableRows)
			? angular.noop//jshint ignore:line
			: function () {
				$controller.userSelectionChange($controller.currentItem);
			};
		this.goToRow(index, columnIndex, false, callback);
	}

	getNavigableRows() {
		var trs = this.getDomElement('[role=table-scroller] tr[role=data-row]:not(.ng-hide):not([disabled1])');
		return trs;
	}

	goTop(event, collapsedGroup, callback, visibleIndex, notFocus) {
		if (this.inlineEditing) return;
		var index = (this.attrs.addEmptyRow === "true") ? "null" : 0;
		this.goToRow(index, event, collapsedGroup, callback, visibleIndex, notFocus);
	}

	goToFirstRow() {
		if (this.inlineEditing) return;
		let index = 0;
		let dataItem = this.$dataSource.getCollection("visibleItems")[index];
		while (dataItem && dataItem.isGroupItem) {
			dataItem = this.$dataSource.getCollection("visibleItems")[++index];
		}
		if (dataItem) this.goToDataItem(dataItem);
	}

	goToLastRow() {
		if (this.inlineEditing) return;
		let index = this.$dataSource.getCollection("visibleItems", true);
		let dataItem = this.$dataSource.getCollection("visibleItems")[--index];
		while (dataItem && dataItem.isGroupItem) {
			dataItem = this.$dataSource.getCollection("visibleItems")[--index];
		}
		if (dataItem) this.goToDataItem(dataItem);
	}

	goToNextRow() {
		if (this.inlineEditing) return;
		let index = this.currentRowIndex || 0;
		let dataItem = this.$dataSource.getCollection("visibleItems")[++index];
		while (dataItem && dataItem.isGroupItem) {
			dataItem = this.$dataSource.getCollection("visibleItems")[++index];
		}
		if (dataItem) this.goToDataItem(dataItem);
	}

	goToPreviousRow() {
		if (this.inlineEditing) return;
		let index = this.currentRowIndex || 0;
		let dataItem = this.$dataSource.getCollection("visibleItems")[--index];
		while (dataItem && dataItem.isGroupItem) {
			dataItem = this.$dataSource.getCollection("visibleItems")[--index];
		}
		if (dataItem) this.goToDataItem(dataItem);
	}

	goToRowCallback(dataItem, event) {
	}

	permitGoToRow(index, event, callback) {
		callback();
	}

	//currentRow
	$currentItemChanged(dataItem) {
		this.$childrenSetParentItem(dataItem);
		if (this.config.currentItemChanged) this.config.currentItemChanged(dataItem);
	}

	currentRowChanged(dataItem) {
		this.$currentItemChanged(dataItem);
	}

	dataItemIsChanged(dataItem) {
		this.$currentItemChanged(dataItem);
	}

	/*
* event can be js event or columnIndex number
* */
	goToRow(index, event, collapsedGroup, callback, visibleIndex, notFocus) {
		//this.debug.log("got to row", index, this.attrs.config);
		if (this.$destroying) return;
		// if (index === undefined || this.getCollection('initial', true) === 0 || this.getCollection('viewed', true) === 0) return callback? callback: true;
		if (index === "null") {
			if (this.attrs.addEmptyRow !== "true") index = 0;
		}
		if (index === -1) return this.goTop(event, collapsedGroup, callback, visibleIndex);
		var filterNotFreezed = ":not([left-freezed-column=body]):not([right-freezed-column=body]):not([hidden-column])";
		//this.debug.log("gotorow 0", index, this.currentItem);
		/**
		 *
		 * @param {axTableController} $controller
		 * @param index
		 * @param event
		 * @param collapsedGroup
		 */
		var goToRowFn = function goToRowCallback($controller, index, event, collapsedGroup) {

			if ($controller.$destroying) return;
			var rowIndexDiff = index - ($controller.currentRowIndex || 0);
			var tables, tr;
			tables = $controller.getNavigableTables();
			//this.debug.log("tables", tables);
			if (visibleIndex === 5) {
				let found = 0;
				let newIndex = -1;
				// nagigate to the top
				if (visibleIndex === 2) {
					tr = angular.element(tables).find("tr[index]").filter(function () {
						if ($(this).attr("index") <= index) {
							newIndex = $(this).attr("index");
							return true;
						}
						else return false;
					});

				} else { // nagigate to the bottom
					tr = angular.element(tables).find("tr[index]").filter(function () {
						if ($(this).attr("index") >= index && !found) {
							newIndex = $(this).attr("index");
							found = 1;
							return true;
						}
						else return false;
					});
				}
				tr = angular.element(tables).find("tr[index=" + newIndex + "]");

				if (tr && tr.length >= 0) index = tr.attr("index");
				else return;
			}
			else tr = $controller.getCurrentAllTr(index);
			if (tr.length === 0) {
				if ($controller.groups.defs.length > 0) {
					if (rowIndexDiff >= 0)
						tr = angular.element(tables).find("tr[index]").filter(function () {
							return $(this).attr("index") >= index;
						});
					else
						tr = angular.element(tables).find("tr[index]").filter(function () {
							return $(this).attr("index") <= index;
						});
					if (tr.length === 0 && collapsedGroup) tr = angular.element(tables).find("tr[index]");
					if (tr.length === 0) {
						return callback ? callback() : true;
					}
					index = tr[0].getAttribute('index') || 0;
					tr = angular.element(tr[0]);
				} else {
					console.error('trs found for index', index, tr);
					throw "Not found table tr for index: " + index;
				}
			} else if (tr.length !== 1) {
				// this.debug.log('trs found for index', index, tr);
				// throw "No unique index found on table tr for index: " + index;
			}
			var uid = parseInt(tr[0].getAttribute("uid"));
			$controller.currentRowIndex = parseInt(index);
			$controller.currentTr = tr;
			if (index === "null" && $controller.attrs.addEmptyRow === 'true') $controller.currentItem = $controller.addEmptyRowData();
			else if (!$controller.currentItem || $controller.currentItem.$$uid !== uid) {
				$controller.currentItem = $controller.getCollection('visibleItems')[index];
				//this.debug.log("gotorow", index, $controller.currentItem);
				$controller.$timeout(function () {
					$controller.$currentItemChanged($controller.currentItem);
				});
				if (!$controller.currentItem) {
					// console.error("goToRow error", index, uid, tr);
					// throw "No dataItem found for uid  " + uid + "!";
					return callback ? callback() : true;
				}
			}

			var canEdit = ($controller.canEdit || $controller.dataItemGetAttr($controller.currentItem, 'editing')) && !$controller.rowIsDisabled({dataItem: $controller.currentItem}) && !$controller.currentItem.isGroupItem;
			if (canEdit) $controller.createClone($controller.currentItem);
			//this.debug.log("gotorow", index, event, tr, $controller.attrs.config);

			if (angular.isFunction($controller.config.goToRowCallback)) $controller.config.goToRowCallback($controller.currentItem, event);
			if ($controller.$$grid && $controller.$$grid.$$editor) $controller.$$grid.$$editor.goToRowCallback($controller.currentItem, event);
			if (angular.isObject(event)) { //user click row
				let td = angular.element(event.target).closest("tr").find('td');
				if (td.length > 0 && !notFocus) {
					if (td[0].hasAttribute("left-freezed-column") || td[0].hasAttribute("right-freezed-column"))
						td = tr.find("td[column-index]" + filterNotFreezed);
					if (td.find('.hasFocus').length === 0 && td.length > 0) {
						if (canEdit) {
							$controller.$timeout(function () {
								var controls = $controller.getTdControls(td);
								if (controls.length > 0) $controller.setTdFocus(controls);
							});
						} else td[0].focus();
					}
				}
				if (tr[0].hasAttribute("disabled") || tr[0].hasAttribute("readonly")) return;
				if (callback) callback();
			} else if (angular.isDefined(event)) { //event = columnIndex
				let tds = tr.find("td[column-index=" + event + "]" + filterNotFreezed);
				if (tds.length === 0) tds = tr.find("td[column-index]" + filterNotFreezed);
				if (!notFocus) {
					if (canEdit) {
						$controller.$timeout(function () {
							var controls = $controller.getTdControls(tds);
							if (controls.length > 0) $controller.setTdFocus(controls);
							else $controller.findNextControl(tr, event);

						});
					} else {
						tds[0].focus();
					}
				}
				if (tr[0].hasAttribute("disabled") || tr[0].hasAttribute("readonly")) return;
				if (callback) callback();
			} else if (!notFocus) {
				// this.debug.log("currentColumnIndex", $controller.currentColumnIndex);
				if (canEdit) {
					$controller.$timeout(function () {
						$controller.findNextControl(tr, isNaN(parseInt($controller.currentColumnIndex)) ? -1 : $controller.currentColumnIndex - 1);
					});
				} else {
					let td = tr.find("td[column-index]" + filterNotFreezed);
					if (td.length) td[0].focus();
				}
			}
		};
		var $controller = this;
		this.permitGoToRow(index,
			event,
			function permitGoToRowCallback() {
				goToRowFn($controller, index, event, collapsedGroup);
			});
	}

	objectHasFocus(event, dataItem, fieldName, $event) {
		if (!event) return;
		let currentTd = angular.element(event.target).closest("td");
		this.currentColumnIndex = currentTd.attr('column-index');
		// if (!this.getClone(dataItem)) this.createClone(dataItem);
		this.currentField = fieldName;
		//this.currentItem = dataItem; provoaca o problema la inlineEditing = true si click pe alt row si sageata -> devine item current alt dataItem decat cel care e deja
		//if (this.currentTrElement) this.currentTrElement.find(".form-control.hasFocus").removeClass("hasFocus");
		this.getDomElement(".form-control.hasFocus").removeClass("hasFocus");
		this.currentFocusObject = angular.element(event.target).closest(".form-control");
		if (this.currentFocusObject.hasClass("hasFocus")) return;
		this.debug.log("object has focus", fieldName, this.currentFocusObject.attr("class"), event ? event.target : "");
		this.currentFocusObject.addClass("hasFocus");
		this.currentTrElement = this.getCurrentAllTr(this.currentRowIndex);
		let error = currentTd.find("[error-for]");
		//this.debug.log("object has focus", this.currentColumnIndex, error, fieldName);
		if (error.length > 0) {
			this.$timeout(function () {
				error.trigger("mouseenter");
			});
		}
	}

	changeEdit() {
		if (this.attrs.editRow !== "inline-cell") return;
		this.removeAllTrsFocus();
		this.canEdit = !this.canEdit;
		if (this.canEdit) {
			this.currentField = null;
			this.goToRow(this.currentRowIndex || -1);
		}
		if (this.canEdit) this.childrenSetToEdit();
		else this.childrenSetToReadOnly();

	}

	getNavigableTables() {
		let tables = this.getDomElement(">ax-table-content>[role=table-left] >div[role=body]> table");
		tables.push(this.getDomElement(">ax-table-content>[role=table-scroller] > table")[0]);
		if (this.attrs.rightFreezedColumns > 0) tables.push(this.getDomElement(">ax-table-content>[role=table-right] >div[role=body]> table")[0]);
		return tables;
	}

	focusToFirstError() {
		let trs = this.getCurrentAllTr(this.currentRowIndex);
		let tds = trs.find(".has-error");
		if (tds.length > 0) {
			var controls = this.getTdControls(tds);
			if (controls.length > 0) {
				trs.blur();
				tds.find("[error-for]").trigger("mouseenter");
				controls[0].focus();
			}
		}
	}


	setTdFocus(controls) {
		var control;
		// this.debug.log("setTdsFocus", controls);
		if (controls.find("[has-input]:not([disabled]):not([readonly])").length > 0) control = controls.find("[has-input]:not([disabled]):not([readonly])");
		else control = controls;
		control.closest('.form-control,td')[0].focus();
		control[0].focus();
	}

	getTdControls(td) {
		return td.find("[has-input]:not([disabled]):not([readonly])");
	}

	focusToColumn(tr, current) {
		this.movedToColumn = -1;
		if (!tr) return;
		var tds = tr.find("td[tabindex]").filter(function () {
			return !(angular.element(this).css('visibility') === 'hidden' || angular.element(this).css('display') === 'none');
		});
		if (tds.length === 0) return false;
		if (tds.find("[role=column-input]").length === 0) {
			tds[0].focus();
			return true;
		}
		var nextControl;
		var tabIndex = parseInt(current);
		var isDone = false;
		for (var i = 0; i < tds.length; i++) {
			var index = parseInt(tds[i].getAttribute("tabindex"));
			if (tabIndex > index) continue;
			let controls = this.getTdControls(angular.element(tds[i]));
			if (controls.length === 0) continue;
			for (let i = 0; i < controls.length; i++) {
				let element = angular.element(controls[i]);
				if (!element.is(":visible")) continue;
				nextControl = element;
				break;
			}
			if (!nextControl) continue;
			this.setTdFocus(nextControl);
			isDone = true;
			break;
		}
		return isDone;

	}

	findNextControl(tr, current) {
		this.movedToColumn = -1;
		if (!tr) return this.debug.log("no tr");
		this.debug.log("findNextControl", tr, current);
		var tds = tr.find("td[tabindex]").filter(function () {
			return !(angular.element(this).css('visibility') === 'hidden' || angular.element(this).css('display') === 'none');
		});
		if (tds.length === 0) return false;
		if (tds.find("[role=column-input]").length === 0) {
			tds[0].focus();
			//this.debug.log("focus to ", tds[0])
			return true;
		}

		var nextControl;
		if (angular.isObject(current)) {
			var controls = this.getTdControls(angular.element(current).closest("td"));
			if (controls.length > 1) {
				for (let i = 0; i < controls.length; i++) {
					if (controls[i] === current) {
						i++;
						while (i < controls.length) {
							var control = angular.element(controls[i]);
							i++;
							if (!control.is(":visible")) continue;
							nextControl = control;
							break;
						}
						break;
					}
				}
				if (nextControl) return this.setTdFocus(nextControl);
			}
		}
		var tabIndex = angular.isObject(current) ? parseInt(angular.element(current).closest("td").attr("tabindex")) : parseInt(current);
		var isDone = false;
		for (var i = 0; i < tds.length; i++) {
			var index = parseInt(tds[i].getAttribute("tabindex"));
			if (tabIndex >= index) continue;
			let controls = this.getTdControls(angular.element(tds[i]));
			if (controls.length === 0) continue;
			for (let i = 0; i < controls.length; i++) {
				let element = angular.element(controls[i]);
				if (!element.is(":visible")) continue;
				nextControl = element;
				break;
			}
			if (!nextControl) continue;
			if (this.attrs.editRow === "inline-cell") this.movedToColumn = tds[i].getAttribute("column-index");
			this.setTdFocus(nextControl);
			isDone = true;
			break;
		}
		return isDone;

	}


	findPreviousControl(tr, current) {
		this.movedToColumn = -1;
		var tds = tr.find("td[tabindex]").filter(function () {
			return !(angular.element(this).css('visibility') === 'hidden' || angular.element(this).css('display') === 'none');
		});
		if (tds.length === 0) return false;
		if (tds.find("[role=column-input]").length === 0) {
			tds[0].focus();
			return true;
		}
		var nextControl, controls;
		if (angular.isObject(current)) {
			controls = this.getTdControls(angular.element(current).closest("td"));
			if (controls.length > 1) {
				for (let i = controls.length - 1; i >= 0; i--) {
					if (controls[i] === current) {
						i--;
						while (i >= 0) {
							var control = angular.element(controls[i]);
							i++;
							if (!control.is(":visible")) continue;
							nextControl = control;
							break;
						}
						break;
					}
				}
				if (nextControl) return this.setTdFocus(nextControl);
			}
		}
		var tabIndex = parseInt(angular.element(current).closest("td").attr("tabindex"));
		var isDone = false;
		for (var i = tds.length - 1; i >= 0; i--) {
			var index = parseInt(tds[i].getAttribute("tabindex"));
			if (tabIndex <= index) continue;
			controls = this.getTdControls(angular.element(tds[i]));
			if (controls.length === 0) continue;
			for (let i = 0; i < controls.length; i++) {
				let element = angular.element(controls[i]);
				if (!element.is(":visible")) continue;
				nextControl = element;
				break;
			}
			if (!nextControl) continue;
			this.setTdFocus(nextControl);
			if (this.attrs.editRow === "inline-cell") this.movedToColumn = parseInt(tds[i].getAttribute("column-index"));
			isDone = true;
			break;
		}
		return isDone;
	}


	checkBoxClick(dataItem, $event) {
		$event.stopPropagation();
		this.currentItem = dataItem;
		return true;
	}


	isFirstViewedItem(dataItem) {
		return dataItem.$$uid === this.$dataSource.collections.index.firstViewedIndex;
	}

	isLastViewedItem(dataItem) {
		return dataItem.$$uid === this.$dataSource.collections.index.lastViewedIndex;
	}

	isLastNavigableItem(dataItem) {
		return dataItem.$$uid === this.$dataSource.collections.index.lastNavigableIndex;
	}

	hasPartialViewedRecordItem(dataItem) {
		return this.$dataSource.collections.index.lastNavigableIndex !== this.$dataSource.collections.index.lastViewedIndex;
	}

	objectFilterKeyDown(event) {
		//if ((event.keyCode === keyCodes.Tab || event.keyCode === keyCodes.Return) || event.keyCode === keyCodes.DownArrow) {
		// this.debug.log("fitler key down");
		if (event.keyCode === keyCodes.DownArrow) {
			this.goToRow(-1);
		}
	}

	tableKeyDown(event) {
		var ctrlDown = event.ctrlKey || event.metKey;
		// this.debug.log("table key down", "Ctrl:", ctrlDown, "Code:", event.keyCode, event.key);
		if (ctrlDown && event.keyCode === keyCodes.function.f4) {
			if (this.$parent.launcher) {
				event.preventDefault();
				event.stopPropagation();
				if (this.$parent.launcher.readOnly) this.$parent.launcher.close();
				else this.$parent.launcher.confirm();
			}
		} else if (this.attrs.editRow === "editor" && this.$$grid.$$editor.opened) this.$$grid.$$editor.form.keyboardHandle(event);
		else if (ctrlDown && this.attrs.editRow !== "editor" && event.keyCode === keyCodes.letter.N) {
			if (!this.attrs.editRow || this.inlineEditing) return;
			event.preventDefault();
			event.stopPropagation();
			event.currentTarget.blur();
			let self = this;
			if (this.attrs.editRow === "editor" && this.$$grid.$$editor.opened) this.$$grid.$$editor.form.add(true);
			else {
				if (this.canEdit && this.currentItem && this.attrs.editRow === "inline-cell") {
					let fieldName = event.target.getAttribute("bind-to") || ($(event.target).closest("[bind-to]").lenght ? $(event.target).closest("[bind-to]").getAttribute("bind-to") : "");
					if (fieldName) {
						this.save(this.currentItem, function () {
							self.create();
						});
					} else this.create();
				} else this.create();
			}
			return true;
		} else if (ctrlDown && event.keyCode === keyCodes.letter.Q) {
			event.preventDefault();
			event.stopPropagation();
			this.changeTableFocus();
		}

		return false;
	}

	objectCellKeyDown(dataItem, event) {
		if (this.tableKeyDown(event)) return;
		if (this.currentItem !== dataItem) this.objectHasFocus(event, dataItem);
		if (this.attrs.editRow === "editor" && this.$$grid.$$editor.opened) return;

		var tr = angular.element(event.target).closest("tr");
		var index = tr.attr("index");
		var columnIndex, tds;
		var canEdit = !this.rowIsDisabled({dataItem: dataItem});
		var ctrlDown = event.ctrlKey || event.metKey;
		if (event.shiftKey && (event.keyCode === keyCodes.Tab || event.keyCode === keyCodes.Return) || event.keyCode === keyCodes.LeftArrow1) {
			event.preventDefault();
			event.stopPropagation();
			tr = this.getCurrentAllTr(index);
			this.dontChangeFocus = true;
			this.findPreviousControl(tr, event.target);
			return canEdit;
		} else if (event.keyCode === keyCodes.Tab || event.keyCode === keyCodes.Return || event.keyCode === keyCodes.RightArrow1) {
			event.preventDefault();
			event.stopPropagation();
			this.dontChangeFocus = true;
			if (event.keyCode === keyCodes.Return && this.attrs.selectableRows === "single") this.userSelectionChange(dataItem);
			else {
				tr = this.getCurrentAllTr(index);
				this.findNextControl(tr, event.target);
				return canEdit;
			}
		} else if (ctrlDown && event.keyCode === keyCodes.letter.D) {
			if (!this.rowIsDisabled({dataItem: dataItem})) {
				if (!this.attrs.editRow) return;
				event.preventDefault();
				event.stopPropagation();
				this.delete(dataItem, true);
			}
			return true;
		} else if (ctrlDown && event.keyCode === keyCodes.End) {
			if (this.$paginator && !this.inlineEditing) {
				event.preventDefault();
				event.stopPropagation();
				if (this.canEdit && !this.$validateField(this.currentField, this.currentItem)) return false;

				this.$paginator.goToLastPage();
			}
			return true;
		} else if (ctrlDown && event.keyCode === keyCodes.Home) {
			if (this.$paginator && !this.inlineEditing) {
				event.preventDefault();
				event.stopPropagation();
				if (this.canEdit && !this.$validateField(this.currentField, this.currentItem)) return false;
				this.$paginator.goToFirstPage();
			}
			return true;
		} else if (event.keyCode === keyCodes.PageDown) {
			if (this.$paginator && !this.inlineEditing) {
				event.preventDefault();
				event.stopPropagation();
				if (this.canEdit && !this.$validateField(this.currentField, this.currentItem)) return false;

				this.$paginator.goToNextPage();
			}
			return true;
		} else if (event.keyCode === keyCodes.PageUp) {
			if (this.$paginator && !this.inlineEditing) {
				event.preventDefault();
				event.stopPropagation();
				if (this.canEdit && !this.$validateField(this.currentField, this.currentItem)) return false;
				this.$paginator.goToPreviousPage();
			}
			return true;
		} else if (this.attrs.selectableRows && (event.keyCode === keyCodes.Return || event.keyCode === keyCodes.Spacebar)) {
			if (!dataItem || !dataItem.isGroupItem) {
				event.preventDefault();
				event.stopPropagation();
				this.userSelectionChange(dataItem ? dataItem : this.addEmptyRowData());
				return true;
			} else return false;
		} else if (event.keyCode === keyCodes.UpArrow && !this.inlineEditing) {
			event.preventDefault();
			event.stopPropagation();
			if (this.canEdit && !this.$validateField(this.currentField, this.currentItem)) return false;

			let self = this;
			let moveTo = function () {
				tds = angular.element(event.target).closest("td");
				if (self.currentItem && self.currentItem.isGroupItem) columnIndex = self.currentColumnIndex;
				else if (tds.length > 0) columnIndex = angular.element(event.target).closest("td")[0].getAttribute("column-index");
				else columnIndex = 0;
				index--;
				if (index === -1 && self.attrs.addEmptyRow === 'true') return self.goTop(columnIndex);
				if (self.currentItem && self.$paginator && self.isFirstViewedItem(self.currentItem)) {
					self.$paginator.goToPreviousPage(Math.max(0, self.dataItemGetIndex(self.currentItem, 'visibleItems') - 1));
					return canEdit;
				} else {
					self.goToRow(index, columnIndex);
					return canEdit;
				}
			};
			if (this.attrs.editRow === "inline-cell" && this.canEdit) this.save(this.currentItem, moveTo);
			else return moveTo();
		} else if (event.keyCode === keyCodes.DownArrow && !this.inlineEditing) {
			event.preventDefault();
			event.stopPropagation();
			let self = this;
			tds = angular.element(event.target).closest("td");
			//console.log("key down DownArray", tds);
			if (this.canEdit && !this.$validateField(this.currentField, this.currentItem)) return false;
			if (self.currentItem && self.currentItem.isGroupItem) columnIndex = self.currentColumnIndex;
			else if (tds.length > 0) columnIndex = tds[0].getAttribute("column-index");
			else columnIndex = 0;
			let moveTo = function () {
				if (index === 'null') index = 0;
				else index++;
				if (self.currentItem && self.$paginator && self.isLastNavigableItem(self.currentItem)) {
					self.$paginator.goToNextPage(index);
					return canEdit;
				}
				else {
					self.goToRow(index, columnIndex);
					return canEdit;
				}
			};
			if (this.attrs.editRow === "inline-cell" && this.canEdit) return this.save(this.currentItem, moveTo);
			else return moveTo();
		} else if (event.keyCode === keyCodes.Escape) {
			event.preventDefault();
			event.stopPropagation();
			if (this.attrs.editRow === "inline" && this.inlineEditing) this.undo(dataItem);
			else if (this.$parent.popupClose) this.$parent.popupClose();
			return true;
		} else if (event.keyCode === keyCodes.function.f2) {
			event.preventDefault();
			event.stopPropagation();
			if (this.attrs.editRow === "editor") {
				this.$$grid.$$editor.open();
				//this.$$grid.$$editor.form.edit();
			}
			else if (this.attrs.editRow === "inline") this.update(dataItem);
			else if (this.attrs.editRow === "inline-cell") this.changeEdit();
			return true;
		} else if (ctrlDown && event.keyCode === keyCodes.letter.S) {
			event.preventDefault();
			event.stopPropagation();
			if (this.parentConfig && this.parentConfig.$ctrl.$$grid.$$editor) {
				if (!this.parentConfig.$ctrl.$$grid.$$editor.opened) return true;
				this.parentConfig.$ctrl.$$grid.$$editor.form.$ctrl.save();
			}
			else if (this.attrs.parentConfig) this.parentConfig.$ctrl.save(this.parentConfig.$ctrl.currentItem, false, true);
			else if (["inline", "inline-cell"].includes(this.attrs.editRow)) this.save(dataItem, false, true);
			return true;
		} else if (!canEdit) {
			event.preventDefault();
			event.stopPropagation();
			return false;
		} else return true;
	}


	canAdd() {
		if (this.parentConfig && this.parentConfig.$ctrl) {
			if (["inline", "editor"].includes(this.parentConfig.$ctrl.attrs.editRow)) return this.parentConfig.$ctrl.inlineEditing;
			else if (this.parentConfig.$ctrl.attrs.editRow === "inline-cell") return this.parentConfig.$ctrl.canEdit;
			else return false;
		} else if (this.config.canAdd) return this.config.canAdd();
		else return this.dataLoaded;
	}

	create(params, formCallback) {
		var $controller = this;
		if (this.inlineEditing || !this.canAdd()) return;
		let createFn = function (newItem) {
			if ($controller.config.dataAdapter) $controller.config.dataAdapter.parseItem(newItem);
			if ($controller.config.createCallback) $controller.config.createCallback(newItem);
			$controller.editRow($controller.$template.getMessage("common", "new"), newItem, true);
			$controller.$currentItemChanged(newItem);
			if (angular.isFunction(formCallback)) formCallback(newItem);
		};
		if (this.$api) {
			var apiArgs = {metadata: true};
			if (this.config.createExtendApiArgs) angular.extend(apiArgs, this.createExtendApiArgs());
			else if (this.config.createApiArgs) angular.extend(apiArgs, this.createApiArgs());
			$controller.$api.newAction(apiArgs)
				.then(function (response) {
					if (response.data) createFn(response.data);
					if (response && response.loader) response.loader.remove();
					if (!response || !response.status) console.error("Api error:", response);

				});
		} else {
			createFn($controller.emptyItem(params));
		}
	}

	emptyItem(params) {
		if (this.config.emptyItem) return this.config.emptyItem(params);
		else return angular.isFunction(this.$dataSource.config.emptyItem) ? this.$dataSource.config.emptyItem(params) : {};
	}

	read(dataItem) {
		var $controller = this;
		if (this.$api)
			this.remoteEditAction(dataItem,
				function (response) {
					if (!response) return;
					if (response.data)
						$controller.openDialog($controller.$template.getMessage("common", "view"), true, response.data, $controller.editFormTemplate, $controller, null, {readOnly: true});
					response.loader.remove();
				});
		else $controller.editRow($controller.$template.getMessage("common", "view"), dataItem, false, true);
	}

	canUpdate(dataItem) {
		return true;
	}

	update(dataItem, $event) {
		var $controller = this;
		if (this.inlineEditing || dataItem.isGroupItem || !this.canUpdate(dataItem)) return;
		if ($event) {
			if (this.currentItem !== dataItem) this.clickRow(dataItem, $event);
			$event.stopPropagation();
			$event.preventDefault();
		}
		if (this.attrs.refreshItemOnEdit && this.$api) {
			this.remoteEditAction(dataItem,
				function (response) {
					if (!response) return;
					if (response.data) {
						response.data.$$uid = dataItem.$$uid;
						angular.extend(dataItem, response.data);
						if ($controller.config.dataAdapter) dataItem = $controller.config.dataAdapter.parseItem(dataItem);
						$controller.refreshViewItem(dataItem);
						$controller.editRow($controller.$template.getMessage("common", "edit"), dataItem);
					}
					response.loader.remove();
				});
		} else $controller.editRow($controller.$template.getMessage("common", "edit"), dataItem);
	}

	canDelete(dataItem) {
		if (this.config.canDelete && this.attrs.editRow !== "editor") return this.config.canDelete(dataItem);
		return true;
	}

	delete(dataItem, ngDialog, callback) {
		var $controller = this;
		if (!this.canDelete(dataItem)) return;
		var deleteFromServer = function () {
			if ($controller.$api) {
				var apiArgs = {item: dataItem};
				if (angular.isFunction($controller.config.deleteExtendApiArgs)) apiArgs = $controller.config.deleteExtendApiArgs(apiArgs);
				else if (angular.isFunction($controller.config.deleteApiArgs)) apiArgs = $controller.config.deleteApiArgs(apiArgs);
				$controller.$api.deleteAction(dataItem[$controller.$api.config.idField], apiArgs)
					.then(function (response) {
						if (response && response.status) {
							$controller.dataItemRemove(dataItem, true);
							//$controller.$notify.success($controller.$template.getMessage("common", "deleteDone!"));
						}
						if ($controller.config.deleteCallback) $controller.config.deleteCallback(response);
						if (callback) callback(response);
						if (response && response.loader) response.loader.remove();
					});
			} else {
				$controller.dataItemRemove(dataItem, true, function () {
					if (callback) callback();
					if ($controller.config.deleteCallback) $controller.config.deleteCallback(dataItem);
				});
				if (!ngDialog && $controller.$dropdowns.delete.close) $controller.$dropdowns.delete.close();
			}
		};
		if (!ngDialog && this.$dropdowns.delete) deleteFromServer();
		else {
			let message = this.setConfirmDeleteMessage(dataItem);
			this.openConfirm($controller.$template.getMessage("common", "confirmAction"), message, deleteFromServer);
		}
	}

	applyOrderToChanges(removeSpinner) {
		var dataItem = this.currentItem;
		this.hasChanges = false;
		let self = this;
		if (this.$api) this.loadData(this, false, function () {
			if (dataItem) dataItem = self.$dataSource.findDataItemById(dataItem);
			if (dataItem) self.goToDataItem(dataItem);
			if (removeSpinner) removeSpinner();
		});
		else {
			this.datasourceChanged(false, dataItem);
			if (removeSpinner) removeSpinner();
		}
	}

	validate(dataItem) {
		// this.debug.log("validate item", dataItem);
		if (this.config.validate) return this.config.validate(dataItem);
		if (!this.validateEachField(dataItem)) {
			return false;
		} else return true;
	}


	validateEachField(dataItem) {
		var hasError = false;
		for (var fieldName in this.columnsWithErrorMsg) {
			if (fieldName.startsWith("$")) continue;
			if (!this.validateField(fieldName, dataItem)) hasError = true;
		}
		return !hasError;
	}

	currentTrAddSaving(dataItem) {
		if (this.$api) {
			this.currentTr.addClass("saved");
			let gutterIcons = this.currentTr.find("td[view-type=gutter-icons]>div");
			if (gutterIcons) {
				let iSave = createElement("i", {class: "fa fa-save"});
				gutterIcons.html(iSave.outerHTML);
			}
		}
		this.dataItemSetAttr(dataItem, 'status', 'dirty');
		this.dataItemSetAttr(dataItem, 'changed', true);
		this.hasChanges = true;
	}

	currentTrRemoveSaving(dataItem, removeEditing, currentTr) {
		if (this.$api && currentTr) {
			currentTr.removeClass("saved");
			let gutterIcons = currentTr.find("td[view-type=gutter-icons]>div");
			if (gutterIcons) gutterIcons.html("");
		}
		this.dataItemSetAttr(dataItem, 'status', '');
		if (removeEditing) this.dataItemSetAttr(dataItem, 'editing', false);
		this.setCurrentTrErrors(dataItem);
	}

	setCurrentTrErrors(dataItem) {
		let errors = this.dataItemGetAttr(dataItem, 'errors');
		if (errors) {
			this.dataItemSetAttr(dataItem, 'status', 'error');
			this.currentTr.addClass("error");
		}

	}

	getCurrentAllTr(index) {
		let tables = this.getNavigableTables();
		return angular.element(tables).find("tr[index=" + index + "]");
	}

	save(dataItem, saveCallback, force) {
		if (dataItem.isGroupItem) return saveCallback ? saveCallback() : true;
		if (this.attrs.editRow === "inline" && !this.inlineEditing) return false;
		if (this.attrs.editRow === "inline-cell" && this.attrs.parentConfig) return saveCallback ? saveCallback() : true;
		var status = this.dataItemGetAttr(dataItem, 'status');
		if (status === 'dirty') return false;
		this.debug.log("save data", angular.copy(dataItem), "status", status);
		let index = this.dataItemGetIndex(dataItem, 'visibleItems');
		this.currentTr = this.getCurrentAllTr(index);

		var $controller = this;
		var editField = false;
		if (this.attrs.editRow === "inline-cell" && !force) {
			let clone = this.getClone(dataItem);
			if (clone) {
				var editing = false;
				for (var fieldName in dataItem) {
					if (dataItem.hasOwnProperty(fieldName)) {
						if (fieldName.startsWith("$")) continue;
						if (dataItem[fieldName] && typeof dataItem[fieldName].getTime === 'function') {
							if (clone[fieldName] && typeof clone[fieldName].getTime === 'function' && clone[fieldName].getTime() === dataItem[fieldName].getTime()) continue;
						} else if (clone[fieldName] === dataItem[fieldName]) continue;
						//this.debug.log("Modificari", fieldName, "Original:", clone[fieldName], "current", dataItem[fieldName], 'status', status);
						if (status === "dirty") {
							dataItem[fieldName] = clone[fieldName];
						}
						else editing = true;
						editField = fieldName;
						break;
					}
				}
				if (!editing && !this.inlineEditing) {
					//this.debug.log("nu am modificari");
					$controller.dontChangeFocus = false;

					return saveCallback ? saveCallback() : true;
				}


				if (editField && this.attrs.editRow === "inline-cell" && !$controller.$validateField(editField, dataItem, true)) {
					this.setCurrentTrErrors(this.currentTr, dataItem);
					$controller.dontChangeFocus = false;
					return false;
				}
			} else {
				this.debug.log("no clone");
				$controller.dontChangeFocus = false;
				return saveCallback ? saveCallback() : true;
			}
		} else {
			if (this.config.dataAdapter) this.config.dataAdapter.parseItem(dataItem);
		}

		this.clearErrors(dataItem);
		if (!$controller.validate(dataItem)) {
			var msg = $controller.$template.getMessage("common", "saveOperationNotFinished");
			$controller.addGlobalError("", msg, dataItem);
			$controller.currentTr.addClass("error");
			if ($controller.attrs.editRow !== "inline-cell") {
				$controller.$notify.error($controller.$template.getMessage("common", "dataNotMeetingValidationCriteria"));
				$controller.$timeout(function () {
					$controller.focusToFirstError();
				}, 300);

			}
			return false;
		}
		this.currentTrAddSaving(dataItem);
		var isNewRecord = this.isNewRecord(dataItem);
		let currentTr = this.currentTr;
		var savedCallback = function (dataItem, currentTr, response) {
			//this.debug.log("success saved callback -----------", dataItem);
			$controller.datasourceUpdate(dataItem, !["inline", "inline-cell"].includes($controller.attrs.editRow) && isNewRecord ? 1 : 0, false);

			if ($controller.attrs.editRow !== "editor") $controller.createClone(dataItem, true);
			if ($controller.attrs.editRow === "inline-cell") {
				$controller.$timeout(function () {
					$controller.currentTrRemoveSaving(dataItem, true, currentTr);
					//$controller.refreshViewItem(dataItem);
					currentTr = $controller.currentTrElement;
					$controller.$timeout(function () {
						//this.debug.log("focus to", $controller.movedToColumn > -1 ? $controller.movedToColumn : $controller.currentColumnIndex);
						$controller.focusToColumn(currentTr, $controller.currentColumnIndex);
						if (angular.isFunction($controller.config.afterSuccessSave)) $controller.config.afterSuccessSave(response);
						if (angular.isFunction(saveCallback)) saveCallback($controller, response);
					});
					$controller.dontChangeFocus = false;
				}, 200, false);
			} else {
				$controller.setToReadOnly();
				$controller.currentTrRemoveSaving(dataItem, true, currentTr);
				$controller.refreshViewItem(dataItem, true);
				//$controller.changeTrTemplate();
				//$controller.goToRow($controller.currentRowIndex);
				if (angular.isFunction($controller.config.afterSuccessSave)) $controller.config.afterSuccessSave(response);
				// if (angular.isFunction(saveCallback)) saveCallback($controller, response);
			}

		};
		if (!this.$api) return savedCallback(dataItem, currentTr);
		//execute save api method
		var apiArgs = {children: this.childrenGetDatasources()};
		//this.debug.log(apiArgs);
		if (angular.isFunction($controller.config.saveExtendApiArgs)) apiArgs = angular.extend(apiArgs, $controller.config.saveExtendApiArgs(dataItem));
		else if (angular.isFunction($controller.config.saveApiArgs)) apiArgs = angular.extend(apiArgs, $controller.config.saveApiArgs(dataItem));
		var loaderSelector = $controller.attrs.editRow === "inline-cell" ? 'no' : this.getDomElement();
		// var isNewRecord = this.$api.isNewRecord(dataItem) && !$controller.attrs.editRow.startsWith("inline");
		var uid = dataItem.$$uid;
		this.$api.saveAction(dataItem, apiArgs, "no")
			.then(function (response) {
				if (response && response.status) {
					response.data.$$uid = uid;
					angular.extend(dataItem, response.data);
					savedCallback(dataItem, currentTr, response);
					//if (["editor"].includes($controller.attrs.editRow))
					//$controller.$notify.success($controller.$template.getMessage("common", "saveSuccessful"));
					if (response && response.loader) response.loader.remove();
					return;
				} else if (response && response.errors) {
					if (response.message) response.errors[""] = [response.message];
					$controller.extractErrors(response.errors, dataItem);
					$controller.showGlobalErrorMessages(dataItem);
					$controller.currentTrRemoveSaving(dataItem, false, currentTr);
					if ($controller.attrs.editRow === "inline")
						$controller.$timeout(function () {
							$controller.focusToFirstError();
						}, 300);
				} else $controller.currentTrRemoveSaving(dataItem, false, currentTr);

				if (angular.isFunction(saveCallback)) saveCallback($controller, response);
				if (angular.isFunction($controller.config.saveCallback)) $controller.config.saveCallback($controller, response);
				if (response && response.loader) response.loader.remove();
			});
		return true;
	}

	rightVisiblePosition() {
		var tableScroller = this.getDomElement('>ax-table-content>[role=table-scroller]');
		var visibleWidth = tableScroller.width() - 20;
		var tableWidth = tableScroller.find('table').width();
		var scrollLeft = this.scrollLeft || 0;
		var right = tableWidth - visibleWidth - scrollLeft;
		return right;
	}

	autoHeight() {
		var scroller = this.getDomElement('>ax-table-content>[role=table-scroller]');
		if (scroller.css('border') !== 'none') scroller.css('border', 'none');
		return scroller.height() + 'px';
	}

	filtersToggleShow() {
		this.showFilters = !this.showFilters;
		this.scrollerHeightChanged();
	}

	groupToggleLevel(level, type, callback) {
		let $controller = this;
		this.timeStamp(true, "group toggle");
		let collapsed = type === 2 ? false : true;
		let groupsLevels = this.getCollection("groupsLevels");
		if (collapsed) {
			if (level + 1 === this.groups.defs.length) {
				$controller.$dataSource.groupCollapseLevels(level, true);
			} else
				groupsLevels.each(function (groups, i) {
					if (i < level) return true;
					$controller.$dataSource.groupCollapseLevels(i, i === level);
				});
		} else {
			if (level + 1 === this.groups.defs.length) {
				$controller.$dataSource.groupExpandLastLevels();
			} else
				groupsLevels.each(function (groups, i) {
					if (i > level + 1) return false;
					$controller.$dataSource.groupExpandLevels(i, level);
					// groups.each(function (group, index) {
					//     if (group.collapsed != collapsed) {
					//         this.$dataSource.groupSetAttr(group, "collapsed", !collapsed);
					//         this.groupToggleShow(group, true);
					//     }
					// }, this);
				}, this);
		}

		$controller.$dataSource.updateVisibleList();
		if ($controller.attrs.pageSize === "ALL")
			$controller.setVirtualScrollPosition($controller.calculateScrollTop(1), true, 1, true);
		else $controller.paginateApply();
		if (callback) callback();
		this.timeStamp(false, "group toggle", "group " + (collapsed ? "collapse" : "expand") + " level " + level);
	}

	groupToggleShow(group, allLevels) {

		var collapsed = !this.$dataSource.groupGetAttr(group, "collapsed");
		var globalGroup = this.$dataSource.getGroupByFullValue(group.fullValue);
		if (globalGroup) globalGroup.collapsed = collapsed;
		this.$dataSource.groupSetAttr(group, "collapsed", collapsed);
		var $controller = this;
		if (collapsed) $controller.$dataSource.groupCollapsed(group, allLevels);
		else $controller.$dataSource.groupExpanded(group, allLevels);
		if (!allLevels)
			this.$timeout(function () {
				if ($controller.attrs.pageSize === "ALL")
					$controller.setVirtualScrollPosition($controller.calculateScrollTop($controller.$paginator.fromIndex), true, 1, true);
				else $controller.paginateApply();
			});
	}


	tableToggleMaximize() {
		if (this.config && angular.isFunction(this.config.tableToggleMaximize)) return this.config.tableToggleMaximize();
		let $controller = this;
		$controller.maximized = !$controller.maximized;

		var element = $controller.getDomElement();
		if ($controller.$$grid) element = element.closest("ax-grid");
		if ($controller.maximized) {
			$controller.parentSyle = element.parent()[0].style.cssText;
			$controller.normalStyle = element[0].style.cssText;
			element.parent()[0].style.overflow = "hidden";
			element.parent().scrollTop(0);
			element.css({position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, 'z-index': 100, width: 'initial', height: 'initial', margin: 0});
		} else {
			element[0].style.cssText = $controller.normalStyle;
			element.parent()[0].style = $controller.parentSyle;
		}
		$controller.$layout.set.widthChanged();
	}

	loadDataApiArgs() {
		if (this.config.loadDataApiArgs) return (angular.isFunction(this.config.loadDataApiArgs) ? this.config.loadDataApiArgs() : this.config.loadDataApiArgs);
		else if (this.config.loadDataExtendApiArgs) return (angular.isFunction(this.config.loadDataExtendApiArgs) ? this.config.loadDataExtendApiArgs() : this.config.loadDataExtendApiArgs);
		else return {};
	}

	loadData($controller, removeSpinner, callback) {
		$controller = $controller || this;
		$controller.dataLoaded = false;
		if ($controller.loadDataPrepare) $controller.loadDataPrepare();
		var apiArgs = $controller.loadDataApiArgs();
		apiArgs = angular.extend(apiArgs, {metadata: true});
		if (removeSpinner) apiArgs.removeSpinner = removeSpinner;
		$controller.removeAllTrsFocus();
		if ($controller.config.loadData) return $controller.config.loadData($controller, removeSpinner, callback);
		var actionName = $controller.attrs.apiLoadDataAction;
		let $api = $controller.$childApi || $controller.$api;
		if (!$api) return;
		$api[actionName](apiArgs, removeSpinner || this.attrs.showLoader === "false" ? "no" : "")
			.then(function (response) {
				$controller.debug.log("loadData response", $controller.attrs.config, $controller);
				if (!$controller || $controller.$destroying) return;
				if (response && response.status) {
					if ($controller.columns.metadata) ;
					else if (response.columns) $controller.columns.metadata = response.columns;
					else {
						if ($controller.$dataStore.metadata[$api.controller])
							$controller.columns.metadata = $controller.$dataStore.metadata[$api.controller].columns;
					}

					if ($controller.attrs.paginate === 'server') $controller.generateServerPagination(response.data, $controller);

					if ($controller.attrs.loadDataResponses) {
						let responses = $controller.attrs.loadDataResponses.split(";");
						for (let i = 0; i < responses.length; i++) {
							if (responses[i] === "") continue;
							let obj = responses[i].split("=>");
							let serverResponse = obj[0];
							//this.debug.log("server response", responses, response);
							var scopeContainer = obj[1];
							try {
								if (scopeContainer === "")
									eval("$controller.$parent." + serverResponse + "= response." + serverResponse + ";"); // jshint ignore:line
								else
									eval("$controller.$parent." + scopeContainer + "= response." + serverResponse + ";"); // jshint ignore:line
							} catch (exception) {
								console.error("load-data-responses error for: " + responses[i], obj[0], obj[1]);
								console.error(exception);
							}
						}
					}
					let dataItems = [];
					if (angular.isArray(response.data)) dataItems = response.data;
					else if (response.data && response.data.items && angular.isArray(response.data.items)) dataItems = response.data;
					else console.error("No data items in response. Expected data as response.data or response.data.items array like object");
					if ($controller.config.dataAdapter) {
						dataItems = $controller.config.dataAdapter.parseCollection(dataItems);
					}
					$controller.datasourceSet(dataItems);

					if ($controller.loadDataCallback) $controller.loadDataCallback(response);
					if (response && response.loader) response.loader.remove();
					if (removeSpinner) removeSpinner();
					if (callback) callback();

				}

			});
	}

	prepareForm(title, readOnly, dataItem, $controller, extra) {
		var params = {
			dataItem: dataItem,
			title: title,
			readOnly: readOnly,
			table: $controller,
			$api: $controller.$api
		};
		angular.extend(params, extra);
		if (this.prepareFormCallback) this.prepareFormCallback(params);
		return params;

	}

	openConfirm(title, text, yesCallback, noCallback, appendTo) {
		var view = this;
		var scope = {
			message: text,
			title: title,
		};
		appendTo = appendTo || (this.$$grid.$$editor && this.$$grid.$$editor.opened ? this.element.linked.parent().find("ax-table-editor") : this.element.linked);
		this.$ngDialog.openConfirm({
			template: "/components/dependencies/ng-dialog/dialog-confirm.html",
			plain: false,
			className: 'ngdialog-theme-plain',
			appendTo: appendTo,
			trapFocus: true,
			scopeExtend: scope
		}).then(function () {
				yesCallback();
			},
			function () {
				if (noCallback) noCallback();
			});
	}

	openDialog(title, readOnly, dataItem, template, $controller, width, params, appendTo) {
		params = this.prepareForm(title, readOnly, dataItem, $controller, params);
		appendTo = appendTo || (this.$$grid.$$editor && this.$$grid.$$editor.opened ? this.element.linked.find("ax-edit-popup") : this.element.linked);
		switch (this.attrs.loadFormType) {
			case "ng-dialog":
				params.popup = true;
				var config = {
					template: template,
					className: 'ngdialog-theme-plain',
					disableAnimation: false,
					appendTo: appendTo || this.element.linked,
					params: params,
					trapFocus: true,
					scope: this.$parent
				};
				if (width) config.width = width;
				this.$ngDialog.open(config);
				break;
			default:
				console.error("The data-table attribute 'load-form-type' can have only values: 'ng-dialog'!");
		}
	}

	closeDialog() {
		switch (this.attrs.loadFormType) {
			case "ng-dialog":
				this.$ngDialog.close();
				break;
			case "ax-popup":
				this.popup.close();
				break;
		}
	}

	scrollerHeightChanged() {
		this.$timeout(this.$layout.set.heightChanged);
	}

	checkRowVisibility(tr, isLastPage) {
		tr = angular.element(tr);
		if (tr.height() === 0) return false;
		//var height = tr.position().top + (isLastPage ? tr.height() : 0);
		var height = tr.position().top + tr.height();
		var isVisible = (height < this.$layout.scroller.visibleHeight());
		//this.debug.log(tr.position().top, height, this.$layout.scroller.visibleHeight(), isVisible);
		if (isVisible) tr.removeClass("isNotVisibile");
		else tr.addClass("isNotVisible");
		return isVisible;
	}

	checkDataItemVisibility(dataItem) {
		if (this.attrs.pageSize !== 'ALL') return true;
		var tr = this.getDomElement('>ax-table-content>[role=table-scroller] tr[uid=' + dataItem.$$uid + "]");
		var height = tr.position().top + tr.height();
		var isVisible = (height < this.$layout.scroller.visibleHeight());
		if (isVisible) tr.removeClass("isNotVisibile");
		else tr.addClass("isNotVisible");
		return isVisible;
	}

	getPageSize() {
		if (this.attrs.pageSize !== 'ALL') return parseInt(this.attrs.pageSize);
		if (!this.$layout) return 0;
		var pageSize = Math.floor((this.$layout.scroller.visibleHeight() - (this.$layout.attrs.hasFixedHeader ? 0 : this.$layout.header.height())) / this.attrs.rowDataHeight);
		//var pageSize = Math.floor(this.$layout.scroller.visibleHeight() / this.attrs.rowDataHeight);
		// this.debug.log('pagesize', pageSize, this.$layout.scroller.visibleHeight(), this.attrs.rowDataHeight);
		return isNaN(pageSize) ? 0 : pageSize;
	}

	getVisibleRecords() {
		if (this.attrs.pageSize !== 'ALL') return parseInt(this.attrs.pageSize);
		if (!this.$layout) return 0;
		var pageSize = Math.ceil((this.$layout.scroller.visibleHeight() - (this.$layout.attrs.hasFixedHeader ? 0 : this.$layout.header.height())) / this.attrs.rowDataHeight);
		// this.debug.log("visibiles records", pageSize);
		return pageSize;
	}

	generateClientPagination() {
		var $controller = this;
		if (this.attrs.paginate === "false") return;
		var pageSize = this.getPageSize();
		let fromIndex = (this.currentPage - 1) * pageSize + 1;
		var clientPaginator = {
			currentPage: this.currentPage,
			perPage: pageSize,
			fromIndex: fromIndex,
			toIndex: fromIndex + this.getVisibleRecords() - 1,
			totalEntries: this.getCollection('filtered').length,
		};
		Object.defineProperty(clientPaginator, "lastVisibleIndex", {
			get() {
				return $controller.$dataSource.getLastVisibleItemIndex();
			}
		});
		clientPaginator.startPage = 1;
		clientPaginator.generatePages = function () {
			//this.debug.log('generate pages');
			if ($controller.attrs.pageSize === 'ALL') {
				clientPaginator.pages = [];
				clientPaginator.perPage = $controller.getPageSize();
				$controller.createVirtualTable();
				return;
			} else {
				clientPaginator = this;
				clientPaginator.currentPage = $controller.currentPage;
				clientPaginator.perPage = parseInt($controller.attrs.pageSize);
				clientPaginator.fromIndex = ($controller.currentPage - 1) * clientPaginator.perPage + 1;
				clientPaginator.toIndex = $controller.calculateToIndex(clientPaginator.fromIndex);
				clientPaginator.totalEntries = $controller.getCollection('filtered').length;
				clientPaginator.lastPage = Math.floor($controller.$dataSource.collections.visibleItems.length / clientPaginator.perPage) +
					(($controller.$dataSource.collections.visibleItems.length % clientPaginator.perPage) === 0 ? 0 : 1);
				clientPaginator.pages = [];
				if (clientPaginator.lastPage > 0) clientPaginator.pages.push({text: 1, value: 1});
				if ($controller.element.type === 'table') {

					if (clientPaginator.currentPage < 5) {
						for (let i = 2; i <= Math.min(8, clientPaginator.lastPage - 1); i++) {
							clientPaginator.pages.push({text: i, value: i});
						}
						if (clientPaginator.lastPage > 8 && clientPaginator.currentPage) {
							clientPaginator.pages.push({text: "..", value: -1});
						}
					} else if (clientPaginator.currentPage + 6 > clientPaginator.lastPage) {
						if (clientPaginator.lastPage > 9 && clientPaginator.currentPage) clientPaginator.pages.push({text: "..", value: -1});
						for (let i = Math.max(2, clientPaginator.lastPage - 7); i < clientPaginator.lastPage; i++) {
							clientPaginator.pages.push({text: i, value: i});
						}
					} else if (clientPaginator.currentPage) {
						clientPaginator.pages.push({text: "..", value: -1});
						for (let i = clientPaginator.currentPage - 2; i < clientPaginator.currentPage + 4; i++) {
							clientPaginator.pages.push({text: i, value: i});
						}
						clientPaginator.pages.push({text: "..", value: -1});
					}
				}
				if (clientPaginator.lastPage > 1) clientPaginator.pages.push({text: clientPaginator.lastPage, value: clientPaginator.lastPage});
			}
		};
		clientPaginator.generatePages();
		clientPaginator.goToPage = function (page, index, visibleIndex, goToRow) {
			goToRow = goToRow === undefined ? true : goToRow;
			if ($controller.attrs.pageSize === 'ALL') {
				var totalRecords = $controller.$dataSource.getCollection("items").length;
				var pageSize = $controller.getPageSize();
				$controller.$paginator.fromIndex = angular.isDefined(index) ? index + 1 : (page - 1) * pageSize + 1;
				var data = $controller.getCollection("items");
				var firstIndex, lastIndex;
				var showItems = 0;
				for (let i = totalRecords; i > 0; i--) {
					let dataItem = data[i - 1];
					let hidden = $controller.dataItemGetAttr(dataItem, "hidden");
					if (hidden) continue;
					if (!lastIndex) lastIndex = i;
					showItems++;
					if (showItems === pageSize) {
						firstIndex = i;
						break;
					}
				}
				if (index >= firstIndex) $controller.$paginator.fromIndex = firstIndex;
				$controller.currentPage = page;
				$controller.currentRowIndex = angular.isDefined(index) ? index : $controller.$paginator.fromIndex - 1;
			} else {
				if (page < 1 || page > this.lastPage) return;
				$controller.$paginator.fromIndex = (page - 1) * clientPaginator.perPage + 1;
				$controller.$paginator.toIndex = $controller.$paginator.fromIndex + $controller.getVisibleRecords();
				$controller.currentPage = page;
				$controller.currentRowIndex = angular.isDefined(index) ? index : $controller.$paginator.fromIndex - 1;
				$controller.$paginator.currentPage = page;
			}
			if ($controller.attrs.pageSize === "ALL") $controller.setVirtualScrollPosition($controller.calculateScrollTop($controller.$paginator.fromIndex), goToRow, visibleIndex, true);
			else $controller.paginateApply(false, goToRow, false, false, false, visibleIndex);
		};
		clientPaginator.goToFirstPage = function (index) {
			if ($controller.inlineEditing) return;
			var pageSize = $controller.getPageSize();
			$controller.$paginator.fromIndex = 1;
			$controller.$paginator.toIndex = $controller.getVisibleRecords();
			$controller.currentRowIndex = angular.isDefined(index) ? index : 0;
			if ($controller.attrs.pageSize === "ALL") $controller.setVirtualScrollPosition($controller.calculateScrollTop($controller.$paginator.fromIndex), true, 2, true);
			else this.goToPage(1, 0);
		};
		clientPaginator.goToLastPage = function (index) {
			if ($controller.inlineEditing) return;
			var totalRecords = $controller.$dataSource.getCollection("visibleItems").length;
			let pageSize = $controller.getPageSize();
			$controller.$paginator.toIndex = totalRecords;
			$controller.$paginator.fromIndex = Math.max(0, $controller.$paginator.toIndex - pageSize + 1);
			$controller.currentRowIndex = angular.isDefined(index) ? index : $controller.$paginator.toIndex - 1;
			if ($controller.attrs.pageSize === "ALL") {
				if ($controller.$paginator.toIndex === totalRecords) $controller.$paginator.fromIndex = Math.max(1, $controller.$paginator.toIndex - pageSize + 1);
				$controller.setVirtualScrollPosition($controller.calculateScrollTop($controller.$paginator.fromIndex), true, 1, true);
			}
			else this.goToPage(this.lastPage, totalRecords - 1);

		};
		clientPaginator.goToPreviousPage = function (index) {
			if ($controller.inlineEditing) return;
			var pageSize = $controller.getPageSize();
			var totalRecords = $controller.$dataSource.getCollection("visibleItems").length;
			if ($controller.$paginator.fromIndex === 1) {
				$controller.goToRow(-1);
				return;
			} else if ($controller.attrs.pageSize === 'ALL') {
				if ($controller.$paginator.fromIndex - pageSize > 1) {
					$controller.$paginator.toIndex = $controller.$paginator.fromIndex - 1;
					$controller.$paginator.fromIndex = $controller.$paginator.toIndex - pageSize + 1;
				} else {
					$controller.$paginator.fromIndex = 1;
					$controller.$paginator.toIndex = Math.min(totalRecords, $controller.getVisibleRecords());
				}
				//$controller.$paginator.toIndex = $controller.$paginator.fromIndex - 1;
				//var data = $controller.getCollection("visibleItems");
				//var firstIndex, lastIndex;
				//var showItems = 0;
				//for (let i = $controller.$paginator.toIndex ; i > 0; i--) {
				//	let dataItem = data[i - 1];
				//	let hidden = $controller.dataItemGetAttr(dataItem, "hidden");
				//	if (hidden) continue;
				//	if (!lastIndex) lastIndex = i;
				//	showItems++;
				//	if (showItems === pageSize) {
				//		firstIndex = i ;
				//		break;
				//	}
				//}
				//$controller.$paginator.fromIndex = firstIndex;

				$controller.currentRowIndex = angular.isDefined(index) ? index : ($controller.$paginator.fromIndex === 1 ? 0 : $controller.$paginator.toIndex - 1);
				if ($controller.attrs.pageSize === "ALL") $controller.setVirtualScrollPosition($controller.calculateScrollTop($controller.$paginator.fromIndex), true, 2, true);
				else $controller.paginateApply(false, true, false, false, false, 2);
			} else {
				index = index || $controller.$paginator.fromIndex - 2;
				this.goToPage(Math.max(1, this.currentPage - 1), index);
			}
		};
		clientPaginator.goToNextPage = function (index, columnIndex) {
			if ($controller.inlineEditing) return;
			var pageSize = $controller.getPageSize();
			var totalRecords = $controller.$dataSource.getCollection("visibleItems").length;
			if ($controller.$paginator.toIndex >= totalRecords) {
				clientPaginator.goToLastPage();
				return;
			} else if ($controller.attrs.pageSize === 'ALL') {
				if ($controller.hasPartialViewedRecordItem()) $controller.$paginator.toIndex--;
				if ($controller.$paginator.toIndex + 1 + pageSize <= totalRecords) {
					$controller.$paginator.fromIndex = $controller.$paginator.toIndex + 1;
					$controller.$paginator.toIndex = Math.min(totalRecords, $controller.$paginator.fromIndex + $controller.getVisibleRecords());
				} else {
					$controller.$paginator.toIndex = totalRecords;
					$controller.$paginator.fromIndex = Math.max(1, $controller.$paginator.toIndex - $controller.getVisibleRecords() + 1);
				}
				if ($controller.$paginator.toIndex === totalRecords) $controller.$paginator.fromIndex = $controller.$paginator.toIndex - pageSize + 1;
				$controller.currentRowIndex = angular.isDefined(index) ? index : ($controller.$paginator.toIndex === totalRecords ? totalRecords - 1 : $controller.$paginator.fromIndex - 1);
				if ($controller.attrs.pageSize === "ALL") $controller.setVirtualScrollPosition($controller.calculateScrollTop($controller.$paginator.fromIndex), true, 1, true);
				else $controller.paginateApply(false, true, false, false, false, 1);
			} else this.goToPage(this.currentPage + 1, index);
		};
		this.$paginator = clientPaginator;
		if (this._show) this.$timeout(this.$layout.set.heightChanged);
	}

	generateServerPagination(response, $controller) {
		response = angular.copy(response);
		if (!angular.isDefined(response.current_page) ||
			!angular.isDefined(response.per_page) ||
			!angular.isDefined(response.from_index) ||
			!angular.isDefined(response.to_index) ||
			!angular.isDefined(response.total_entries)) {
			this.datasourceSet(response.items);
			return;
		}
		var serverPaginator = {
			currentPage: response.current_page,
			perPage: response.per_page,
			fromIndex: response.from_index,
			toIndex: response.to_index,
			totalEntries: response.total_entries
		};
		serverPaginator.startPage = 1;
		serverPaginator.lastPage = Math.floor(serverPaginator.totalEntries / serverPaginator.perPage) +
			((serverPaginator.totalEntries % serverPaginator.perPage) === 0 ? 0 : 1);
		serverPaginator.pages = [];
		if (serverPaginator.lastPage > 0) serverPaginator.pages.push({text: 1, value: 1});
		// this.debug.log("paginator", paginator);
		if ($controller.element.type === 'table') {
			if (serverPaginator.currentPage < 5) {
				for (let i = 2; i <= Math.min(8, serverPaginator.lastPage - 1); i++) {
					serverPaginator.pages.push({text: i, value: i});
				}
				if (serverPaginator.lastPage > 8) {
					serverPaginator.pages.push({text: "..", value: -1});
				}
			} else if (serverPaginator.currentPage + 6 > serverPaginator.lastPage) {
				if (serverPaginator.lastPage > 9) serverPaginator.pages.push({text: "..", value: -1});
				for (let i = Math.max(2, serverPaginator.lastPage - 7); i < serverPaginator.lastPage; i++) {
					serverPaginator.pages.push({text: i, value: i});
				}
			} else {
				serverPaginator.pages.push({text: "..", value: -1});
				for (var i = serverPaginator.currentPage - 2; i < serverPaginator.currentPage + 4; i++) {
					serverPaginator.pages.push({text: i, value: i});
				}
				serverPaginator.pages.push({text: "..", value: -1});
			}
		}
		if (serverPaginator.lastPage > 1) serverPaginator.pages.push({text: serverPaginator.lastPage, value: serverPaginator.lastPage});
		// this.debug.log("pagini:", paginator);
		serverPaginator.goToPage = function (page) {
			if (page < 1 || page > this.lastPage) return;
			var apiArgs = $controller.loadDataApiArgs();
			apiArgs.page = page;
			$controller.config.loadDataApiArgs = function () {
				return apiArgs;
			};
			$controller.loadData();

		};
		serverPaginator.goToPreviousPage = function () {
			this.goToPage(this.currentPage - 1);
		};
		serverPaginator.goToNextPage = function () {
			this.goToPage(this.currentPage + 1);
		};
		serverPaginator.goToLastPage = function () {
			this.goToPage(this.lastPage);
		};
		this.$paginator = serverPaginator;
		this.datasourceSet(response.items);
	}

	updateViewItems(from, to) {
		this.$paginator.fromIndex = from;
		this.$paginator.toIndex = to;
		this.$paginator.text = this.$template.getMessage('pagination', 'fromPage') +
			": " +
			this.$paginator.fromIndex +
			" " +
			this.$template.getMessage('pagination', 'toPage') +
			" " +
			Math.min(this.$paginator.toIndex, this.$paginator.totalEntries) +
			" " + this.$template.getMessage('pagination', 'of') + " " +
			this.$paginator.totalEntries;
	}

	refreshPaginatorInfo(reset, virtualScroll) {
		if (this.attrs.paginate === 'false') {
			this.$dataSource.setViewItems({fromIndex: 1});
			return;
		}
		if (this.attrs.paginate === 'client') {
			if (!this.$paginator) this.generateClientPagination();
			this.$paginator.totalEntries = this.getCollection('filtered').length;
			if (reset || isNaN(parseInt(this.$paginator.fromIndex))) {
				this.currentPage = 1;
				this.$paginator.fromIndex = (this.getCollection('visibleItems').length ? 1 : 0);
				this.$paginator.toIndex = Math.min(this.getCollection('visibleItems').length, this.$paginator.fromIndex + this.getVisibleRecords() - 1);
			}
			if (reset || this.attrs.pageSize === 'ALL') this.$paginator.toIndex = this.calculateToIndex(this.$paginator.fromIndex);
			if (reset || this.attrs.pageSize !== 'ALL') this.$paginator.generatePages();
			if (this.pivotTableShow) {
				this.$paginator.toIndex = 0;
				this.$paginator.fromIndex = 1;
			}
		}
		if (this.$paginator.totalEntries >= 0)
			if (true)
				this.$paginator.text = this.$template.getMessage('pagination', 'totalRecords') + ": " +
					this.$paginator.totalEntries.toLocaleString(axNumberFormat.locale);
			else
				this.$paginator.text = this.$template.getMessage('pagination', 'fromPage') +
					": " +
					this.$paginator.fromIndex +
					" " +
					this.$template.getMessage('pagination', 'toPage') +
					" " +
					this.$paginator.toIndex +
					" " + this.$template.getMessage('pagination', 'of') + " " +
					this.$paginator.totalEntries.toLocaleString();
		else this.$paginator.text = this.$template.getMessage('pagination', 'noRecords');
		var self = this;
		this.$dataSource.setViewItems({
			fromIndex: this.$paginator.fromIndex,
			toIndex: this.$paginator.toIndex,
			lastNavigableIndex: self.getPageSize(),
			limit: function () {
				return Math.min(self.getVisibleRecords(), self.$paginator.toIndex - self.$paginator.fromIndex + 1);
			}
		});
	}

	createClone(dataItem, overwrite) {
		//this.debug.log("CreateClone", dataItem);
		if (overwrite) this.$dataSource.dataItemSetClone(dataItem);
		else {
			let clone = this.getClone(dataItem);
			if (!clone) this.$dataSource.dataItemSetClone(dataItem);
		}
	}

	getClone(dataItem) {
		return this.$dataSource.dataItemGetClone(dataItem);
	}

	changeTableFocus() {
		let ctrlToFocus = null;
		if (this.children) {
			for (let child in this.children) {
				let ctrl = this.children[child];
				if (ctrl.childIndex === 1) {
					ctrlToFocus = ctrl;
					break;
				}
			}
		} else if (this.parentConfig) {
			for (let child in this.parentConfig.children) {
				let ctrl = this.parentConfig.children[child];
				if (ctrl.childIndex <= 1) continue;
				ctrlToFocus = ctrl;
				break;
			}
			if (!ctrlToFocus) ctrlToFocus = this.parentConfig.$ctrl;
		}
		if (ctrlToFocus) {
			//this.debug.log("change focus", ctrlToFocus);
			if (ctrlToFocus.attrs.editRow === "editor" && ctrlToFocus.$$grid.$$editor.opened) ctrlToFocus.$$grid.$$editor.form.$ctrl.trapFocus.autoFocus();
			else ctrlToFocus.goToRow(ctrlToFocus.currentRowIndex || 0);
		}
	}

	getChildren(callback) {
		if (!this.children) return;
		for (let child in this.children) {
			if (this.children[child].$destroying) return;
			callback.call(this.children[child]);
		}
	}

	getChild(childName) {
		if (!this.children) return;
		return this.children[childName];
	}

	childrenSetToEdit() {
		this.getChildren(function () {
			this.readOnly = false;
			if (this.attrs.editRow === "inline-cell" && !this.canEdit) this.canEdit = true;
		});
	}

	childrenSetToReadOnly() {
		this.getChildren(function () {
			if (this.attrs.editRow === "inline-cell" && this.canEdit) this.changeEdit();
			this.readOnly = true;
		});
	}

	$currentParentItemChanged(parentItem) {
		if (this.$destroying) return;
		this.parentItem = parentItem;
		let self = this;
		if (this.currentParentItemChanged) this.currentParentItemChanged();
		if (this.attrs.autoLoadData === "true" && this.parentItem) {
			this.loadData(this, false, function () {
				self.$timeout(function () {
					self.setCurrentItemToFirstItem();
				});
			});
		} else {
			self.$timeout(function () {
				self.setCurrentItemToFirstItem();
			});
		}
	}

	setCurrentItemToFirstItem() {
		let data = this.getCollection("filtered");
		if (data.length === 0) {
			this.currentItem = null;
			this.currentRowIndex = -1;
		}
		else {
			this.currentItem = data[0];
			let index = this.dataItemGetIndex(this.currentItem, "viewed");
			this.currentRowIndex = 0;
			if (index === undefined && this.$paginator) this.$paginator.goToPage(1, 0, false);
			//this.debug.log("currentItem", this.currentItem);
		}
	}

	setCurrentItem(dataItem) {
		this.currentItem = dataItem;
		let index = this.dataItemGetIndex(this.currentItem, "viewed");
		this.currentRowIndex = index;
	}

	childrenLoadData(parentItem) {
		this.getChildren(function () {
			let datasource = data && data[child.attrs.childName] ? data[child.attrs.childName] : [];
			this.datasourceSet(datasource);
		});
	}

	$childrenSetParentItem(parentItem) {
		this.getChildren(function () {
			this.$currentParentItemChanged(parentItem);
		});
	}

	childrenSetDatasources(data) {
		this.getChildren(function () {
			let datasource = data && data[child.attrs.childName] ? data[child.attrs.childName] : [];
			this.datasourceSet(datasource);
		});
	}

	childrenGetDatasources() {
		let childrenData = {};
		this.getChildren(function () {
			childrenData[this.attrs.childName] = this.datasourceGet();
		});
		if (this.config.getChildrenDatasources) childrenData = this.config.getChildrenDatasources(childrenData);
		return childrenData;
	}

	parentEditPopupCalculationUpdate(items) {
		this.$dataSource.calculations.update();
		let total = this.getCalculation("value");
		for (let i = 0; i < items.length; i++) {
			let item = items[i];
			let value = item.calculation ? this.getCalculation(item.calculation) : item.value;
			this.parentConfig.$ctrl.$$grid.$$editor.form.$ctrl.datasource[item.field] = value;
		}
		this.parentConfig.$ctrl.$$grid.$$editor.form.$ctrl.datasource.value = total;

	}

	setToEditMode(dataItem, callback, create) {
		var $controller = this;
		if (["inline", "editor"].includes(this.attrs.editRow)) this.inlineEditing = true;
		else if (["inline-cell"].includes(this.attrs.editRow)) this.canEdit = true;
		if (["editor"].includes(this.attrs.editRow)) {
			$controller.childrenSetToEdit();
			if (callback) callback();
		} else
			this.$timeout(function () {
				$controller.goToDataItem(dataItem, null, function () {
					$controller.childrenSetToEdit();
					if (callback) callback();
				});

			}, 0);
	}

	setToReadOnly() {
		if (["inline", "editor"].includes(this.attrs.editRow)) this.inlineEditing = false;
		else if (["inline-cell"].includes(this.attrs.editRow)) this.canEdit = false;
		this.childrenSetToReadOnly();
	}

	editRow(title, dataItem, create, readOnly) {
		var $controller = this;
		switch (this.attrs.editRow) {
			case "inline-cell":
				if (create) this.dataItemAdd(dataItem, true);
				this.createClone(create && this.$api ? {$$uid: dataItem.$$uid} : dataItem, true);
				this.setToEditMode(dataItem);
				break;
			case "inline":
				if (create) this.dataItemAdd(dataItem, true);
				this.createClone(create ? {$$uid: dataItem.$$uid} : dataItem, true);
				this.dataItemSetAttr(dataItem, 'editing', true);
				this.setToEditMode(dataItem);

				break;
			default:
				this.setToEditMode(dataItem, false, create);
				if (!create) this.$$grid.$$editor.open();
		}
	}

	refreshItem(dataItem) {
		var $controller = this;
		if (!dataItem[$controller.$api.config.idField]) return;
		$controller.remoteEditAction(dataItem,
			function (response) {
				if (!response) return;
				if (response.data) {
					response.data.$$uid = dataItem.$$uid;
					$controller.$dataSource.update(response.data);
					angular.extend(dataItem, response.data);
				}
			});
	}

	remoteEditAction(dataItem, callBack) {
		var apiArgs = {metadata: true};
		var dataItemId = dataItem && !dataItem.isGroupItem ? dataItem[this.$api.config.idField] : 0;
		if (this.config.editApiArgs) angular.extend(apiArgs, this.config.editApiArgs());
		else if (this.config.editExtendApiArgs) angular.extend(apiArgs, this.config.editExtendApiArgs());
		this.$api.editAction(dataItemId, apiArgs, "no").then(callBack);
	}

	/**
	 *
	 * @param title
	 * @param template
	 * @param dataItem
	 */
	openTemplate(title, template, dataItem, width) {
		var $controller = this;
		if ($controller.attrs.refreshItemOnEdit) {
			$controller.remoteEditAction(dataItem,
				function (response) {
					if (!response) return;
					if (response.data) {
						response.data.$$uid = dataItem.$$uid;
						$controller.refreshViewItem(dataItem);
						$controller.openDialog(title, false, response.data, template, $controller, width);
					}
					response.loader.remove();
				});
		} else $controller.openDialog(title, false, dataItem, template, $controller, width);
	}

	getItemValue(dataItem, fieldName) {
		return dataItem[fieldName];
	}


	$validateField(fieldName, dataItem, forced, $event) {
		//this.clearFieldError(dataItem, fieldName);
		if (dataItem.isGroupItem) return true;
		if (!this.inlineEditing && !this.canEdit) return false;
		this.debug.log("$validateField", arguments);
		this.clearFieldError(dataItem, fieldName);
		let error = this.currentFocusObject ? this.currentFocusObject.closest("td").find("[error-for]") : [];
		if (error.length > 0) {
			this.$timeout(function () {
				error.trigger("mouseleave");
			});
		}
		if (this.config.dataAdapter) dataItem = this.config.dataAdapter.parseItem(dataItem);


		if (this.columns && this.columns[fieldName]) {
			var attribs = this.columns[fieldName].attribs;
			var errorMessage;
			if ("Required" in attribs && (dataItem[fieldName] === null || dataItem[fieldName] === ""))
				errorMessage = fieldName + " field is required.";
			if ("MaxLength" in attribs && dataItem[fieldName] && dataItem[fieldName].length > attribs.MaxLength)
				errorMessage = fieldName + " field must have a maximum length of '" + attribs.MaxLength + "'.";
			if ("MinLength" in attribs && dataItem[fieldName] && dataItem[fieldName].length < attribs.MinLength)
				errorMessage = fieldName + " field must have a minimum length of '" + attribs.MinLength + "'.";
			if (errorMessage) {
				this.addFieldError(fieldName, errorMessage, dataItem);
				return true;
			}
		}
		var returnValue = this.validateField(fieldName, dataItem);
		if (!this.$api) this.$dataSource.calculations.update();
		// this.debug.log("$validateField - end", fieldName, dataItem);
		//this.debug.log("validate field result", returnValue);
		return returnValue;
	}

	validateField(fieldName, dataItem) {
		if (this.config.validateField) return this.config.validateField(fieldName, dataItem);
		else return true;
	}

	hideColumnByBindTo(bindTo, hide, compile) {
		let hiddenColumns = [];
		let column = this.columns.hideable.findObject(bindTo, "bindTo");
		if (!column || (column.hidden === hide)) return;

		this.changeColumnHiddenState(!hide, column);
		if (compile) {
			dropdownsStack.closePopupsFor(this.element.linked);
			this.render();
		} else column.hidden = hide;

	}

	changeColumnHiddenState(show, column) {
		let columnDef = this.element.initial.find(">ax-column[header='" + column.title + "']");
		if (columnDef.length === 0) console.error("Cannot hide column " + JSON.stringify(column));
		if (show && column.hidden) columnDef.removeAttribute("hidden-column");
		else if (!show && !column.hidden) columnDef.setAttribute("hidden-column", "");
		column.hidden = !show;
	}


	columnIsSortable(fieldName) {
		var groups = this.attrs.groupsOrderBy.split(',');
		return (groups.indexOf(fieldName) === -1);
	}

	setColumnSortableType(fieldName, operation, setClass) {
		var column = axUtils.findObject(this.columns.ordered, 'field', fieldName);
		if (!column && operation !== 'clear') {
			column = {field: fieldName, asc: true};
			this.columns.ordered.push(column);
		}
		switch (operation) {
			case "asc":
				column.asc = true;
				break;
			case "desc":
				column.asc = false;
				break;
			case "clear":
				var index = this.columns.ordered.indexOf(column);
				this.columns.ordered.splice(index, 1);
		}
		if (setClass) this.setColumnSortableClass(fieldName, operation);

	}

	getColumnOrder(fieldName) {
		var column = axUtils.findObject(this.columns.ordered, 'field', fieldName);
		if (!column) return 0;
		else return column.asc ? 1 : -1;
	}

	clearOrderBy() {
		var columns = angular.copy(this.columns.ordered);
		var sortableClasses = this.$template.config.sortableClasses;
		for (let i = 0; i < columns.length; i++) {
			let column = columns[i];
			this.setColumnSortableType(column.field, 'clear');
		}
	}

	setColumnSortableClass(field, operation, index) {
		var columnSortable = this.getDomElement('[sortable=\"' + field + '\"]  .column-sort');
		index = index || axUtils.findObjectIndex(this.columns.ordered, 'field', field);
		var sortableClasses = this.$template.config.sortableClasses;
		if (operation === "asc") columnSortable.removeClass(sortableClasses.sortABLE).removeClass(sortableClasses.sortDESC).addClass(sortableClasses.sortASC);
		else if (operation === "desc") columnSortable.removeClass(sortableClasses.sortABLE).removeClass(sortableClasses.sortASC).addClass(sortableClasses.sortDESC);
		else if (operation === "clear") columnSortable.removeClass(sortableClasses.sortDESC).removeClass(sortableClasses.sortASC);
		var column = columnSortable.parent();
		column.find('.sortable-index').remove();
		if (index > -1 && operation !== "clear") column.append('<div class="sortable-index" >' + (index + 1) + '</div>');
	}

	changeOrderBy() {
		var orderBy = [];
		for (let i = 0; i < this.columns.ordered.length; i++) {
			let column = this.columns.ordered[i];
			if (column.asc) orderBy.push(column.field);
			else orderBy.push('-' + column.field);
		}
		this.columns.orderBy = orderBy;
		this.setAttribute("order-by", orderBy.concat(','));
		this.debug.log("set order by", orderBy);
	}

	setOrderBy() {
		var orderBy = [];
		for (let i = 0; i < this.columns.ordered.length; i++) {
			let column = this.columns.ordered[i];
			if (column.asc) orderBy.push(column.field);
			else orderBy.push('-' + column.field);
			this.setColumnSortableClass(column.field, column.asc ? 'asc' : 'desc', i);
		}
		this.debug.log("orderBy", orderBy);
		this.columns.orderBy = orderBy;
	}

	computeOrderByAttribute(setOrder) {
		let template = this.$template;
		this.debug.log("order-by", setOrder, template.attributes["order-by"]);
		if ((template.attributes["order-by"] + template.attributes['groups-order-by']) === '') return [];
		var ordersBy = template.attributes['groups-order-by'] === "" ? [] : template.attributes['groups-order-by'].split(',');
		var orders = template.attributes['order-by'] === "" ? [] : template.attributes['order-by'].split(',');
		for (let i = 0; i < orders.length; i++) {
			let order = orders[i].trim();
			if (ordersBy.includes(order)) continue;
			ordersBy.push(order);
		}
		template.attributes["order-by"] = ordersBy.join(',');
		var columns = [];
		for (var i = 0; i < ordersBy.length; i++) {
			let item = ordersBy[i];
			if (item === '') continue;
			if (item.substr(0, 1) === "-") columns.push({field: item.substr(1), asc: false});
			else columns.push({field: item, asc: true});
		}
		this.columns.ordered = columns;
		var orderBy = [];
		for (let i = 0; i < this.columns.ordered.length; i++) {
			let column = this.columns.ordered[i];
			if (column.asc) orderBy.push(column.field);
			else orderBy.push('-' + column.field);
		}
		this.columns.orderBy = orderBy;
		this.debug.log("order-by", orderBy);
		if (setOrder) this.setOrderBy();
		return orderBy;
	}

	columnAutoFit(th, columnIndex) {
		this.$$virtualTest = true;
		var $controller = this;
		var columnDef = null;
		columnDef = angular.copy(this.columns.defs[columnIndex]);
		var table = createElement('table', {class: 'standard-theme'});
		table.style.cssText = 'table-layout:auto !important;width:auto !important';
		var thead = createElement('thead');
		var trh = createElement('tr', {role: "titles"});
		var thDefs = angular.element(columnDef).find('ax-column-header:not([colspan])');
		var th1 = new axTableColumnHeader(thDefs[0], this.$template);
		trh.appendChild(th1);
		thead.appendChild(trh);
		table.appendChild(thead);
		var tbody = createElement('tbody');
		var collection = (this.totalRecords.filtered() > 1000) ? "$parent.$ctrl.getCollection('viewed')" : "$parent.$ctrl.getCollection('initial')";
		var tr = createElement('tr', {role: "data-row", 'ng-repeat': "dataItem in " + collection});
		var td = new axTableColumn(columnDef, this);
		td.removeAttribute('ng-keydown');
		td.style.width = 'auto';
		tr.appendChild(td);
		tbody.appendChild(tr);
		table.appendChild(tbody);
		this.virtualHtml = table.outerHTML;
		//this.debug.log(this.virtualHtml);
		this.$timeout(function () {
			var container = $controller.getDomElement('[role=virtual-container] table');
			var width = container.width();
			$controller.columnSetWidth(th, width + 1);
			$controller.$$virtualTest = false;
		});
	}


	columnsAutoFitAll() {
		var $controller = this;
		$controller.$$virtualTest = true;
		var columnDef = null;
		var table = createElement('table', {class: 'standard-theme'});
		table.style.cssText = 'table-layout:auto !important;width:auto !important';
		var theadEl = angular.element($controller.$template.createHeader());
		theadEl.find('th, th>ax-dropdown-popup, th>ax-dropdown-popup>button').css('width', 'auto');
		theadEl.find('tr[role=filters]').remove();
		var thead = theadEl[0];
		createElement('tr', {role: "titles"});
		var tbody = createElement('tbody');
		var collection = ($controller.totalRecords.filtered() > 300) ? "$parent.$ctrl.getCollection('viewed')" : "$parent.$ctrl.getCollection('initial')";
		var tr = createElement('tr', {role: "data-row", 'ng-repeat': "dataItem in " + collection});
		angular.forEach($controller.columns.defs,
			function (column) {
				columnDef = angular.copy(column);
				if (columnDef.classList.contains('empty-column')) return;
				var td = new axTableColumn(columnDef, $controller, false);
				td.children[0].style.width = "auto";
				td.removeAttribute('ng-keydown');
				tr.appendChild(td);
			});

		table.appendChild(thead);
		tbody.appendChild(tr);
		table.appendChild(tbody);
		$controller.virtualHtml = table.outerHTML;
		$controller.$timeout(function () {
			var container = $controller.getDomElement('[role=virtual-container] table');
			var tds = container.find('tbody > tr:first-child').find('td');
			angular.forEach(tds,
				function (td) {
					if (td.style.width !== "100%") $controller.columnSetWidth(td, td.offsetWidth + 5);
				});
			$controller.$$virtualTest = false;
			$controller.$layout.set.global();
		});
	}

	forceRefreshBody() {
		this.showBody = 0;
		var self = this;
		this.$timeout(function () {
			self.showBody = 1;
		});
	}

	getCalculation(name) {
		var calculation = this.$dataSource.calculations.items[0];
		if (!calculation || !calculation[name]) return "";
		var value = calculation[name].result();
		return value;
	}

	getCollection(collectionName, length) {
		return this.$dataSource ? this.$dataSource.getCollection(collectionName, length) : (length ? 0 : []);
	}

	datasourceClear() {
		this.clearAllFilters();
		this.$dataSource.clear();
		this.datasource = [];
		this.dataLoaded = false;
	}

	changeEditRowMode(type) {
		if (type === this.attrs.editRow) return;
		// if (["inline", "inline-cell"].indexOf(type) === -1) return;
		this.setAttribute("edit-row", type);
		//this.setAttribute("apply-changes-on-save", type === "editor");
		dropdownsStack.closePopupsFor(this.element.linked);
		this.render();
	}

	refreshView(dataItem) {
		if (dataItem.isGroupItem) return false;
		else return this.dataItemGetAttr(dataItem, "refresh") !== true;
	}

	refreshViewItem(dataItem, goToDataItem) {
		// if (this.attrs.refreshItemOnSave !== "true") return;
		this.dataItemSetAttr(dataItem, "refresh", true);
		let self = this;
		this.$timeout(function () {
			self.dataItemSetAttr(dataItem, "refresh", false);
			if (goToDataItem) self.goToDataItem(dataItem);
		});
	}

	setAttribute(attr, value, compile) {
		let element = this.element.linked;
		let initial = element.attr(attr);
		if (value === null || value === undefined) throw "Attribute value cannot be null or undefined!";
		if (!angular.isString(value)) value = value.toString();
		let config = {};
		if (["paginate", "page-size"].indexOf(attr) > -1) config.changePagination = true;
		element.attr(attr, value);
		this.$template.setAttribute(attr, value);
		if (compile) {
			dropdownsStack.closePopupsFor(this.element.linked);
			this.render(config);
		}
	}

	datasourceGet() {
		return this.getCollection("initial");
	}

	datasourceSet(data, dataItem) {
		// this.debug.log("datasourceSet", this.attrs.datasource, this.attrs.config, data);
		this.debug.log("datasourceSet config:", this.attrs.config, "items:", data.length, "autoFocus", this.attrs.autoFocus);
		if (this.$destroying) return;
		if (this.config.dataAdapter && this.config.dataAdapter.parsingCollection !== false) {
			this.datasource = this.config.dataAdapter.parseCollection(data);
			this.timeStamp(false, 'datasource loaded', "dataAdapter parseCollection");
		}
		else this.datasource = data;
		if (this.attrs.datasource) this.$parse(this.attrs.datasource).assign(this.scope().$parent, data);
		let $controller = this;
		if (this.controllerLoaded) {
			this.$dataSource.loadData(data);
			this.datasourceChanged(!this.attrs.parentConfig && this.attrs.autoFocus === "true", dataItem);
			if (this.currentItem) {
				let dataItem = this.getCollection('index').objectByUid[this.currentItem];
				this.currentItem = dataItem ? dataItem : undefined;
				this.$currentItemChanged(dataItem);
			}
			if (this.$$grid && this.$$grid.$$editor && this.$$grid.$$editor.opened) {
				$controller.$timeout(function () {
					this.goTop(false, false, function () {
						$controller.$$grid.$$editor.form.dataItem = $controller.currentItem;
						$controller.$$grid.$$editor.refreshForm();

					}, false, true);

				});

			}
			this.dataLoaded = true;
			this.dataReload = false;
		} else {
			this.datasourceSetLater = data;
		}
		return true;
	}


	datasourceUpdate(dataItem, op, goToDataItem) {
		if (this.config.dataAdapter) this.config.dataAdapter.parseItem(dataItem);
		switch (op) {
			case 0:
				this.$dataSource.update(dataItem, this.attrs.applyChangesOnSave);
				break;
			case -1:
				this.$dataSource.delete(dataItem, this.attrs.applyChangesOnSave);
				break;
			case 1:
				this.$dataSource.add(dataItem, this.attrs.applyChangesOnSave);
				break;
		}
		let $controller = this;
		// if (this.attrs.editRow === "editor") {
		//nu-mi place cum merge
		// if (this.$api) this.loadData(this, false, function () {
		// 	$controller.datasourceChanged(false, dataItem);
		// });
		// }
		if (this.attrs.applyChangesOnSave) this.datasourceChanged(false, goToDataItem ? dataItem : false);
		else this.hasChanges = true;

	}

	datasourceDistinctValues() {
		if (this.$destroying) return;
		if (!this.hasDistinctValues) return;
		let distinctValues = {};
		let datasource = (this.attrs.distinctValuesDatasource) ? this.$parent.$eval(this.attrs.distinctValuesDatasource) : undefined;
		let calculate = false;
		for (let field in this.distinctValues) {
			if (field === "groupsLevels") continue;
			if (datasource && datasource[field]) this.distinctValues[field].data = datasource[field];
			else {
				this.setDistinctValues(field);
				calculate = true;
			}
			distinctValues[field] = this.distinctValues[field].data;
		}
		if (false) {
			let datasource = angular.copy(this.datasource);
			datasource.forEach(function (item) {
				item.$$uid = undefined;
			});
			window.saveAsJson({items: datasource, distinctValues: distinctValues, status: true}, "data" + datasource.length);
		}
		if (calculate) this.timeStamp(false, "datasource loaded", 'calculate distinct values');
	}

	datasourceChanged(goToRow, dataItem) {
		var $controller = this;
		$controller.currentItem = undefined;
		var changeEvent = function () {
			this.debug.log("datasourceChanged", goToRow, dataItem);
			this.$dataSource.collectionsUpdate(this.columns.orderBy);
			if (dataItem && !this.getCollection("index").objectByUid[dataItem.$$uid]) dataItem = this.$dataSource.findDataItemById(dataItem);
			this.datasourceDistinctValues();
			this.filterApply(goToRow, dataItem, true);
			$controller.$currentItemChanged(dataItem);
		};
		if (this.pivotTableShow) {
			this.pivotTableShow.data = [];
			this.pivotTableShow.table.$ctrl.datasourceSet([]);
			this.pivotTableShow.popupClose();
			changeEvent.call($controller);
			//this.$timeout(function () { changeEvent.call($controller); },200);
		}
		else changeEvent.call($controller);
	}

	orderApply(goToRow, dataItem, loadingData) {
		this.$dataSource.orderApply(this.columns.orderBy);
		this.filterApply(goToRow, dataItem, loadingData);
	}

	filterApply(goToRow, dataItem, loadingData) {
		var $controller = this;
		let filterExecuted = loadingData === undefined;
		if (filterExecuted) this.timeStamp(true, "datasource loaded");


		if (!this.$paginator) this.generateClientPagination();
		this.$dataSource.filterApply();
		//this.debug.log("filter apply", goToRow, this.attrs.config);
		// $controller.timeStamp(false, 'datasource loaded', "filter finished");
		if (this.attrs.pageSize === 'ALL') {
			this.$timeout(function () {
				if ($controller.$destroying) return;
				//this.debug.log("filter apply1", goToRow, $controller.attrs.config);
				$controller.paginateApply(false, goToRow, dataItem, false, false, false, loadingData, filterExecuted);
				// if (dataLoaded) {
				// 	$controller.timeStamp(false, 'datasource loaded', "items loaded (" + $controller.totalRecords.initial() + ")");
				// 	$controller.timeStamp(false, 'datasource loaded');
				// }
			}, 0);
		} else {
			this.paginateApply(true, goToRow, dataItem, false, false, false, loadingData, filterExecuted);
		}
	}

	virtualScroll(scrollTop, direction) {
		var topIndex = Math.floor(scrollTop / this.attrs.rowDataHeight) + 1;
		this.$paginator.fromIndex = topIndex;
		this.$paginator.toIndex = topIndex + this.getVisibleRecords() - 1 - (this.attrs.addEmptyRow === 'true' && topIndex === 0 ? 1 : 0);
		// this.debug.log('virtual scroll--------', scrollTop, direction, this.$paginator.fromIndex, this.$paginator.toIndex);
		if (this.attrs.pageSize === 'ALL') this.paginateApply(false, false, false, true, direction === virtualScrollDirections.up);
		else {
			this.$layout.scroller.element.scrollTop(scrollTop);
		}
	}

	calculateScrollTop(fromIndex) {
		return this.attrs.rowDataHeight * (fromIndex - 1);
	}

	calculateToIndex(from) {
		if (this.$destroying) return;
		from = Math.max(1, from);
		var pageSize = this.getVisibleRecords(), to = from + pageSize - 1;
		if (this.attrs.addEmptyRow === "true" && from === 1) to--;
		if (this.attrs.addEmptyRow === "true" && to < pageSize) this.scrollTop = 0;
		//this.debug.log( "calculate to index", this.$dataSource, this.$destroying)
		to = Math.min(to, this.$dataSource.getCollection("visibleItems").length);
		return to;
	}

	setVirtualScrollPosition(scrollTop, gotoRow, visibleIndex, scrollEvent) {
		var $controller = this;

		if (this.attrs.pageSize === 'ALL') {
			$controller.scrollTop = scrollTop;
			var pageSize = this.getPageSize();
			this.$paginator.fromIndex = Math.ceil(scrollTop / this.attrs.rowDataHeight) + 1;
			this.$paginator.toIndex = this.calculateToIndex(this.$paginator.fromIndex);
			var fromIndex = this.$paginator.toIndex - pageSize + 1;
			if (fromIndex < this.$paginator.fromIndex) this.$paginator.fromIndex = Math.max(1, fromIndex);
			this.paginateApply(false, gotoRow, false, true, false, visibleIndex);
		}
		if (scrollEvent) this.getDomElement(">ax-table-content>[role=vertical-scroller]").scrollTop(scrollTop);
	}

	createVirtualTable() {
		if (this.$destroying) return;
		var virtualTable = this.getDomElement('>ax-table-content>[role=vertical-scroller] >div');
		var recipient = this.getDomElement('>ax-table-content>[role=vertical-scroller]');
		var recipientHeight = this.getDomElement('>ax-table-content>[role=vertical-scroller]').height();
		if (this.attrs.pageSize === 'ALL') {
			var recordsShowable = this.getCollection('visibleItems').length;
			if (this.pivotTableShow) recordsShowable = 0;
			this.virtualTableHeight = (recordsShowable + (this.attrs.addEmptyRow === 'true' ? 1 : 0)) * parseInt(this.attrs.rowDataHeight);
			var headerHeight = this.$layout.header.height();
			//if (this.virtualTableHeight > (this.$layout.scroller.visibleHeight() - headerHeight)) this.virtualTableHeight += parseInt(this.attrs.rowDataHeight);
			// this.debug.log("createVirtualTable:", this.virtualTableHeight, recordsShowable);
		}
		else {
			var scrollerTable = this.getDomElement('>ax-table-content>[role=table-scroller] > table');
			this.virtualTableHeight = scrollerTable.height();//+ parseFloat(scrollerTable.css('margin-top'));
		}
		virtualTable.css('height', this.virtualTableHeight + 'px');
		//var initialWidth = recipient.width();
		//recipient.width((this.virtualTableHeight > recipientHeight) ? 17 : 0);
		//if (initialWidth != recipient.width()) this.$layout.set.widthChanged();

	}

	paginateApply(reset, goToRow, dataItem, virtualScroll, fitToBottom, visibleIndex, executedByFilterApply, filterExecuted) {
		//this.debug.log("paginate apply1", goToRow, this.attrs.config);
		if (!this._show) return;
		var $controller = this;
		let notPaginate = (!this.$paginator && this.attrs.paginate === "client");
		if (this.attrs.pageSize === 'ALL') this.createVirtualTable();

		this.refreshPaginatorInfo(reset, virtualScroll);
		if (!this.$dataSource.paginateApply() && (!goToRow && !dataItem)) return;
		let timeout = 200;
		if (this.paginateTimeout) {
			//this.debug.log("paginate apply cancel timeout", goToRow, this.attrs.config);
			//this.$timeoutCancel(this.paginateTimeout);
		}
		//this.debug.log("paginate apply", goToRow, this.attrs.config, this.attrs.pageSize );

		if (executedByFilterApply) {
			this.timeStamp(false, 'datasource loaded', "items loaded (" + this.totalRecords.initial() + ")");
			this.timeStamp(false, 'datasource loaded');
		} else if (filterExecuted) this.timeStamp(false, 'datasource loaded', "filter executed");
		if (this.attrs.pageSize === 'ALL') {
			this.paginateTimeout = this.$timeout(function () {
				if (this.$destroying) return;
				this.$layout.set.updateCells();
				if (goToRow) this.goToRow(this.currentRowIndex !== undefined ? this.currentRowIndex : -1, this.currentColumnIndex, null, null, visibleIndex);
				else if (dataItem) this.goToDataItem(dataItem);
				this.paginateFinish = true;
			}, timeout);
		} else {
			this.paginateTimeout = this.$timeout(function () {
				if (this.$destroying) return;
				if (goToRow) this.goToRow(this.currentRowIndex !== undefined ? this.currentRowIndex : -1);
				else if (dataItem) this.goToDataItem(dataItem);

				this.paginateTimeout = this.$timeout(function () {
					if (this.$destroying) return;
					this.createVirtualTable();
					this.$layout.set.updateCells();
					this.paginateFinish = true;
				}, 500);

			}, timeout);
		}
	}

	clearSelection() {
		this.currentItem = null;
		this.removeAllTrsFocus();
	}

	clear() {
		this.datasourceClear();
	}

	prepareFilter() {
		this.filters.hasInputValues = false;
		if (angular.isObject(this.filters.values)) {
			for (let column in this.filters.values) {
				var filterValue = this.filters.values[column];
				if (filterValue === null || filterValue === undefined) continue;
				this.filters.hasInputValues = true;
				break;
			}
		}
		this.filters.hasArrayValues = false;
		if (angular.isObject(this.filters.arrayValues)) {
			for (let column in this.filters.arrayValues) {
				if (!this.filters.arrayValues[column].selectedValues || this.filters.arrayValues[column].selectedValues.length === 0) continue;
				this.filters.hasArrayValues = true;
				break;
			}
		}
		this.filters.hasRangeValues = false;
		if (angular.isDefined(this.filters.range)) {
			for (var column in this.filters.range) {
				if (angular.isDefined(this.filters.range[column])) {
					var filter = this.filters.range[column];
					if (filter.minValue === undefined && filter.maxValue === undefined) continue;
					this.filters.hasRangeValues = true;
					break;
				}
			}
		}
		this.filters.hasGlobalSearch = false;
		if (angular.isString(this.filters.globalSearch)) {
			this.filters.hasGlobalSearch = this.filters.globalSearch !== "";
		}
		this.filters.hasCustomFilter = this.config.itemCustomFilter;
	}

	filterByGroup(group, values) {
		this.clearFilterByGroup(group);
		this.filters.group = {group: group, values: values};
		this.filterApply(false, group);
	}

	clearFilterByGroup(group) {
		if (!this.filters.group) return;
		this.filters.group = undefined;
		this.filterApply(false, group);
	}

	itemFilterByGroup(dataItem) {
		if (dataItem === null || dataItem === undefined) return false;
		let filtered = true;
		let returnFalse = function () {
			filtered = false;
			return false;
		};
		this.filters.group.values.each(function (group) {
			if (group.expression === 'true') return;
			if (group.operator !== "In list" && (group.value === "" || group.value === undefined)) return true;
			if (group.operator === "In list" && (group.arrayValues === undefined || group.arrayValues.length === 0)) return true;
			let expressionValue = eval(group.expression);//jshint ignore:line
			if (expressionValue === undefined && group.value) return returnFalse();
			if (group.operator !== "In list") expressionValue = expressionValue.toString().trim().toLowerCase();
			let groupValue = group.value.toLowerCase();
			if (group.operator === "Strict match") {
				if (expressionValue !== groupValue) return returnFalse();
			} else if (group.operator === "Includes") {
				if (!expressionValue.includes(groupValue)) return returnFalse();
			} else if (group.operator === "Starts with") {
				if (!expressionValue.startsWith(groupValue)) return returnFalse();
			} else if (group.operator === "Ends with") {
				if (!expressionValue.endsWith(groupValue)) return returnFalse();
			} else if (group.operator === "In list") {
				if (!group.arrayValues.includes(expressionValue)) return returnFalse();
			}
		}, this);
		return filtered;
	}

	itemFilter(item) {
		if (this.filters.hasCustomFilter) if (!this.config.itemCustomFilter(item)) return false;
		if (this.filters.hasInputValues) if (!this.itemFilterByValue(item)) return false;
		if (this.filters.hasArrayValues) if (!this.itemFilterByArrayValues(item)) return false;
		if (this.filters.hasRangeValues) if (!this.itemFilterByRange(item)) return false;
		if (this.filters.hasGlobalSearch) if (!this.itemFilterByGlobalSearch(item)) return false;
		if (this.filters.group) if (!this.itemFilterByGroup(item)) return false;
		return true;
	}

	itemFilterByValue(item) {
		if (angular.isObject(this.filters.values)) {
			for (let column in this.filters.values) {
				var filterValue = this.filters.values[column];
				if (filterValue === null || filterValue === undefined) continue;
				if (item[column] === null || item[column] === undefined) return false;
				let value = filterValue.toString();
				if (value === "") continue;

				if (angular.isNumber(item[column]) && parseFloat(value) === 0) continue;
				let itemValue = this.convertData[column] ? this.convertData[column].fn(item[column], this.dateParser) : item[column];
				if (!angular.isString(itemValue)) itemValue = itemValue.toString();
				let config = this.filters.config ? this.filters.config[column] : false;
				if (config) {
					if (config.matchCase) {
						if (config.searchType === "Starts with") {
							if (!itemValue.startsWith(value)) return false;
						}
						else if (config.searchType === "Ends with") {
							if (!itemValue.endsWith(value)) return false;
						}
						else if (!itemValue.includes(value)) return false;
					} else {
						if (config.searchType === "Starts with") {
							if (!itemValue.toLowerCase().startsWith(value.toLowerCase())) return false;
						}
						else if (config.searchType === "Ends with") {
							if (!itemValue.toLowerCase().endsWith(value.toLowerCase())) return false;
						}
						else if (!itemValue.toLowerCase().includes(value.toLowerCase())) return false;
					}
				}
				else if (!itemValue.toString().toLowerCase().includes(value.toLowerCase())) return false;
			}
		}
		return true;
	}

	itemFilterByArrayValues(item) {
		if (angular.isObject(this.filters.arrayValues)) {
			for (let column in this.filters.arrayValues) {
				if (!this.filters.arrayValues[column].selectedValues || this.filters.arrayValues[column].selectedValues.length === 0) continue;
				var filterArrayValues = this.filters.arrayValues[column].selectedValues;
				if ((item[column] === null || item[column] === undefined) && filterArrayValues.indexOf(null) === -1) return false;
				let itemValue = this.convertData[column] ? this.convertData[column].fn(item[column], this.dateParser) : item[column];
				if (this.filters.arrayValues[column].filterStrict) {
					if (itemValue !== null && itemValue !== undefined && filterArrayValues.indexOf(itemValue.toString()) === -1) return false;
				} else {
					for (let filterI in filterArrayValues) {
						let value = filterArrayValues[filterI];
						if (itemValue !== null && itemValue !== undefined && itemValue.toString().toLowerCase().indexOf(value) === -1) return false;
					}
				}
			}
		}
		return true;
	}

	itemFilterByRange(item) {
		if (angular.isDefined(this.filters.range)) {
			for (var column in this.filters.range) {
				if (angular.isDefined(this.filters.range[column])) {
					var filter = this.filters.range[column];
					if (filter.minValue === undefined && filter.maxValue === undefined) continue;

					var itemValue = this.convertData[column] ? this.convertData[column].fn(item[column], this.dateParser) : item[column];
					//this.debug.log(itemValue, filter.operator, filter.minValue, filter.maxValue);
					switch (filter.operator) {
						case "between":
							if ((itemValue === null || itemValue === undefined) && !filter.includeNulls) return false;
							if ((itemValue === null || itemValue === undefined) && filter.includeNulls) continue;
							if (filter.minValue && (itemValue <= filter.minValue)) return false;
							if (filter.maxValue && (itemValue >= filter.maxValue)) return false;
							break;
						case "between equal":
							if ((itemValue === null || itemValue === undefined) && !filter.includeNulls) return false;
							if ((itemValue === null || itemValue === undefined) && filter.includeNulls) continue;
							if (filter.minValue && itemValue < filter.minValue) return false;
							if (filter.maxValue && itemValue > filter.maxValue) return false;
							break;
						case "bigger-than":
							if (filter.minValue === undefined) continue;
							if ((itemValue === null || itemValue === undefined) && filter.includeNulls) continue;
							if ((itemValue === null || itemValue === undefined) && !filter.includeNulls) return false;
							if (!itemValue && filter.minValue) return false;
							if (filter.minValue && itemValue <= filter.minValue) return false;
							break;
						case "bigger-than equal":
							if (filter.minValue === undefined) continue;
							if ((itemValue === null || itemValue === undefined) && filter.includeNulls) continue;
							if ((itemValue === null || itemValue === undefined) && !filter.includeNulls) return false;
							if (!itemValue && filter.minValue) return false;
							if (filter.minValue && itemValue < filter.minValue) return false;
							break;
						case "less-than":
							if (filter.maxValue === undefined) continue;
							if ((itemValue === null || itemValue === undefined) && filter.includeNulls) continue;
							if ((itemValue === null || itemValue === undefined) && !filter.includeNulls) return false;
							if (filter.maxValue && itemValue >= filter.maxValue) return false;
							break;
						case "less-than equal":
							if (filter.maxValue === undefined) continue;
							if ((itemValue === null || itemValue === undefined) && filter.includeNulls) continue;
							if ((itemValue === null || itemValue === undefined) && !filter.includeNulls) return false;
							if (filter.maxValue && itemValue > filter.maxValue) return false;
							break;
						case "exact equal":
						case "exact":
							if (filter.minValue === undefined) continue;
							if ((itemValue === null || itemValue === undefined) && filter.includeNulls) continue;
							if ((itemValue === null || itemValue === undefined) && !filter.includeNulls) return false;
							//if (angular.isDefined(itemValue) && (filter.minValue === undefined)) continue;
							//if ((itemValue === null || itemValue === undefined) && angular.isDefined(filter.minValue)) return false;
							if (itemValue.toString() !== filter.minValue.toString()) return false;
							break;
					}
				}
			}
		}
		return true;
	}

	itemFilterByGlobalSearch(item) {
		if (angular.isString(this.filters.globalSearch)) {
			var search = this.filters.globalSearch.toLowerCase();
			if (search === "") return true;
			//todo de optimizat lista de coloane in care se face cautarea
			//this.debug.log("filter", this.search);
			if (this.filters.config.globalSearch && this.filters.config.globalSearch.columns)
				for (let i in this.filters.config.globalSearch.columns) {
					let column = this.filters.config.globalSearch.columns[i];
					if (!angular.isDefined(item[column])) continue;
					if (item[column] !== null && item[column].toString().toLowerCase().includes(search)) return true;
				}

			else
				for (let i in this.dataItemModel) {
					let column = this.dataItemModel[i];
					//this.debug.log('column', column, search);
					if (!angular.isDefined(item[column])) continue;
					if (item[column] !== null && item[column].toString().toLowerCase().includes(search)) return true;
				}
			return false;
		}
		return true;
	}

	clearFilterColumn(fieldName) {
		let clearFilter = false;
		if (this.filters.values && angular.isDefined(this.filters.values[fieldName])) {
			this.filters.values[fieldName] = undefined;
			clearFilter = true;
		}
		if (this.filters.range && angular.isDefined(this.filters.range[fieldName])) {
			clearFilter = clearFilter || angular.isDefined(this.filters.range[fieldName].minValue) || angular.isDefined(this.filters.range[fieldName].maxValue);
			this.filters.range[fieldName].clear();
		}
		if (this.filters.arrayValues && angular.isDefined(this.filters.arrayValues[fieldName])) {
			clearFilter = clearFilter || (this.filters.arrayValues[fieldName].selectedModel !== undefined && this.filters.arrayValues[fieldName].selectedModel.length > 0);
			if (this.filters.arrayValues[fieldName].clear) this.filters.arrayValues[fieldName].clear();
		}
		if (this.config.itemCustomClear) {
			this.config.itemCustomClear();
			clearFilter = true;
		}
		if (clearFilter) this.filterApply();
	}

	clearAllFilters() {
		this.filters.values = {};
		this.filters.globalSearch = undefined;
		if (this.filters.arrayValues) {
			for (let i in this.filters.arrayValues) {
				let filter = this.filters.arrayValues[i];
				if (filter.clear) filter.clear();
			}
		}
		if (this.filters.range) {
			for (let column in this.filters.range) {
				if (this.filters.range[column].clear) this.filters.range[column].clear();
			}
		}
		if (this.itemCustomClear) this.itemCustomClear();
		this.clearFilterByGroup();
		this.filterApply();
	}

	isNewRecord(dataItem) {
		if (this.$api && this.$api.isNewRecord) return this.$api.isNewRecord(dataItem);
		if (this.config && this.config.isNewRecord) return this.config.isNewRecord(dataItem);
		return false;

	}

	//changeTrTemplate() {
	//	let $controller = this;
	//	this.$timeout(function () {

	//		let currentTrElement = $controller.getCurrentAllTr($controller.currentRowIndex);
	//		if ($controller.inlineEditing) {
	//			currentTrElement.attr("template-type", "edit");
	//			$controller.getDomElement().addClass("inline-editing");
	//		}
	//		else {
	//			currentTrElement.attr("template-type", "view");
	//			$controller.getDomElement().removeClass("inline-editing");
	//		}

	//	});
	//}

	undo(dataItem, $event) {
		var initial = angular.copy(this.getClone(dataItem));
		angular.extend(dataItem, initial);
		this.dataItemSetAttr(dataItem, 'editing', false);
		this.dataItemSetAttr(dataItem, 'status', '');
		this.dataItemRemoveAttr(dataItem, 'errors');
		this.currentTrElement.removeClass("error");
		this.setToReadOnly();
		var isNewRecord = this.isNewRecord(dataItem);
		if ($event) $event.stopPropagation();
		let $controller = this;
		let index = isNewRecord ? (this.dataItemGetIndex(dataItem, 'visibleItems') - 1) : this.currentRowIndex;
		if (isNewRecord) this.dataItemRemove(dataItem);
		this.$timeout(function () {
			$controller.goToRow(index);
		});
	}

	dataItemHasErrors(dataItem) {
		var errors = this.dataItemGetAttr(dataItem, "errors");
		if (!errors) return false;
		if (errors.global && errors.global.length > 0) return true;
		if (errors.fields) return true;
		return false;
	}

	dataItemHasFieldErrors(dataItem, fieldName) {
		//var errors = this.dataErrors[dataItem.$$uid];
		var errors = this.dataItemGetAttr(dataItem, 'errors');
		if (!errors || !errors.fields || !errors.fields[fieldName]) return false;
		return true;
	}

	getErrorFor(dataItem, fieldName) {
		var errors = this.dataItemGetAttr(dataItem, 'errors');
		var msg = "";
		this.debug.log("errors for", fieldName, errors);
		if (!errors) return msg;
		if (!fieldName) {
			if (errors.global) return this.getGlobalErrorMessages(errors.global);
			else return "";

		} else {
			errors = errors.fields;
			if (!errors[fieldName]) return msg;
			for (var i = 0; i < errors[fieldName].length; i++) {
				msg += (i > 0 ? "<br>" : "") + errors[fieldName][i];
			}
			this.debug.log("errors msg", msg);
			return msg;
		}
	}


	addGlobalError(label, message, dataItem) {
		var errors = this.dataItemGetAttr(dataItem, 'errors');
		if (!errors) errors = {};
		if (!errors.global) errors.global = [];
		errors.global.push({label: label, messages: message});
		this.dataItemSetAttr(dataItem, 'errors', errors);
	}

	clearErrors(dataItem) {
		if (!dataItem.$$uid || !this.currentTr) return;
		this.dataItemRemoveAttr(dataItem, 'errors');

		this.currentTr.removeClass("error");
		this.currentTr.find("td.has-error").removeClass("has-error");
		let childrenGotFocus = false;
		for (let child in this.children) {
			let childCtrl = this.children[child];
			if (!childCtrl) console.error("Not fond controller for child:", child);
			(childCtrl.trsWithErrors || []).each(function (tr, i) {//jshint ignore:line
				tr.removeClass("error");
			}, childCtrl);
			let data = childCtrl.datasourceGet();
			data.each(function (dataItem, i) {//jshint ignore:line
				this.dataItemRemoveAttr(dataItem, 'errors');
			}, childCtrl);
			childCtrl.$timeout(function () {//jshint ignore:line
				childCtrl.setCurrentItemToFirstItem();
			});
		}
		if (childrenGotFocus) this.focusToColumn(this.currentTr, $controller.currentColumnIndex);
	}

	clearFieldError(dataItem, fieldName) {
		var errors = this.dataItemGetAttr(dataItem, 'errors');
		if (!errors || !errors.fields) return;
		if (errors.fields[fieldName]) delete errors.fields[fieldName];
		let tds = this.getDomElement("tr[uid=" + dataItem.$$uid + "] td[bind-to=" + fieldName + "]");
		tds.removeClass("has-error");
	}

	addFieldError(fieldName, message, dataItem) {
		var errors = this.dataItemGetAttr(dataItem, 'errors');
		if (!errors) errors = {};
		if (!errors.fields) errors.fields = {};
		if (!errors.fields[fieldName]) errors.fields[fieldName] = [];
		if (!errors.fields[fieldName].includes(message)) errors.fields[fieldName].push(message);
		let tds = this.getDomElement("tr[uid=" + dataItem.$$uid + "] td[bind-to=" + fieldName + "]");
		tds.addClass("has-error");
		this.dataItemSetAttr(dataItem, 'errors', errors);
	}

	showGlobalErrorMessages(dataItem) {
		var errors = this.dataItemGetAttr(dataItem, 'errors');
		if (!errors || !errors.global || errors.global.length === 0) return;
		this.dataItemSetAttr(dataItem, 'status', 'error');
		var messages = this.getGlobalErrorMessages(errors.global);
		this.$notify.error(messages);
	}

	getGlobalErrorMessages(errors) {
		var messages = "";
		for (var i = 0; i < errors.length; i++) {
			var error = errors[i];
			//messages += error.label + "\n";
			if (angular.isArray(errors.messages)) {
				for (var j = 0; j < error.messages.length; j++) {
					var message = error.messages[j];
					messages += message + "\n";
				}
			} else {
				messages += error.messages + "\n";
			}
		}
		return messages;
	}

	extractErrors(errors, dataItem) {
		let hasError = false;
		for (let fieldId in errors) {
			var fieldName = fieldId.replace('item.', '');
			if (fieldName === "children") continue;
			hasError = true;
			if (!(fieldName in this.columnsWithErrorMsg) || fieldName === "") {
				errors[fieldId].each(function (message) {//jshint ignore:line
					this.addGlobalError(fieldName, message, dataItem);
				}, this);
			} else {
				errors[fieldId].each(function (message) {//jshint ignore:line
					this.addFieldError(fieldName, message, dataItem);
				}, this);

			}
		}
		if (errors.children) {
			for (let child in errors.children) {
				let childErrors = errors.children[child];
				let childCtrl = this.children[child];
				if (!childCtrl) console.error("Not fond controller for child:", child);
				childCtrl.trsWithError = [];
				childErrors.each(function (errors, i) {//jshint ignore:line
					childCtrl.goToRow(i, false, false, function () {
						let childError = childCtrl.extractErrors(errors, childCtrl.currentItem);
						if (childError) childCtrl.trsWithError.push(childCtrl.currentTr);
						hasError = hasError || childError;
					});
				}, this);
				this.debug.log("error", childCtrl.trsWithError);
				childCtrl.goTop();
			}
		}
		return hasError;
	}


	windowResize() {
		this.$timeout(function () {
			axUtils.triggerWindowResize();
		});
	}

	addConvertFnToFilters() {
		var self = this;
		for (let fieldName in this.convertData) {
			var filter = this.filters.arrayValues[fieldName];
			if (!filter) filter = this.filters.arrayValues[fieldName] = {};
			filter.convertData = function (value) {//jshint ignore:line
				var returnValue = self.convertData[fieldName].fn(value, self.dateParser);
				return returnValue;
			};
		}
	}

	timeStamp(task, label, stage, controller) {
		// if (this.attrs.debug !== "true") return;
		this.$dataStore.timeStamp(task, label, stage, !controller ? this : controller);
	}

	log() {
		if (this.attrs.debug !== "true") return;
		let params = [];
		for (let i = 0; i < arguments.length; i++) {
			params.push(arguments[i]);
		}
		console.log(arguments.calee, params);
	}
		hammer(gesture, event) {
		//event.preventDefault();
		// console.log("gesture: ", event.additionalEvent);
		if (gesture === "panup") this.panEventHandler(1, event);
		else if (gesture === "pandown") this.panEventHandler(-1, event);
		// this.$notify.log("gesture: " + gesture + " - " + event.distance);
	}
	post($element, scope, attrs) {
		var $controller = this;

		$controller.$dataSource.setGroupsDefs(angular.copy(this.groups.defs), scope);
		$controller.$destroying = false;
		$controller.$timeout(function () {
			for (let i = 0; i < $controller.columns.ordered.length; i++) {
				let column = $controller.columns.ordered[i];
				$controller.setColumnSortableClass(column.field, column.asc ? 'asc' : 'desc');
			}
		});
		$controller.$dataSource.config.orderBy = $controller.computeOrderByAttribute();

		var editFormTemplate;
		if (!attrs.editFormTemplate) editFormTemplate = "";
		else if (attrs.editFormTemplate.indexOf('.html') > -1) editFormTemplate = attrs.editFormTemplate; //poate fi definita si ca variabila in scope
		else editFormTemplate = this.$parent.$eval(attrs.editFormTemplate);
		this.editFormTemplate = editFormTemplate;

		//if ($controller.calculations) $controller.$dataSource.calculations.add($controller.calculations);
		if ($controller.extendItem) $controller.$dataSource.config.extendItem = $controller.extendItem;
		// $controller.tableId = attrs.tableId;
		this.addConvertFnToFilters();
		$controller.detectMouseLeftButton = detectMouseLeftButton;
		if ($controller.$parent.$parent.dropdown) {
			var dropdown = $controller.$parent.$parent.dropdown;
			$controller.$dropdownParent = dropdown;
		}
		var $parentScope = scope.$parent.$parent;
		if (!$parentScope.$$axTables) $parentScope.$$axTables = {};
		let tableId = $controller.tableId;
		if (!$parentScope.$$axTables[tableId]) $parentScope.$$axTables[tableId] = {};
		var $$controllerStore = $parentScope.$$axTables[tableId];

		$$controllerStore.compile = function (config) {
			$controller.debug.log("start compile ------------------", config);
			let $parentElement = $controller.$template.element.linked;
			dropdownsStack.closePopupsFor($parentElement);
			var params = {
				compiling: true,
				maximized: $controller.maximized,
				filters: $controller.filters,
				distinctValues: $controller.distinctValues,
				normalStyle: $controller.normalStyle,
				popupOpened: $controller.$$grid && $controller.$$grid.$$editor && $controller.$$grid.$$editor.opened,
				readOnly: $controller.readOnly,
				dataLoaded: $controller.dataLoaded,
				animation: config ? config.animation : false,
				changePagination: config ? config.changePagination : $controller.changePagination,
				dataReload: config ? config.dataReload : $controller.dataReload
			};
			angular.extend(params, config || {});
			angular.extend($$controllerStore, params);
			let initialOrderBy = $controller.$dataSource.config.orderBy;
			let initialGrouping = $controller.$template.element.source.find("ax-groups").outerHTML();
			// element.updated is used on axTableTemplate.createDynamicColumns method
			// console.log("initial", angular.copy($controller.$template.element.initial.find(">ax-column")));
			var template = $controller.$template.element.updated ? $controller.$template.element.updated.html() : $controller.$template.element.initial.html();
			$controller.$template.element.source = angular.copy($parentElement);
			$controller.$template.element.source.html(template);
			$controller.$template.html();
			$controller.content.compile($controller.element.html, $controller);
			$controller.$template.element.updated = undefined;
			if ($controller.attrs.pivotTableMode !== "true" && $controller.$$grid && $controller.$$grid.$$editor) {
				if ($controller.attrs.editRow !== "editor") {
					if ($controller.$$grid.$$editor.opened) $controller.$$grid.$$editor.close();
					$controller.$$grid.$$editor.content.compile($controller.element.editorHtml, $controller.$$grid.$$editor);
				}
			}


			if ($controller._show) {
				$controller.$layout.create($controller, scope);
				$controller.$layout.init();
			}
			$controller.$dataSource.config.orderBy = $controller.computeOrderByAttribute(true);

			if ($controller.attrs.paginate === 'client') $controller.generateClientPagination();
			if ($$controllerStore.fromIndex && $controller.$paginator) {
				$controller.$paginator.fromIndex = $$controllerStore.fromIndex;
				$controller.$paginator.toIndex = 0;
			}

			axUtils.objectOverwrite($controller.filters, $$controllerStore.filters);
			axUtils.objectOverwrite($controller.distinctValues, $$controllerStore.distinctValues);
			$controller.$dataSource.setGroupsDefs(angular.copy($controller.groups.defs), scope);// trebuie pus dupa disctinctValues
			$controller.scrollLeft = 0;
			$controller.$layout.scroller.element.scrollLeft(0);
			if ($$controllerStore.dataReload && $controller.$api) $controller.loadData();
			else if ($$controllerStore.dataReload) {
				//$controller.scrollLeft = 0;
				$controller.datasourceSet($controller.getCollection("initial"));
			}
			else if (params.datasource) {
				//$controller.scrollLeft = 0;
				$controller.datasourceSet(params.datasource);
			}
			else if ($controller.$dataSource.config.orderBy !== initialOrderBy) $controller.orderApply(false, $controller.currentItem, true);
			else $controller.filterApply(false, $controller.currentItem, true);
			if (params.animation)
				$controller.element.linked.find(">ax-table-content").slideShow("left", 500, function () {
					$controller.element.linked.css({"visibility": "", "animation": ""});
					$controller.$timeout(function () {
						if ($controller.attrs.columnsAutofit === 'true') $controller.columnsAutoFitAll();

						$controller.debug.log("stop compiling with animation");
						$controller.$layout.set.global();
						$controller.windowResize();
						if (config && config.loader) config.loader.remove();
					});
				}, false, true);
			else {
				if ($controller.attrs.columnsAutofit === 'true') $controller.columnsAutoFitAll();
				$controller.element.linked.find(">ax-table-content").css("visibility", "");
				$controller.element.linked.css({"visibility": ""});
				$controller.debug.log("stop compiling");
				if (config && config.loader && $controller.$$grid && $controller.$$grid.$$table) {
					$controller.timeStamp(false, 'pivot-create', "compiled");
					$controller.timeStamp(false, 'pivot-create');
				}
				if (config && config.loader) config.loader.remove();

			}
			$$controllerStore.compiling = false;
			return;
		};
		$controller.render = function (config) {
			$controller.$timeout(function () {
				$$controllerStore.compile(config);
			}, 0);
		};
		var dataIsFiltered = false;

		var selectableRowsModelWatch = function () {
			if (!dataIsFiltered) return;
			if (attrs.selectableRows === 'single') {
				if (attrs.selectableRowsModelType === 'id-field') {
					let dataItem = $controller.getCollection('index').objectById[$controller.selectableRowsModel];
					$controller.currentItem = dataItem;
					if ($controller.attrs.autoFocus === "true") $controller.goToDataItem(dataItem);
				} else if (attrs.selectableRowsModelType === 'object') {
					var model = angular.isArray($controller.selectableRowsModel) ? ($controller.selectableRowsModel.length === 0 ? {} : $controller.selectableRowsModel[0]) : $controller.selectableRowsModel;
					if (!model) return;
					let dataItem;
					if ($controller.attrs.itemIdField) dataItem = $controller.getCollection('index').objectById[model[$controller.attrs.itemIdField]];
					else dataItem = $controller.getCollection('index').objectByUid[model.$$uid];
					if (!dataItem) return;
					model.$$uid = dataItem.$$uid;
					$controller.currentItem = dataItem;
					if ($controller.attrs.autoFocus === "true") {
						$controller.goToDataItem(dataItem);
					}
				}
			} else if ($controller.selectableRowsModel && $controller.selectableRowsModel.length > 0) {
				if ($controller.attrs.autoFocus === "true") $controller.goToDataItem($controller.selectableRowsModel[0]);
			} else if ($controller.attrs.autoFocus === "true") $controller.$timeout(function () {
				$controller.goToRow(-1);
			});
		};
		$controller.selectableRowsModelWatch = selectableRowsModelWatch;
		if (attrs.selectableRowsModel) {
			scope.$watch(function () {
				return $controller.selectableRowsModel;
			}, selectableRowsModelWatch);
		}
		scope.$watch(function () {
				return $controller.dataLoaded;
			},
			function () {
				if (!$controller.dataLoaded) return;
				// $controller.datasourceChanged($controller.attrs.autoFocus === "true" && !$controller.selectableRowsModel);
				dataIsFiltered = true;
				if (attrs.selectableRowsModel && $controller.selectableRowsModel) $controller.$timeout(selectableRowsModelWatch, 100, false);
				if (attrs.columnsAutofit === "true") $controller.$timeout(function () {
					if ($controller) $controller.columnsAutoFitAll();
				}, 100);
			});
		if (attrs.parentConfig) {
			scope.$watch("$ctrl.parentConfig.$ctrl", function (parent) {
				if (!parent) return;
				if (!parent.children) parent.children = {};
				scope.$ctrl.childIndex = parseInt(attrs.childIndex || 1);
				if (!attrs.childName) console.error("You need to setup an child-name attribute!");
				parent.children[attrs.childName] = scope.$ctrl;
				console.log("set children for parent", parent);
			});
		}
		this.$layout = new axTableLayout(this, scope);
		if ($controller._show) $controller.$layout.init();
		$controller.debug.log("ctrl datasource ", attrs.datasource);
		if (attrs.datasource && attrs.datasource !== 'remote') {
			// if (attrs.editRow) {
			// 	console.error("ax-table/ax-grid datasource attribute is not compatible with edit-row attribute. When datasource is editable, use datasourceSet controller method.", attrs.datasource);
			// 	scope.$ctrl.setAttribute("datasource", "");
			// 	attrs.datasource = "";
			// }
			scope.$watch(function () {
					// return $controller.datasource;
					return $controller.dataLoaded ? "" : $controller.datasource;
				},
				function () {
					if ($controller.dataLoaded || !$controller.datasource) return;
					$controller.debug.log("ctrl datasource watch executing", $controller.datasource.length, $$controllerStore.dataReload, $$controllerStore.compiling);
					$controller.datasourceSet($controller.datasource);
				});
		}
		if (attrs.datasource === 'remote' && !angular.isDefined($controller.dataLoaded)) {
			$controller.dataLoaded = false;
			if (($controller.autoLoadData === "true" || $$controllerStore.dataReload) && !$$controllerStore.compiling) $controller.loadData();
		} else
			$controller.dataLoaded = (attrs.datasource) ? false : this.datasourceSet([]);
	}
}
