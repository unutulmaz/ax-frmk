class axTableDropdowns {
	/**
	 * @param {axTableController} $controller
	 */
	constructor($controller) {
		var getMessage = function (category, code) {
			return $controller.$template.getMessage(category, code);
		};
		var $dropdowns = this;
		this.aggregationsTypes = [{id: "sum"}, {id: "count"}, {id: "min"}, {id: "max"}, {id: "first"}, {id: "last"}];

		this.clearFilters = {
			title: getMessage("toolbar", "clearFilters"),
			okText: getMessage("common", "clear"),
			confirm: function () {
				$controller.clearAllFilters();
				this.close();
			},
			onOpen: function () {
				dropdownsStack.closePopupsFor($controller.element.linked);
				this.openFinish = true;
			}
		};
		this.globalSearch = {
			title: getMessage("toolbar", "globalSearchTitle"),
			applyText: getMessage("toolbar", "btnApply"),
			cancelText: getMessage("common", "cancel"),
			clearText: getMessage("common", "clear"),
			applyingText: getMessage("toolbar", "btnApplying"),
			confirm: function (removeSpinner) {
				if (this.selected.length === 0 || this.selected.length === this.columns.length) $controller.filters.config.globalSearch.columns = undefined;
				else $controller.filters.config.globalSearch.columns = this.selected;
				this.close();
				$controller.filterApply();
				if (removeSpinner) removeSpinner();
			},
			onOpen: function () {
				this.columns = [];
				dropdownsStack.closePopupsFor($controller.element.linked);
				$controller.columns.hideable.each(function (column) {
					if (!column.canView || column.bindTo === "$$uid" || !column.bindTo) return;
					this.columns.push(column);
				}, this);
				if ($controller.filters.config.globalSearch.columns) this.selected = $controller.filters.config.globalSearch.columns;
				else {
					this.selected = [];
					this.columns.each(function (column) {
						this.selected.push(column.bindTo);
					}, this);
				}
				this.openFinish = true;
			}
		};
		this.groupsFilter = {
			title: getMessage('toolbar', 'groupsFilter'),
			applyText: getMessage("toolbar", "btnApply"),
			cancelText: getMessage("common", "cancel"),
			clearText: getMessage("common", "clear"),
			applyingText: getMessage("toolbar", "btnApplying"),
			typeOptions: ['Filter by current grup', 'Filter by input value'],
			operators: [{id: "Strict match", index: 1}, {id: "Starts with", index: 4}, {id: "Ends with", index: 5}, {id: "Includes", index: 3}, {id: "In list", index: 2}],
			clear: function (removeSpinner) {
				$controller.clearFilterByGroup(this.group);
				this.close();
				if (removeSpinner) removeSpinner();
			},
			operatorChange: function () {

			},
			typeChange: function () {
				if (this.filterType !== this.typeOptions[0]) return;
				let values = [];
				let currentGroup = this.group;
				while (currentGroup) {
					values[currentGroup.level] = currentGroup.value;
					currentGroup = currentGroup.parent();
				}
				$controller.groups.defs.each(function (groupDef, i) {
					let operator = this.operators[0].id;
					let value = values[i] ? values[i] : "";
					this.groups[i].value = value;
					this.groups[i].operator = operator;
				}, this);
			},
			confirm: function (removeSpinner) {
				$controller.filterByGroup(this.group, this.groups);
				this.close();
				if (removeSpinner) removeSpinner();
			},
			onOpen: function (params) {
				if (!this.filterType) this.filterType = this.typeOptions[0];
				dropdownsStack.closePopupsFor($controller.element.linked);
				this.group = params[1];
				let values = [];
				let currentGroup = this.group;
				while (currentGroup) {
					values[currentGroup.level] = currentGroup.value;
					currentGroup = currentGroup.parent();
				}
				this.groups = [];
				if (this.filterType === this.typeOptions[0] || !$controller.filters.group)
					$controller.groups.defs.each(function (groupDef, i) {
						let operator = this.operators[0].id;
						let value = values[i] ? values[i] : "";
						this.groups.push({
							level: groupDef.level,
							label: groupDef.label,
							value: value,
							operator: operator,
							distinctValues: $controller.distinctValues.groupsLevels[i] ? $controller.distinctValues.groupsLevels[i].data : false,
							def: groupDef,
							expression: groupDef.expression
						});
					}, this);
				else $controller.filters.group.values.each(function (group) {
					this.groups.push(group);
				}, this);

				this.openFinish = true;
			}
		};
		this.export = {
			title: getMessage('toolbar', 'dataExport'),
			applyText: getMessage("toolbar", "btnRun"),
			applyingText: getMessage("toolbar", "btnRunning"),
			formatOptions: ['All', 'Aggregations', 'Data'],
			formatTooltip: `<div style='width:300px'>
						<strong>All</strong> - slowest and limited for max 10.000 records<br>
						<strong>Aggregations</strong> - just groups header and footer<br>
						<strong>Data</strong> - fastest - data rows only
					</div>`,
			outputOptions: ['Excel', 'Browser tab'],
			changeFormat: function () {
				//if (this.format !== "Data") this.showHiddenColumns = false;
				//else this.showHiddenColumns = true;
			},
			changeOutput: function () {
				//if (this.output !== "Excel" && this.formatOptions.indexOf("Data") === 2) {
				//	this.formatOptions.splice(2, 1);
				//	this.format = this.format === "Data" ? this.formatOptions[0] : this.format;
				//} else if (this.output === "Excel" && this.formatOptions.indexOf("Data") === -1) this.formatOptions.push("Data");
			},
			confirm: function () {
				let exportType = this.output === "Browser tab" ? "print" : "xls";
				if (this.format === "Data") exportType += "-justdata";
				if (this.format === "Aggregations") exportType += "-justagg";
				if (this.showHiddenColumns) exportType += "-showHiddenColumns";
				$controller.exportData({type: exportType, removeSpinner: arguments[0]});

			},
			onOpen: function () {
				let formatOptions = $controller.attrs.exportFormats.split(",");
				if (!this.output) this.output = "Excel";
				if (!this.format) this.format = "All";
				this.showHiddenColumns = false;
				dropdownsStack.closePopupsFor($controller.element.linked);
				let existAggs = false;
				this.formatOptions = [];
				if (formatOptions.includes("All") && $controller.getCollection("items", true) <= 10000) this.formatOptions.push("All");
				$controller.groups.defs.each(function (group) {
					for (let calculationName in group.calculations) {
						let calculation = group.calculations[calculationName];
						if (calculation.showOn !== "false") {
							existAggs = true;
							return false;
						}
					}
				});
				if (existAggs && formatOptions.includes("Aggregations")) this.formatOptions.push("Aggregations");
				if (formatOptions.includes("Data")) this.formatOptions.push("Data");
				if (!this.formatOptions.includes(this.format)) this.format = this.formatOptions[0];
				this.openFinish = true;

			}
		};
		this.configEditMode = {
			title: "Config edit mode",
			applyText: getMessage("toolbar", "btnApply"),
			cancelText: getMessage("common", "cancel"),
			applyingText: getMessage("toolbar", "btnApplying"),
			editRowOptions: ['inline', 'inline-cell', 'editor'],
			editorModeOptions: ['left', 'right', 'over'],
			getHelpFor: function (title) {
				switch (title) {
					case "editMode":
						return `inline = can edit one row at the time by pressing <i class='fa fa-edit'></i> button from actions column on each row.
<br>inline-cell = edit excel like mode. You must press <i class='fa fa-lock'></i> to toggle enable/disable changes.
<br>editor = edit row in editor. Editor is opened by pressing <i class='fa fa-eye'></i>`;
					case "applyChanges":
						return `Not recomanded. With this activated, current row will loose focus after save operation.
<br>Check this if you want to reorder and filter on each change mades.
<br>If not check this checkbox, you must press <i class='fa fa-check'></i> <br>from Settings to reorder and filter after changes was made.`;
				}
			},
			onOpen: function () {
				dropdownsStack.closePopupsFor($controller.element.linked);
				this.applyChangesOnSave = $controller.attrs.applyChangesOnSave;
				this.editorMode = $controller.$$grid && $controller.$$grid.$$editor ? $controller.element.editorDef.getAttribute("position") : false;
				if (!this.editorMode) this.editRowOptions = ["inline", "inline-cell"];
				this.editRow = $controller.attrs.editRow;
				this.openFinish = true;
			},
			confirm: function ($event) {
				$controller.setAttribute("apply-changes-on-save", this.applyChangesOnSave);
				if (this.editRow === 'editor') {
					let popupDef = $controller.element.initial.find("ax-grid-editor");
					popupDef.setAttribute("position", this.editorMode || this.editorModeOptions[1]);
				}
				$controller.setAttribute("edit-row", this.editRow, true);
			}
		};
		this.groupsToggle = {
			title: getMessage("toolbar", "groupLevelToggle"),
			expand: function (level, $event) {
				let button = angular.element($event.target);
				let buttonClass = button.attr("class");
				button.removeClass(buttonClass).addClass("fa fa-spinner fa-pulse fa-fw");
				var removeSpinner = function () {
					$controller.$timeout(function () {
						button.removeClass("fa fa-spinner fa-pulse fa-fw").addClass(buttonClass);
					}, 300);

				};

				$controller.groupToggleLevel(level, 2, removeSpinner);
			},
			collapse: function (level, $event) {
				let button = angular.element($event.target);
				let buttonClass = button.attr("class");
				button.removeClass(buttonClass).addClass("fa fa-spinner fa-pulse fa-fw");
				var removeSpinner = function () {
					$controller.$timeout(function () {
						button.removeClass("fa fa-spinner fa-pulse fa-fw").addClass(buttonClass);
					}, 300);
				};
				$controller.groupToggleLevel(level, 1, removeSpinner);
			},
			onOpen: function (params) {
				this.type = params[1];
				let dropdown = this;
				dropdownsStack.closePopupsFor($controller.element.linked);
				dropdown.groups = [];
				for (let i = 0; i < $controller.groups.defs.length; i++) {
					let groupDef = $controller.groups.defs[i];
					if (!groupDef.collapsible) continue;
					dropdown.groups.push({level: groupDef.level, label: groupDef.label});
				}
				dropdown.openFinish = true;
			}
		};
		this.columnsLayout = {
			title: getMessage("toolbar", "columnsFreezing"),
			applyText: getMessage("toolbar", "btnApply"),
			applyingText: getMessage("toolbar", "btnApplying"),
			tabsViews: ['Profiles', 'Edit'],
			initialTab: "Profiles",
			profiles: {
				onChange: function () {
					let profile = this.config.$ctrl.currentItem;
					let columnsLayout = profile.getColumnsLayout();
					//console.log("columnsLayout ", columnsLayout);
					let scanChildren = function (children) {
						children.each(function (column) {
							if (column.freezeBar) return;
							if (column.children.length > 0) return scanChildren.call(this, column.children);
							if (!column.hideable) return;
							let show = columnsLayout.hiddenColumns.includes(column.title) === false;
							this.changeHiddenState(column, false, show);
						}, this);
					};
					scanChildren.call($dropdowns.columnsLayout, $dropdowns.columnsLayout.children);
					$dropdowns.columnsLayout.removeBars();
					$dropdowns.columnsLayout.addBars(columnsLayout.leftFreezedColumns, columnsLayout.rightFreezedColumns);
					$dropdowns.columnsLayout.profile = columnsLayout;
				}
			},
			freeze: function (currentColumn) {
				for (let i = 0; i < this.columns.length; i++) {
					let column = this.columns[i];
					column.freeze = column.index < currentColumn.index;
				}
			},
			changeHiddenState: function (column, $event, show) {
				if (!column.hideable) return;
				if ($event) $event.stopPropagation();
				let dropdown = this;
				let hidden = !show;
				let scanChildren = function (column, parent) {
					if (column.freezeBar) return;
					if (column.children.length === 0) {
						if (column.hideable && column.hidden !== hidden) {
							column.hidden = hidden;
							this.columnsHidden += hidden ? 1 : -1;
						}
					} else {
						column.hiddenChildren = 0;
						column.children.each(function (child) {
							scanChildren.call(dropdown, child, child);
							column.hiddenChildren += child.hidden ? 1 : 0;
						}, dropdown);
						column.hidden = hidden;
					}
				};
				scanChildren.call(dropdown, column);
				let parent = column.$parent;
				while (!parent.isRoot) {
					parent.hiddenChildren += hidden ? 1 : -1;
					let initialHidden = parent.hidden;
					parent.hidden = parent.hiddenChildren === parent.children.length;
					if (!parent.$parent || initialHidden === parent.hidden) break;
					hidden = parent.hidden;
					parent = parent.$parent;
				}
			},
			showAll: function () {
				var scanChildren = function (children) {
					for (let i = 0; i < children.length; i++) {
						let column = children[i];
						if (column.freezeBar) continue;
						this.changeHiddenState(column, false, true);
					}
				};
				scanChildren.call(this, this.children);
			},
			hideAll: function () {
				var scanChildren = function (children) {
					for (let i = 0; i < children.length; i++) {
						let column = children[i];
						if (column.freezeBar) continue;
						this.changeHiddenState(column, false, false);
					}
				};
				scanChildren.call(this, this.children);
			},
			clearFreeze: function () {
				this.removeBars();
				this.addBars(0, 0);
			},
			freezedSortable: {
				name: "freezed",
				accept: function (sourceItemHandleScope, destSortableScope) {
					return true;
				},
				freeze: {
					setFrozenForChildren(item, frozenIndex, left) {
						for (let i = 0; i < item.children.length; i++) {
							let child = item.children[i];
							if (left && child.index >= this.rightFrozenIndex) break;
							if (!left && child.index <= this.leftFrozenIndex) continue;
							child.freezed = left ? child.index < frozenIndex : child.index >= frozenIndex;
							//console.log(this.leftFrozenIndex, this.rightFrozenIndex, child.index, child.headerTitle, child.freezed);
							if (child.children) this.setFrozenForChildren(child, frozenIndex, left);
						}
					},
					left: function (event, bar, data, oldIndex) {
						for (let i = 0; i < data.length; i++) {
							let item = data[i];
							if (item.index < this.rightFrozenIndex) item.freezed = item.index < bar.index;
							//console.log(this.leftFrozenIndex, this.rightFrozenIndex, item.index, item.headerTitle, item.freezed);
							if (item.children) this.setFrozenForChildren(item, bar.index, true);
						}
						$dropdowns.columnsLayout.children = data;
					},
					right: function (event, bar, data, oldIndex) {
						for (let i = 0; i < data.length; i++) {
							let item = data[i];
							if (item.index >= this.leftFrozenIndex) item.freezed = item.index >= bar.index;
							if (item.children) this.setFrozenForChildren(item, bar.index, false);
						}
						$dropdowns.columnsLayout.children = data;
					}
				},
				reindex(movedColumn) {
					let index = 0;
					let initialState = angular.copy(movedColumn);
					let list = [];
					var getChildren = function (column) {
						if (column.children && column.children.length > 0) column.children.each(getChildren);
						else {
							if (!column.freezeBar) {
								column.index = index++;
								let item = column;
								while (!item.$parent.isRoot && item === item.$parent.children[0]) {
									item = item.$parent;
									item.index = column.index;
								}
							}
							list.push(column);
						}
					};
					let data = $dropdowns.columnsLayout.children;
					data.each(getChildren);
					let left = list.findObjectIndex("left", "freezeBar");
					let right = list.findObjectIndex("right", "freezeBar");
					$dropdowns.columnsLayout.removeBars();
					let columnsNo = $controller.columns.no - ($controller.hasEmptyColumn ? 1 : 0);
					right = columnsNo - right + 1;
					$dropdowns.columnsLayout.addBars(left, right);
					console.log(left, right);
				},
				checkHiddenChildren(column) {
					let checkParent = function (parent) {
						while (!parent.isRoot) {
							let hiddenChildren = 0;
							let initialHidden = parent.hidden;
							parent.children.each(function (child) {//jshint ignore:line
								hiddenChildren += child.hidden ? 1 : 0;
							});
							parent.hidden = hiddenChildren == parent.children.length;
							if (initialHidden === parent.hidden) break;
							parent = parent.$parent;
						}
					};
					checkParent(column.initialParent);
					checkParent(column.$parent);
				},
				setFrozenForColumns(event) {
					var data = angular.copy($dropdowns.columnsLayout.children);
					var oldIndex = event.source.index;
					var bar = event.dest.sortableScope.modelValue[event.dest.index];
					if (bar.freezeBar === 'left') {
						if (event.dest.sortableScope.node.index >= this.freeze.rightFrozenIndex || (event.dest.index === 0 && !event.dest.sortableScope.node.isRoot)) return event.rollback();
						let newIndex = event.dest.index === 0 ? 0 : (event.dest.index === event.dest.sortableScope.modelValue.length - 1 ? event.dest.sortableScope.node.index + event.dest.sortableScope.node.colSpan : event.dest.sortableScope.modelValue[event.dest.index - 1].index + event.dest.sortableScope.modelValue[event.dest.index - 1].colSpan);
						let barInserted = event.dest.sortableScope.modelValue[event.dest.index];
						this.freeze.leftFrozenIndex = newIndex;
						bar.index = newIndex;
						this.freeze.left(event, bar, data, oldIndex);
					} else if (bar.freezeBar === 'right') {
						if (event.dest.sortableScope.node.index <= this.freeze.leftFrozenIndex || event.dest.index === 0) return event.rollback();
						let newIndex = event.dest.index === event.dest.sortableScope.modelValue.length - 1 ? event.dest.sortableScope.node.index + event.dest.sortableScope.node.colSpan : event.dest.sortableScope.modelValue[event.dest.index - 1].index + event.dest.sortableScope.modelValue[event.dest.index - 1].colSpan;
						let barInserted = event.dest.sortableScope.modelValue[event.dest.index];
						this.freeze.rightFrozenIndex = newIndex;
						bar.index = newIndex;
						this.freeze.right(event, bar, data, oldIndex);
					} else {
						let collection = event.dest.sortableScope.modelValue;
						let parentNode = event.dest.sortableScope.$parent.$parent.node;
						let initialParent = bar.$parent;
						let oldColumn = angular.copy(bar);
						this.reindex(bar);
						if (initialParent !== parentNode) {
							//bar.$parent.chidren.removeObject(bar.title, "title");
							bar.$level = parentNode.isRoot ? 0 : (parentNode.$level + 1);
							bar.initialParent = bar.initialParent || bar.$parent;
							bar.$parent = parentNode;
							let scanChildren = function (parent) {
								if (parent.freezeBar) return;
								parent.children.each(function (child) {
									child.$level = parent.$level + 1;
									scanChildren(child);
								});
							};
							scanChildren(bar);
							this.checkHiddenChildren(bar);
						}
						//console.log(collection, bar, parentNode, initialParent);
					}
				},
				itemMoved(event) {
					$dropdowns.columnsLayout.freezedSortable.setFrozenForColumns(event);
				},
				orderChanged: function (event) {
					$dropdowns.columnsLayout.freezedSortable.setFrozenForColumns(event);
				},
				clone: false,
				allowDuplicates: false
			},
			removeBars() {
				var scanChildren = function (children) {
					let index = -1;
					let length = children.length;
					let cloned = angular.copy(children);
					cloned.each(function (child, i) {
						index++;
						if (child.freezeBar) {
							let removed = children.splice(index, 1);
							// console.log("removed", i, removed);
							index--;
						} else {
							children[index].freezed = false;
							// console.log(i, child);
							if (children[index].children.length > 0) return scanChildren(children[index].children);
						}
					}, this);
					return true;
				};
				scanChildren(this.children);
			},
			addBars(leftFreezedColumns, rightFreezedColumns) {
				var columnsNo = $controller.columns.no;
				var leftColumn = {freezeBar: "left", hideable: false, canView: true, index: leftFreezedColumns, headerTitle: "left"};
				var rightColumn = {freezeBar: "right", hideable: null, canView: true, index: columnsNo - rightFreezedColumns - ($controller.hasEmptyColumn ? 1 : 0), headerTitle: "right"};
				this.addLeftFreezeBar(leftColumn);
				this.addRightFreezeBar(rightColumn);

			},
			addLeftFreezeBar(bar) {
				this.freezedSortable.freeze.leftFrozenIndex = bar.index;
				var scanChildren = function (children) {
					for (let i = 0; i < children.length; i++) {
						let child = children[i];
						child.freezed = child.index < bar.index;
						//console.log(bar.index, child.index, child.freezed, child.headerTitle);
						if (child.index === bar.index) {
							let parent = child.$parent;
							while (parent) {
								parent.collapsed = false;
								parent = parent.$parent;
							}
							children.splice(i, 0, bar);
							return true;
						}
						if (child.children && child.children.length > 0) if (scanChildren.call(this, child.children)) return true;
					}
					return false;
				};
				scanChildren.call(this, this.children);
			},
			addRightFreezeBar(bar) {
				this.freezedSortable.freeze.rightFrozenIndex = bar.index;
				var scanChildren = function (children, add) {
					for (let i = children.length - 1; i >= 0; i--) {
						let child = children[i];
						if (child.index >= this.freezedSortable.freeze.leftFrozenIndex) child.freezed = child.index >= bar.index;
						if (child.index === bar.index && add) {
							children.splice(i, 0, bar);
							let parent = child.$parent;
							while (parent) {
								parent.collapsed = false;
								parent = parent.$parent;
							}
							if (child.children) scanChildren.call(this, child.children, false);
							return true;
						}
						if (child.children) if (scanChildren.call(this, child.children, add)) return true;
					}
					return false;
				};
				if (bar.index >= this.columnsNo - 1) this.children.push(bar);
				else scanChildren.call(this, this.children, true);
			},
			onOpen: function () {
				var dropdown = this;
				$dropdowns.columnsLayout.profile = undefined;
				dropdown.children = angular.copy($controller.header.structure);
				dropdown.isRoot = true;
				dropdown.canView = true;
				dropdown.columnsNo = $controller.columns.no;
				dropdown.columnsHidden = $controller.columns.hidden;
				dropdown.columnsList = [];
				let headerRows = $controller.header.rows.headerRows;
				let scanChildren = function (children, parent) {
					let hiddenChildren = 0;
					let hideable = 0;
					children.each(function (child) {
						if (child.hideable) hideable++;
						if (child.children.length > 0) {
							child.collapsed = true;
							scanChildren(child.children, child);
						} else dropdown.columnsList.push(child);
						if (child.hidden) hiddenChildren++;
						child.$parent = parent;
						child.getHeader = function () {
							this.def.setAttribute("row-index", this.$level + 1);
							if (this.children.length > 0) this.def.removeAttribute("rowspan");
							else this.def.setAttribute("rowspan", headerRows - this.$level);
							let colSpan = 0;
							let countChildren = function (column) {
								// console.log(column);
								if (column.freezeBar) return;
								else if (column.children.length === 0) colSpan++;
								else column.children.each(countChildren);
							};
							countChildren(this);
							// console.log("header", this.def.innerHTML, this.$level + 1, this.def.getAttribute("rowspan"), colSpan, this.$parent.children.length);
							this.def.setAttribute("colspan", colSpan);
							return this.def;
						};
						child.getHeaders = function () {
							// console.log("header for ---", this.title);
							let headers = [];
							if (this.$parent.isRoot || this.$parent.children.length > 1) headers.push(this.getHeader());
							let parent = this.$parent;
							let column = this;
							while (!parent.isRoot && parent.children[0] === column) {
								if (parent.$level === 0 || parent.children.length > 0)
									headers.push(parent.getHeader());
								column = parent;
								parent = parent.$parent;
							}
							return headers;
						};
					}, this);
					if (!parent || children.length === 0) return;
					parent.hiddenChildren = hiddenChildren;
					parent.hidden = parent.children.length === hiddenChildren;
					parent.hideable = hideable > 0;
				};
				scanChildren.call(this, dropdown.children);
				if ($controller.attrs.customizableFreezedColumns !== "false" && $controller.attrs.freezeColumnsEnabled !== "false") this.addBars($controller.attrs.leftFreezedColumns, $controller.attrs.rightFreezedColumns);
			},
			onOpenFinish: function () {
				dropdownsStack.closePopupsFor($controller.element.linked);
				if (this.tabsViews.length > 1) return;
				let popup = this.popup;
				let height = popup.popupElement.find(".tabs-header").prop("offsetHeight") + popup.popupElement.find(".order-container").prop("offsetHeight") + 10;
				popup.popupElement.find(".tabs-header").hide();
				popup.popupElement.find("ax-tab-view").css("top", 0);
				popup.popupElement.find(".order-container").css("height", height + "px");
			},
			confirm: function () {
				var dropdown = this;
				let hiddenChanged = false;
				let columns = [];
				let index = 0;
				let columnsOrderChanged = false;
				var getChildren = function (column) {
					if (column.children && column.children.length > 0) column.children.each(getChildren);
					else {
						if (column.freezeBar || column.bindTo === "$$uid" || column.title === "Empty column") return;
						index++;
						let original = $controller.columns.hideable[column.index];
						if (original.index !== index) {
							columnsOrderChanged = true;
							original.def.setAttribute("column-index", index);
						}
						$(original.def).find(">ax-column-header").remove();
						column.getHeaders().each(function (header) {
							original.def.appendChild(header);
						});
						columns.push(original);
						if (original.hidden !== column.hidden && column.hideable) {
							$controller.changeColumnHiddenState(!column.hidden, original);
							hiddenChanged = true;
						}
					}
				};
				dropdown.children.each(getChildren);
				if (columnsOrderChanged) {
					$controller.element.initial.find("ax-column").remove();
					let columnsHtml = columns.each(function (column) {
						column.def.removeAttribute("left-freezed-column");
						column.def.removeAttribute("right-freezed-column");
						$(column.def).find("[hidden-column]").removeAttr("hidden-column");
						if (!column.hidden) column.def.removeAttribute("hidden-column");
						else column.def.setAttribute("hidden-column", "");
						$controller.element.initial.appendChild(column.def);
					});
				}
				let freezedChanged = false;
				if ($controller.attrs.customizableFreezedColumns !== "false" && $controller.attrs.freezeColumnsEnabled !== "false") {
					let leftFreezedColumns = this.freezedSortable.freeze.leftFrozenIndex;
					let rightFreezedColumns = $controller.columns.no - this.freezedSortable.freeze.rightFrozenIndex - ($controller.hasEmptyColumn ? 1 : 0);
					freezedChanged = $controller.attrs.leftFreezedColumns !== leftFreezedColumns || $controller.attrs.rightFreezedColumns !== rightFreezedColumns;
					if (freezedChanged) {
						$controller.setAttribute('left-freezed-columns', leftFreezedColumns);
						$controller.setAttribute('right-freezed-columns', rightFreezedColumns);
					}
				}
				if (this.profiles.selected) $controller.profiles.selected.columns = this.profiles.selected;

				let changeAttributes = false;
				let changeToolbar = false;

				if ($dropdowns.columnsLayout.profile) {
					if ($dropdowns.columnsLayout.profile.attributes.length > 0) {
						let attributes = $dropdowns.columnsLayout.profile.attributes[0].attributes;
						for (let i = 0; i < attributes.length; i++) {
							let attributeNode = attributes[i];
							$controller.setAttribute(attributeNode.nodeName, attributeNode.nodeValue);
							changeAttributes = true;
						}
					}
					if ($dropdowns.columnsLayout.profile.toolbar.length > 0) {
						var element = $controller.element.initial;
						element.find(">ax-toolbar").remove();
						element[0].innerHTML = element[0].innerHTML + $dropdowns.columnsLayout.profile.toolbar[0].outerHTML;
						changeToolbar = true;
					}
				}
			},
		};
		this.groupEdit = {
			popupStopProp($event) {
				$event.stopPropagation();
			},
			changeCalculationsOrder: {
				name: "grouping",
				accept: function (sourceItemHandleScope, destSortableScope) {
					return sourceItemHandleScope.sortableScope === destSortableScope;
				},
				orderChanged: function (event) {
					var ctrl = event.dest.sortableScope.element.scope().$ctrl;
					var dataItem = ctrl.dataItemClean(event.source.itemScope.modelValue);
					var data = event.dest.sortableScope.modelValue;
					let columnIndex = -1;
					let columnTitle = "xxx";
					let count = 0;
					data.each(function (item, i) {
						if (columnTitle !== item.column) {
							let column = $dropdowns.dataGrouping.edit.columns.findObject(item.column, "title");
							columnIndex = column.index;
							count = 0;
						} else count++;
						item.index = columnIndex * 100 + count;
					}, this);
					ctrl.datasourceChanged(false, dataItem);
				},
				itemMoved: function () {
					console.log("moved");
					return false;
				}
			},
			title: getMessage('toolbar', 'dataGroupingEdit'),
			okText: getMessage("common", "save"),
			form: {},
			setPosition(popup) {
				popup.setPosition({popupRelativeLeft: this.advanced ? -510 : -300});
			},
			clearCalculations: function (allLevels) {
				this.getCtrl(allLevels).datasourceSet([]);
			},
			getCtrl(allLevels) {
				let parent = allLevels ? this.allLevels : this;
				return this.advanced ? parent.calculationsConfigAdvanced.$ctrl : parent.calculationsConfig.$ctrl;
			},
			addCalculation(allLevels) {
				var item = {
					type: "sum",
					displayLabel: "false",
					showOn: "header",
					initialValue: "0"
				};
				this.getCtrl(allLevels).dataItemAdd(item);
			},
			message: function (type) {
				switch (type) {
					case "show-footer":
						return `Group footer will be shown only for Show calculation on is 'footer' or 'both' on 'Calculations for this level' section. `;
					case "edit-calculations":
						return this.allLevelsCalculations ? `This group level will use calculations defined as All levels. Here you can add/delete calculations for all levels` : `This group level will use calculations defined here, not the defined as All levels !!!!!! Changes will not affect calculations defined as All levels.`;
					case "edit-this-level-calculations":
						return `These calculations will be shown only on this level if 'For this level use All levels calculations' is NOT checked.`;
					case "edit-all-levels-calculations":
						return `These calculations will be shown on levels with 'For this level use All levels calculations' checked.`;
				}
			},
			advanced: false,
			changeColumn(column, allLevels) {
				let index = column.index;
				column = this.bindableColumns.findObject(index, "index");
				if (!column) return;
				let ctrl = this.getCtrl(allLevels);
				let dataItem = ctrl.currentItem;
				let calculations = ctrl.getCollection('ordered');
				let existing = index * 100;
				calculations.each(function (calculation) {
					if (calculation.$$uid === dataItem.$$uid) return true;
					if (calculation.column === column.title) existing = Math.max(existing, calculation.index);
				}, this);
				dataItem.expression = "dataItem['" + column.bindTo + "']";
				dataItem.column = column.title;
				dataItem.name = column.bindTo + "-" + dataItem.type;
				let changed = (dataItem.index !== existing + 1);
				dataItem.index = existing + 1;
				if (changed) ctrl.datasourceChanged(false, dataItem);
			},
			changeAgg(allLevels) {
				let dataItem = this.getCtrl(allLevels).currentItem;
				let column = this.bindableColumns.findObject(dataItem.column, "title");
				if (!column) return console.error("Not found column with header " + dataItem.column);
				dataItem.name = column.bindTo + "-" + dataItem.type;
			},
			aggregationTypes: $dropdowns.aggregationsTypes,
			showOnItems: [{id: "header"}, {id: "footer"}, {id: "both"}, {id: "false"}],
			colorHtml: `<div ng-style="{'background-color': dropdown.dropdownModel}" style="width:100%;height:100%"></div>`,
			changeShowCalculationOn: function () {
				if (this.group.showCalculationsOn !== undefined) this.group.footer.show = ['both', 'footer'].indexOf(this.group.showCalculationsOn) > -1;
				else this.group.footer.show = ['both', 'footer'].indexOf(this.allLevels.showOn) > -1;
			},
			getCalculations: function () {
				var calculations = angular.copy(this.initial.calculations) || {};
				let dropdown = this;
				this.group.calculations = [];
				var calcFields = Object.keys(calculations);
				for (let i = 0; i < calcFields.length; i++) {
					let calcName = calcFields[i];
					let calculation = calculations[calcName];
					calculation.showLabel = calculation.displayLabel !== "false";
					if (!calculation.showLabel) calculation.labelText = "";
					else calculation.labelText = calculation.displayLabel;
					this.group.calculations.push(calculation);
				}
				dropdown.calculationsConfig = {
					controllerIsCreated: function () {
						this.$ctrl.datasourceSet(dropdown.group.calculations);
					}
				};
				dropdown.calculationsConfigAdvanced = {
					controllerIsCreated: function () {
						this.$ctrl.datasourceSet(dropdown.group.calculations);
					}
				};
				calculations = angular.copy(this.grouping.allLevelsCalculations) || {};
				this.allLevels = {
					calculations: [],
					calculationsConfig: {
						controllerIsCreated: function () {
							this.$ctrl.datasourceSet(dropdown.allLevels.calculations);
						}
					},
					calculationsConfigAdvanced: {
						controllerIsCreated: function () {
							this.$ctrl.datasourceSet(dropdown.allLevels.calculations);
						}
					},
					showOn: this.grouping.showCalculationsOn
				};
				calcFields = Object.keys(calculations);
				for (let i = 0; i < calcFields.length; i++) {
					let calcName = calcFields[i];
					let calculation = calculations[calcName];
					calculation.showLabel = calculation.displayLabel !== "false";
					if (!calculation.showLabel) calculation.labelText = "";
					else calculation.labelText = calculation.displayLabel;
					this.allLevels.calculations.push(calculation);
				}
			},
			onOpen: function (params) {
				var dropdown = this;
				this.advanced = false;
				dropdown.initial = params[1];
				dropdown.grouping = params[3];

				dropdown.group = angular.copy(params[1]);
				let colorsCodes = axUtils.niceColors();
				if (colorsCodes.indexOf(dropdown.group.header.backgroundColor) === -1) colorsCodes.push(dropdown.group.header.backgroundColor);
				dropdown.colors = new Array(colorsCodes.length);
				colorsCodes.each(function (color, i) {
					this.colors[i] = {id: color};
				}, this);
				this.getCalculations();
				dropdown.columns = params[2];
				dropdown.allColumns = params[4];
				dropdown.bindableColumns = params[5];
				this.changeShowCalculationOn();
				dropdown.openFinish = true;
			},
			confirm(event) {
				angular.extend(this.initial, this.group);
				if (this.initial.allLevelsCalculations) {
					let calculations = this.allLevels.calculations;
					this.grouping.allLevelsCalculations = {};
					this.grouping.showCalculationsOn = this.allLevels.showOn;
					for (let i = 0; i < calculations.length; i++) {
						let calculation = calculations[i];
						if (!calculation.showLabel) calculation.displayLabel = "false";
						else calculation.displayLabel = calculation.labelText;
						this.grouping.allLevelsCalculations[calculation.name] = calculation;
					}

				} else {
					let calculations = this.group.calculations;
					this.initial.calculations = {};
					for (let i = 0; i < calculations.length; i++) {
						let calculation = calculations[i];
						if (!calculation.showLabel) calculation.displayLabel = "false";
						else calculation.displayLabel = calculation.labelText;
						this.initial.calculations[calculation.name] = calculation;
					}

				}
				this.close(event);
			},

		};
		this.dataGrouping = {
			edit: this.groupEdit,
			title: getMessage('toolbar', 'dataGrouping'),
			applyText: getMessage("toolbar", "btnApply"),
			applyingText: getMessage("toolbar", "btnApplying"),
			tabsViews: ['Profiles', 'Edit'],
			initialTab: "Profiles",
			editTemplate: $controller.$template.attributes["profiles-list-template"] || '/components/controls/table/templates/ax-table-profiles-list.html',
			columns: {
				validate: function (column, data, level) {
					let group = column.bindTo ? $controller.$template.grouping.createGroupFromColumn(column, level) : column;

					let initial = angular.copy(data);
					data = initial.filter(function (group, level) {
						return group.expression === "true" || group.bindTo === "true";
					});
					initial.each(function (group, level) {
						if (group.expression === "true" || group.bindTo === "true") return;
						data.push(group);
					});
					data.each(function (group, level) {
						group.level = level;
					});
					let bindTo = column.bindTo ? column.bindTo : column.order;
					let existing = data.filter(function (group, i) {
						return (group.bindTo ? group.bindTo === bindTo : group.order === bindTo);
					}, this);
					let interpolated = [];
					let lastLevel = -1;
					existing.each(function (group, i) {
						if (i > 0 && group.level !== lastLevel + 1)
							for (let i = lastLevel + 1; i < group.level; i++) {
								interpolated.push(data[i]);
							}
						lastLevel = group.level;
					});
					interpolated.each(function (group, i) {
						data.removeObject(group.$$uid, "$$uid");
					}, this);
					let insertTo = data.findObjectLastIndex(existing[existing.length - 1].$$uid, "$$uid") + 1;
					interpolated.each(function (group, i) {
						data.removeObject(group.$$uid, "$$uid");
						data.splice(insertTo, 0, group);
						insertTo++;
					}, this);


					for (let i = 0; i < data.length; i++) {
						let itemGroup = data[i];
						if (itemGroup.title === group.label) {
							itemGroup = group;
							data[i] = itemGroup;
						}
						itemGroup.level = i;
					}
					$dropdowns.dataGrouping.grouping.$ctrl.datasourceSet(data);
					return group;
				},
				asSortable: {
					name: "columns",
					itemMoved: function (event) {
						let column = event.source.itemScope.modelValue;
						var data = event.dest.sortableScope.modelValue;
						let level = event.dest.index;
						column.isTaken = true;
						$dropdowns.dataGrouping.columns.validate(column, data, level);
					},
					clone: true,
					allowDuplicates: false
				}
			},
			clear: function () {
				$dropdowns.dataGrouping.grouping.$ctrl.datasourceSet([]);
				this.columns.data.each(function (column) {
					if (!column.isTaken) return;
					column.isTaken = false;
					this.selectColumn(column);
				}, this);
			},
			grouping: {
				remove: function (group, $event) {
					$event.stopPropagation();
					$dropdowns.dataGrouping.grouping.$ctrl.dataItemRemove(group);
					if (group.expression === "true") {
						let cnt = $dropdowns.dataGrouping.grouping.data.countObject(group.expression, "expression");
						if (cnt === 0) {
							let groupable = $dropdowns.dataGrouping.columns.data.findObject(group.expression, "bindTo");
							groupable.isTaken = false;
						}
					} else {
						let currentGroupColumns = $dropdowns.dataGrouping.getColumnsGroup(group);
						let allGroupsColumns = [];
						$dropdowns.dataGrouping.grouping.data.each(function (itemGroup) {
							if (group.$$uid === itemGroup.$$uid) return;
							let columns = $dropdowns.dataGrouping.getColumnsGroup(itemGroup);
							columns.each(function (column) {
								allGroupsColumns.push(column);
							}, this);
						}, this);
						currentGroupColumns.each(function (column) {
							if (allGroupsColumns.includes(column)) return;
							let groupable = $dropdowns.dataGrouping.columns.data.findObject(column.title, "title");
							groupable.isTaken = false;
							$dropdowns.dataGrouping.selectColumn(groupable);
						}, this);
						$dropdowns.dataOrder.orderedValidate();
					}
				},
				asSortable: {
					name: "grouping",
					orderChanged: function (event) {
						var column = event.source.itemScope.modelValue;
						var data = event.dest.sortableScope.modelValue;
						let level = event.dest.index;
						$dropdowns.dataOrder.removeFixed();
						$dropdowns.dataGrouping.columns.validate(column, data, level);
						$dropdowns.dataGrouping.grouping.data.each(function (group) {
							let columns = this.getColumnsGroup(group);
							columns.each(function (column) {
								column.isTaken = true;
								column.fixed = true;
								$dropdowns.config.dataOrder.selectColumn(column);
							}, this);
						}, $dropdowns.dataGrouping);

						$dropdowns.dataOrder.orderedValidate();
					}
				}
			},
			profiles: {
				onChange: function () {
					let profile = this.config.$ctrl.currentItem;
					let grouping = profile.getGrouping();
					$dropdowns.dataGrouping.prepareData(grouping);
				}
			},
			confirm: function () {
				if (this.profiles.selected) $controller.profiles.selected.grouping = this.profiles.selected;
				if (this.columns.data)
					$controller.$template.grouping.createAxGroupsTemplate($controller, this.grouping);
			},
			getColumnsGroup: function (group) {
				let columns = [];
				let orderBy = group.order.split(',');
				orderBy.each(function (order) {
					if (order === "") return;
					let bindTo = order.startsWith("-") ? order.substring(1) : order;
					let column = $dropdowns.dataOrder.unordered.findObject(bindTo, "field");
					if (!column) return;
					column.asc = !order.startsWith("-");
					columns.push(column);
				}, this);
				return columns;
			},
			prepareData: function (groups) {
				if (this.grouping.$ctrl) this.grouping.$ctrl.dataLoaded = false;
				this.grouping.data = groups.defs;
				this.grouping.showCalculationsOn = groups.showCalculationsOn;
				this.grouping.allLevelsCalculations = {};
				var calcFields = Object.keys(groups.allLevelsCalculations || {});
				calcFields.each(function (calcName) {
					let calculation = groups.allLevelsCalculations[calcName];
					this.grouping.allLevelsCalculations[calcName] = calculation;
				}, this);
				this.grouping.data.each(function (group) {
					if (group.expression === "true") {
						let column = this.columns.data.findObject(group.expression, "bindTo");
						column.isTaken = true;
					} else {
						let columns = this.getColumnsGroup(group);
						columns.each(function (column) {
							column.fixed = true;
							if (!column.isTaken) {
								column.isTaken = true;
								$dropdowns.config.dataOrder.selectColumn(column);
							}
							column = this.columns.data.findObject(column.title, "title");
							column.isTaken = true;
						}, this);
					}
				}, this);

			},
			selectColumn: function (column) {
				if (column.isTaken) {
					let data = this.grouping.data;
					let level = data.length;
					data.push(column);
					this.columns.validate(column, data, level);
					if (column.bindTo === "true") return;
					let orderColumn = $dropdowns.dataOrder.unordered.findObject(column.title, "title");
					orderColumn.fixed = true;
					if (!orderColumn.isTaken) {
						orderColumn.isTaken = true;
						$dropdowns.dataOrder.selectColumn(orderColumn);
					}
					$dropdowns.dataOrder.orderedValidate();
				} else {
					let orderedColumn = $dropdowns.dataOrder.ordered.findObject(column.title, "title");
					if (orderedColumn) orderedColumn.fixed = false;
					let data = angular.copy(this.grouping.data);
					let bindTo = column.invariantField || column.bindTo;
					let ctrl = $dropdowns.dataGrouping.grouping.$ctrl;
					data.each(function (group) {
						if (bindTo === "true" && group.expression === "true") {
							ctrl.dataItemRemove(group);
						} else {
							let columns = this.getColumnsGroup(group);
							if (columns.findObject(bindTo, "invariantField") || columns.findObject(bindTo, "field")) ctrl.dataItemRemove(group);
						}
					}, this);
					this.grouping.data.each(function (group, level) {
						group.level = level;
					}, this);
				}
			},
			onOpen: function () {
				var dropdown = this;
				dropdown.columns.all = angular.copy($controller.columns.hideable);
				dropdown.columns.hideable = angular.copy($controller.columns.hideable);
				while (true) {
					let index = dropdown.columns.hideable.findObjectIndex(false, "sortable");
					if (index === -1) break;
					dropdown.columns.hideable.splice(index, 1);
				}
				dropdown.columns.bindable = angular.copy($controller.columns.hideable);
				while (true) {
					let index = dropdown.columns.bindable.findObjectIndex(null, "bindTo");
					if (index === -1) break;
					dropdown.columns.bindable.splice(index, 1);
				}
				dropdown.columns.bindable.removeObject("$$uid", "bindTo");
				dropdown.columns.data = angular.copy(dropdown.columns.hideable);
				let index = dropdown.columns.data.findObjectIndex("$$uid", "bindTo");
				if (index > -1) dropdown.columns.data.splice(index, 1);

				$controller.$template.grouping.addAllRecordsColumn(dropdown.columns.data);
				this.prepareData(angular.copy($controller.groups));
			},
			onOpenFinish: function () {
				if (this.tabsViews.length > 1) return;
				let popup = this.popup;
				let height = popup.popupElement.find(".tabs-header").prop("offsetHeight") + popup.popupElement.find(".order-container").prop("offsetHeight") + 10;
				popup.popupElement.find(".tabs-header").hide();
				popup.popupElement.find("ax-tab-view").css("top", 0);
				popup.popupElement.find(".order-container").css("height", height + "px");
			},
		};
		this.filtersConfig = {
			onOpen: function (params) {
				var dropdown = this;
				dropdownsStack.closePopupsFor($controller.element.linked);
				this.column = params[1];
				this.filterType = params[2];
				this.settings = $controller.filters.config[this.column];
				dropdown.openFinish = true;
				return true;
			},
			onChange() {
				switch (this.filterType) {
					case "date-time":
					case "datetime":
					case "date":
					case "number":
						var classes = "";
						switch (this.settings.operator) {
							case "Between":
								classes = "between";
								break;
							case "Bigger":
								classes = "bigger-than";
								//$controller.filters.range[this.column].maxValue = undefined;
								break;
							case "Less":
								classes = "less-than";
								//$controller.filters.range[this.column].minValue = undefined;
								break;
							case "Exact":
								classes = "exact";
								break;
							default:
								return;
						}
						if (classes !== "equal" && this.settings.orEqual) classes += " equal";
						$controller.filters.range[this.column].operator = classes;
						$controller.filters.range[this.column].includeNulls = this.settings.includeNulls;
						$controller.$timeout(function () {
							$controller.$layout.set.heightChanged();
						});

						break;
				}
				$controller.filterApply();
			}
		};
		this.dataOrder = {
			title: getMessage("toolbar", "arrangeRowOrders"),
			applyText: getMessage("toolbar", "btnApply"),
			applyingText: getMessage("toolbar", "btnApplying"),
			change: function (column) {
				column.asc = !column.asc;
				this.orderChanged = true;
			},
			remove: function (column, event) {
				event.stopPropagation();
				if (column.fixed) return;
				this.orderChanged = true;
				this.unordered.findObject(column.title, "title").isTaken = false;
				$dropdowns.dataOrder.orderedConfig.$ctrl.dataItemRemove(column);
				if ($dropdowns.config.openFinish) $dropdowns.dataOrder.unorderedConfig.$ctrl.datasourceChanged();
				if (column === this.sortableColumn) {
					this.sortableColumnAdded = false;
				}
			},
			clear: function () {
				this.orderChanged = true;
				$dropdowns.dataOrder.unordered.each(function (column) {
					let isTaken = column.isTaken;
					column.isTaken = false;
					column.fixed = false;
					if (isTaken) $dropdowns.dataOrder.selectColumn(column, false);
				});
			},
			selectColumn: function (column, userClick) {
				this.orderChanged = true;
				if ($dropdowns.config.openFinish1 === false) { // nu stiu pt. ce e aceasta conditie
					$dropdowns.dataOrder.ordered.push(column);
				} else {
					if (userClick && column.fixed) {
						column.isTaken = true;
						return;
					}
					if (column.isTaken) {
						$dropdowns.dataOrder.orderedConfig.$ctrl.dataItemAdd(column, false);
					} else $dropdowns.dataOrder.orderedConfig.$ctrl.dataItemRemove(column, false);
				}
				if (userClick) this.orderedValidate();
			},
			removeFixed: function () {
				let data = $dropdowns.dataOrder.ordered;
				let ordered = [];
				data.each(function (item, i) {
					if (!item.fixed && item.isTaken) ordered.push(item);
					if (item.fixed) item.fixed = false;
				}, this);
				$dropdowns.dataOrder.orderedConfig.$ctrl.datasourceSet(ordered);

			},
			orderedValidate: function () {
				let data = $dropdowns.dataOrder.ordered;
				let ordered = data.filter(function (item) {
					return item.fixed;
				});
				data.each(function (item, i) {
					if (!item.fixed) ordered.push(item);
				}, this);
				$dropdowns.dataOrder.orderedConfig.$ctrl.datasourceSet(ordered);
			},
			orderedSortable: {
				name: "ordered",
				accept: function (sourceItemHandleScope) {
					sourceItemHandleScope.itemScope.modelValue.asc = true;
					return true;
				},
				orderChanged: function () {
					$dropdowns.dataOrder.orderChanged = true;
					$dropdowns.dataOrder.orderedValidate();
				},
				clone: false,
				allowDuplicates: false
			},
			unorderedSortable: {
				name: "unordered",
				itemMoved: function (event) {
					let column = event.source.itemScope.modelValue;
					var data = event.dest.sortableScope.modelValue;
					let level = event.dest.index;
					column.asc = true;
					column.isTaken = true;
					let ordered = data.filter(function (item) {
						return item.fixed;
					});
					data.each(function (item, i) {
						if (!item.fixed) ordered.push(item);
					}, this);
					$dropdowns.dataOrder.ordered = ordered;
					$dropdowns.dataOrder.unorderedConfig.$ctrl.datasourceChanged(false, column);
					$dropdowns.dataOrder.orderedConfig.$ctrl.datasourceChanged(false, column);

				},
				clone: true,
				allowDuplicates: false
			},
			confirm: function ($event) {
				$controller.clearOrderBy();
				angular.forEach(this.ordered,
					function (column) {
						$controller.setColumnSortableType(column.field, column.asc ? 'asc' : 'desc', true);

					});
				$controller.changeOrderBy(true);
			},
			onOpen: function (partial) {
				var dropdown = this;
				this.sortableColumn = undefined;
				this.sortableColumnAdded = false;
				this.orderChanged = false;
				var columns = angular.copy($controller.columns.sortable);
				angular.forEach(columns,
					function (column) {
						column.index1 = -1;
					});
				dropdown.ordered = [];
				var groupsOrders = $controller.attrs.groupsOrderBy ? $controller.attrs.groupsOrderBy.split(',').length : -1;
				$controller.columns.ordered.each(function (ordered, index) {
					var origin = columns.findObject(ordered.field, 'field');
					if (!origin) return;
					origin.asc = ordered.asc;
					origin.index1 = index;
					origin.fixed = origin.index1 < groupsOrders;
					dropdown.ordered.push(angular.copy(origin));
				});
				dropdown.unordered = [];
				columns.each(function (column) {
					if (column.index1 !== -1) column.isTaken = true;
					column.asc = true;
					dropdown.unordered.push(angular.copy(column));
				});
			}
		};
		this.columnMenu = {
			fit: function ($event, all) {
				if (all) $controller.columnsAutoFitAll();
				else $controller.columnAutoFit(this.th[0], this.columnIndex);
				this.close($event);
			},
			hide: function () {
				var dropdown = this;
				$controller.columns.hideable.each(function (column) {
					if (column.index === dropdown.columnIndex) {
						$controller.changeColumnHiddenState(false, column);
					}
				});
				dropdownsStack.closePopupsFor($controller.element.linked);
				$controller.render({animation: false});
			},
			freezeLeft: function ($event) {
				if ($controller.attrs.leftFreezedColumns === (this.columnIndex + 1)) $controller.setAttribute("left-freezed-columns", 0, true);
				else $controller.setAttribute("left-freezed-columns", this.columnIndex + 1, true);
			},
			freezeRight: function ($event) {
				if (this.rightColumnIndex + 1 === $controller.attrs.rightFreezedColumns) $controller.setAttribute("right-freezed-columns", 0, true);
				else $controller.setAttribute("right-freezed-columns", this.rightColumnIndex + 1, true);
			},
			sort: function ($event) {
				this.dataOrder.sortableColumn.isTaken = true;
				this.dataOrder.selectColumn(this.dataOrder.sortableColumn, true);
				this.dataOrder.sortableColumnAdded = true;
			},
			getFilterMenu(column) {
				var menu = $controller.$template.getDirectChildrenOfType("AX-COLUMN-FILTER-MENU", column);
				if (menu.length === 0) return false;
				var options = $controller.$template.getDirectChildrenOfType("AX-COLUMN-FILTER", menu[0]);
				if (options.length < 2) return false;
				this.filterMenuOptions = [];
				var currentOption = $controller.columns.filters[column.getAttribute("column-index")].name;
				for (let i = 0; i < options.length; i++) {
					let option = options[i];
					let item = {id: option.getAttribute("label"), template: option};
					if (option.getAttribute("label") === currentOption) item.selected = true;
					this.filterMenuOptions.push(item);
				}
				return true;
			},
			filterSelect(option) {
				let self = this;
				$controller.$template.changeCurrentFilter(this.columnDef, option);
				$controller.$timeout(function () {
					$controller.$layout.set.heightChanged();
					self.close();
				});
			},
			showColumn(column, event) {
				this.shouldRender = true;
				$controller.changeColumnHiddenState(true, column);
				this.hiddenColumns.removeObject(column.title, "title");
				event.stopPropagation();
			},
			onClose() {
				let config = {animation: false};
				if (this.dataOrder.orderChanged) {
					config.dataReload = true;
					this.dataOrder.confirm();
					this.shouldRender = true;
					//$controller.setOrderBy();
					//$controller.orderApply();
				}
				if (this.shouldRender) {
					dropdownsStack.closePopupsFor($controller.element.linked);
					$controller.render(config);
				}
			},
			onOpenFinish() {
				let popup = this.popup;
				let width = popup.popupElement.find(".config-body").width();
				if (this.show) {
					let selector = ".column-cmd[ng-click=\"launcher.show='" + this.show + "'\"]";
					popup.popupElement.find(selector).focus();
				}
			},
			dataOrder: $dropdowns.dataOrder,
			onOpen: function (params) {
				var dropdown = this;
				this.shouldRender = false;
				dropdownsStack.closePopupsFor($controller.element.linked);
				var event = params[0];
				this.th = angular.element(event.currentTarget).closest('th');
				this.sortable = this.th.attr('sortable');
				dropdown.dataOrder.onOpen();
				this.dataOrder.sortableColumn = this.dataOrder.unordered.findObject(this.sortable, "field");
				this.columnIndex = parseInt(this.th.attr('column-index'));
				this.rightColumnIndex = $controller.columns.no - this.columnIndex - ($controller.hasEmptyColumn ? 2 : 1);
				this.freezed = {
					left: $controller.attrs.leftFreezedColumns === (this.columnIndex + 1) ? "Clear all left freezed columns" : "Set as last left freezed column",
					right: (this.rightColumnIndex + 1) === $controller.attrs.rightFreezedColumns ? "Clear all right freezed columns" : "Set as last right freezed column"
				};
				this.columnDef = $controller.columns.defs[this.columnIndex];
				if ($controller.attrs.customizableFreezedColumns === "true") {
					this.leftFreezable = !this.columnDef.hasAttribute("right-freezed-column") && $controller.attrs.customizableFreezedColumns === "true";
					this.rightFreezable = !this.columnDef.hasAttribute("left-freezed-column") && $controller.attrs.customizableFreezedColumns === "true";
				} else {
					this.leftFreezable = false;
					this.rightFreezable = false;
				}
				this.hideable = this.columnDef.getAttribute('hideable') !== 'false';
				this.hiddenColumns = $controller.columns.hideable.filter(function (column) {
					return column.hideable && column.hidden;
				});
				this.headerFor = this.th.attr('header-for');
				this.autoFitEnabled = $controller.attrs.columnsAutofitEnabled !== "false";
				this.hasFilterMenu = this.getFilterMenu(this.columnDef);
				$controller.attrs.groupsOrderBy.split(',');
				this.isGrouping = $controller.attrs.groupsOrderBy.split(',').includes(this.sortable);
				this.header = this.th.attr('header');
				this.currentOrder = $controller.getColumnOrder(this.sortable);
				dropdown.openFinish = true;
			}
		};
		this.paginator = {
			title: getMessage("pagination", "pageSizeSetting"),
			applyText: getMessage("toolbar", "btnApply"),
			applyingText: getMessage("toolbar", "btnApplying"),
			confirm: function () {
				var compile = ($controller.attrs.pageSize === 'ALL' && this.pageSize !== 'ALL' || $controller.attrs.pageSize !== 'ALL' && this.pageSize === 'ALL');
				$controller.setAttribute("page-size", this.pageSize);
				if (compile) {
					$controller.changePagination = true;
					dropdownsStack.closePopupsFor($controller.element.linked);
					$controller.render();
				} else {
					$controller.currentRowIndex = 0;
					$controller.currentPage = 1;
					$controller.paginateApply(true, true);
				}
				this.close();
			},
			onOpen: function () {
				dropdownsStack.closePopupsFor($controller.element.linked);
				this.pageSize = $controller.attrs.pageSize;
				this.hasVariableRowHeight = $controller.hasVariableRowHeight;
				this.sizes = $controller.attrs.pageSizes.replaceAll(" ", "").split(',');
				this.openFinish = true;
			}
		};
		this.delete = {
			title: getMessage("toolbar", "confirmDeletion"),
			okText: getMessage("common", "delete"),
			message: "",
			confirm: function ($event) {
				$controller.delete(this.arguments[1]);
				$event.stopPropagation();
			},
			onOpen: function (params) {
				this.arguments = params;
				dropdownsStack.closePopupsFor($controller.element.linked);
				this.message = $controller.setConfirmDeleteMessage(params[1]);
				this.openFinish = true;
			}
		};
		this.fieldEdit = {
			title: getMessage("toolbar", "editField"),
			okText: "Save",
			confirm: function () {
				this.dataItem[this.currentField] = this.editingValue;
				let saveData = this.originalElement.attr("save-data");
				if (saveData) this.originalElement.scope().$eval(saveData);
				this.close();
			},
			onOpen: function (params) {
				this.originalElement = angular.element(params[0].target).closest("ax-dropdown-popup");
				dropdownsStack.closePopupsFor($controller.element.linked);
				this.readOnly = angular.element(params[0].target).closest("[type=text-with-zoom]").hasAttribute("readonly");
				this.dataItem = params[1];
				this.currentField = params[2];
				this.arguments = params;
				this.originalValue = this.dataItem[this.currentField];
				this.editingValue = this.dataItem[this.currentField];
				this.openFinish = true;
			}
		};
		this.profiles = {
			config: {
				currentItemChanged: function (profile) {
					if (!profile) return;
					let columnsLayout = profile.getColumnsLayout();
					if (profile.grouping) {
						$dropdowns.config.dataOrder.clear();
						$dropdowns.dataGrouping.clear();
						let grouping = profile.getGrouping();
						$dropdowns.dataGrouping.prepareData(grouping);
					}
					if (columnsLayout) {
						//console.log("columnsLayout ", columnsLayout);
						let scanChildren = function (children) {
							children.each(function (column) {
								if (column.freezeBar) return;
								if (column.children.length > 0) return scanChildren.call(this, column.children);
								if (!column.hideable) return;
								let show = columnsLayout.hiddenColumns.includes(column.title) === false;
								this.changeHiddenState(column, false, show);
							}, this);
						};
						scanChildren.call($dropdowns.columnsLayout, $dropdowns.columnsLayout.children);
						$dropdowns.columnsLayout.removeBars();
						$dropdowns.columnsLayout.addBars(columnsLayout.leftFreezedColumns, columnsLayout.rightFreezedColumns);
						$dropdowns.columnsLayout.profile = columnsLayout;
						if (columnsLayout.attributes.length > 0 && columnsLayout.attributes[0].hasAttribute("order-by")) {
							let orderBy = columnsLayout.attributes[0].getAttribute("order-by");
							let orderArray = orderBy.split(",");
							if (!profile.grouping) $dropdowns.config.dataOrder.clear();
							orderArray.each(function (orderItem) {
								if (orderItem === "") return;
								orderItem = orderItem.trim();
								let direction = orderItem.startsWith("-") ? -1 : 1;
								if (direction < 0) orderItem = orderItem.substring(1);
								let column = $dropdowns.config.dataOrder.unordered.findObject(orderItem, "field");
								if (!column) return console.error("Not found sortable column for field", orderItem);
								column.isTaken = true;
								column.asc = direction === 1;
								$dropdowns.config.dataOrder.selectColumn(column);
							});
						}
					}

				}
			}
		};
		this.config = {
			title: getMessage("toolbar", "config"),
			applyText: getMessage("toolbar", "btnApply"),
			clearAllText: getMessage("toolbar", "btnClearAll"),
			applyingText: getMessage("toolbar", "btnApplying"),
			applySelectedText: getMessage("toolbar", "btnApplySelected"),
			saveProfileText: getMessage("toolbar", "btnSaveProfile"),
			getHelpFor: function (title) {
				switch (title) {
					case "Profiles":
						return `<strong>Profiles</strong>:
<br>Select the profile you want, changes some settings, and than apply changes you want.`;
					case "Columns Layout":
						return `<strong>Columns Layout</strong>:<br/>
Drag Left or Right freezed bar to delimites the left or right freezed columns.
<br>Click on Eye <i class='fa fa-eye'></i> to hide column or all children columns
<br>Click on slashed eye <i class='fa fa-eye-slash'></i> to hide column or all children columns.
`;
					case "Ordering":
						return `<strong>Data ordering</strong>:
<br/>Select or drag a Sortable column in Ordered List, to order data records by theses columns. 
<br>Drag items in Ordered list to change ordering.
<br>Order made by grouping rules are disabled. 
<br>To remove or changes, remove or changes Grouping columns List`;
					case "Grouping":
						return `<strong>Data grouping</strong>:
<br/>Select or drag a Groupable column in Grouping list, to group data records by these column.
<br>All records - it's for made calculations for all data collection.
<br>You can group by same column more than once when you need to made more calculations on one column and to put one below the other.
<br>Click group <i class='fa fa-edit'></i> icon to create calculations or change setting for footer/header group.`;
				}
			},
			columnsLayout: this.columnsLayout,
			dataGrouping: this.dataGrouping,
			dataOrder: this.dataOrder,
			profiles: this.profiles,
			popups: {
				profiles: {
					profiles: this.profiles,
				},
				columnsLayout: {
					columnsLayout: this.columnsLayout,
				},
				dataOrder: {
					dataOrder: this.dataOrder,
				},
				dataGrouping: {
					dataGrouping: this.dataGrouping,
				}
			},
			clearAll: function ($event) {
				this.columnsLayout.clearFreeze();
				this.columnsLayout.showAll();
				this.dataGrouping.clear();
				this.dataOrder.clear();
			},
			confirm: function (parent) {
				if (this.profiles.selected) $controller.profiles.selected = this.profiles.selected;
				if (this.apply.columnsLayout) this.columnsLayout.confirm();
				if (this.apply.order) this.dataOrder.confirm();
				if (this.apply.grouping) this.dataGrouping.confirm();
				dropdownsStack.closePopupsFor($controller.element.linked);
				let config = {
					changePagination: true,
					dataReload: true,
				};
				$controller.render(config);
			},
			onOpen: function () {
				dropdownsStack.closePopupsFor($controller.element.linked);
				this.columnsLayout.onOpen();
				this.pivotTableMode = $controller.attrs.pivotTableMode === "true";
				this.dataOrder.onOpen();
				if (!this.pivotTableMode && this.dataOrder.unordered.length > 0) this.dataGrouping.onOpen();

				this.profiles.items = $controller.profiles.items.filter(function (profile) {
					return (profile.columns || profile.grouping || profile.order);
				});
				if ($controller.profiles.selected) this.profiles.selected = $controller.profiles.selected;
				else this.profiles.selected = null;
				this.apply = {columnsLayout: true, order: true, grouping: true};
				this.openFinish = true;
			},
			onOpenFinish: function () {
				let popup = this.popup;
				let width = popup.popupElement.find(".config-body").width() + 20;
				if (!$controller.$dataStore.isMobileDevice) {
					popup.popupElement.find(".config-popup").width(width);
					popup.attrs.popupRelativeLeft = -width + 40;
				}
			}
		};
	}

	$destroy() {
		this.__proto__ = null; //jshint ignore:line
	}
}