class axTablePivotTable {
	/**
	 *
	 * @param {axTableController} $controller
	 */
	constructor($controller) {
		$controller.debug.log("axTablePivotTable instance");
		this.template = $controller.$template;
		this.controller = $controller;
		var $pivotTable = this;
		this.controller.$dropdowns.pivotTable = {
			title: this.template.getMessage('toolbar', 'pivotTable'),
			applyText: this.template.getMessage("toolbar", "btnApply"),
			clearAllText: this.template.getMessage("toolbar", "clearAll"),
			applyingText: this.template.getMessage("toolbar", "btnApplying"),
			tabsViews: ['Profiles', 'Edit'],
			initialTab: "Profiles",
			profiles: {
				config: {
					currentItemChanged: function (profile) {
						$controller.$dropdowns.pivotTable.profiles.edited = false;
						$controller.$dropdowns.pivotTable.clear();
						if (profile) {
							let pivot = profile.getDef();
							$controller.$dropdowns.pivotTable.prepareData(pivot);
						}
					}
				},
			},
			prepareData: function (pivot) {
				let dropdown = $controller.$dropdowns.pivotTable;
				let columns = dropdown.source.data;
				pivot.rows.each(function (def, i) {
					let column = columns.findObject(def.column, "title");
					if (!column) return;
					column.isTaken = true;
					let width = def.width ? parseInt(def.width) : column.width;
					dropdown.rows.data.push({
						expression: "dataItem[\"" + column.bindTo + "\"]",
						title: column.title,
						order: column.invariantField || column.bindTo,
						width: width,
						def: column.def,
						show: def.show,
						orderDirection: def.orderDirection
					});
				}, this);
				dropdown.rows.$ctrl.datasourceChanged();
				pivot.values.each(function (def, i) {
					let column = columns.findObject(def.column, "title");
					if (!column) return;
					column.isTaken = true;
					let width = def.width ? parseInt(def.width) : column.width;
					dropdown.values.data.push({
						expression: "dataItem[\"" + column.bindTo + "\"]",
						title: column.title,
						type: def.type,
						width: width,
						def: column.def,
						name: dropdown.values.setItemName(def.type, def.column)
					});
				}, this);
				dropdown.values.$ctrl.datasourceChanged();
				pivot.columns.each(function (def, i) {
					let column = columns.findObject(def.column, "title");
					if (!column) return;
					column.isTaken = true;
					let width = def.width ? parseInt(def.width) : column.width;
					let item = {
						expression: "dataItem[\"" + column.bindTo + "\"]",
						title: column.title,
						width: width,
						order: column.invariantField || column.bindTo,
						def: column.def,
						show: def.show,
						orderDirection: def.orderDirection
					};
					if (column.invariantField) item.orderExpression = "dataItem[\"" + (column.invariantField || column.bindTo) + "\"]";
					dropdown.columns.data.push(item);
				}, this);
				dropdown.columns.$ctrl.datasourceChanged();

			},
			source: {
				asSortable: {
					name: "source",
					accept: function () {
						return true;
					},
					itemMoved: function (event) {
						let source = event.source.itemScope.modelValue;
						let data = event.dest.sortableScope.modelValue;
						let destination = event.dest.sortableScope.options.name;
						let dropdown = $controller.$dropdowns.pivotTable[destination];
						let column = data.findObject(source.$$uid, "$$uid");
						if (destination === "values") {
							delete column.$$uid;
							column.type = "sum";
							column.name = dropdown.setItemName(column.type, column.title);
						} else {
							let cnt = event.dest.sortableScope.modelValue.countObject(source.title, "title");
							if (source.isTaken) return data.removeObject(source.$$uid, "$$uid") && event.rollback();
						}
						source.isTaken = true;
						dropdown.$ctrl.datasourceChanged(column);
					},
					clone: true,
					allowDuplicates: false
				}
			},
			rows: {
				properties: {
					title: "Row properties",
					applyText: this.template.getMessage("toolbar", "btnApply"),
					cancelText: this.template.getMessage("common", "cancel"),
					orderDirectionValues: ["Ascending", "Descending"],
					confirm: function ($event) {
						$event.stopPropagation();
						this.original.orderDirection = this.column.orderDirection === this.orderDirectionValues[0] ? "ASC" : "DESC";
						if (parseInt(this.column.width) > 0) this.original.width = this.column.width;
						this.original.show = this.column.show;
						this.close();
					},
					onOpen: function (params) {
						this.original = params[1];
						this.column = angular.copy(this.original);
						this.column.lastLevel = params[2];
						this.column.orderDirection = this.column.orderDirection === "ASC" ? this.orderDirectionValues[0] : this.orderDirectionValues[1];
						if (this.column.lastLevel) this.column.show = true;
						this.openFinish = true;
					},
				},
				remove: function (source, $event) {
					if ($event) $event.stopPropagation();
					if ($controller.$dropdowns.pivotTable.rows.data.countObject(source.title, "title") === 1) {
						let column = $controller.$dropdowns.pivotTable.source.data.findObject(source.title, "title");
						column.isTaken = false;
					}
					this.$ctrl.dataItemRemove(source, false);
				},
				clear: function () {
					let data = angular.copy(this.data);
					data.each(function (column) {
						this.remove(column);
					}, this);
				},
				add: function (source) {
					let item = angular.copy(source);
					item.order = source.invariantField || source.bindTo;
					return item;
				},
				asSortable: {
					name: "rows",
					clone: false,
					accept: function (sourceItemHandleScope, destSortableScope, destItemScope) {
						return true;
					},
					itemMoved: function (event) {
						let sourceItem = event.source.itemScope.modelValue;
						let sourceName = event.source.sortableScope.options.name;
						let sourceDropdown = $controller.$dropdowns.pivotTable[sourceName];
						sourceItem.isTaken = true;
						let destinationData = event.dest.sortableScope.modelValue;
						let destinationName = event.dest.sortableScope.options.name;
						let destinationDropdown = $controller.$dropdowns.pivotTable[destinationName];
						let destinationItem = destinationData.findObject(sourceItem.$$uid, "$$uid");
						delete destinationItem.$$uid;
						if (destinationName === "values") {
							destinationItem.type = "sum";
							destinationItem.name = destinationDropdown.setItemName(destinationItem.type, destinationItem.title);
						}
						sourceDropdown.$ctrl.datasourceChanged();
						destinationDropdown.$ctrl.datasourceChanged(destinationItem);
					},
					orderChanged: function (event) {
						var controller = event.dest.sortableScope.element.scope().$ctrl;
						var dataItem = controller.dataItemClean(event.source.itemScope.modelValue);
						var data = event.dest.sortableScope.modelValue;
						for (let i = 0; i < data.length; i++) {
							data[i].level = i;
						}
						controller.datasourceChanged(false, dataItem);
					}
				}
			},
			values: {
				properties: {
					title: "Column properties",
					applyText: this.template.getMessage("toolbar", "btnApply"),
					cancelText: this.template.getMessage("common", "cancel"),
					orderDirectionValues: ["Ascending", "Descending"],
					types: this.controller.$dropdowns.aggregationsTypes,
					confirm: function ($event) {
						$event.stopPropagation();
						this.original.width = parseInt(this.column.width);
						this.original.type = this.column.type;
						this.original.name = this.column.type + " of " + this.original.title;
						this.close();
					},
					onOpen: function (params) {
						this.original = params[1];
						this.column = {
							width: this.original.width,
							type: this.original.type
						};
						this.openFinish = true;
					},
				},
				setItemName: function (type, title) {
					return type + " of " + title;
				},
				clear: function () {
					let data = angular.copy(this.data);
					data.each(function (column) {
						this.remove(column);
					}, this);
				},
				remove: function (source, $event) {
					if ($event) $event.stopPropagation();
					if ($controller.$dropdowns.pivotTable.values.data.countObject(source.title, "title") === 1) {
						let column = $controller.$dropdowns.pivotTable.source.data.findObject(source.title, "title");
						column.isTaken = false;
					}
					this.$ctrl.dataItemRemove(source, false);
				},
				asSortable: {
					name: "values",
					clone: false,
					accept: function (sourceItemHandleScope, destSortableScope, destItemScope) {
						let title = sourceItemHandleScope.itemScope.modelValue.title;
						let cnt = destSortableScope.modelValue.countObject(title, "title");
						let isTaken = $controller.$dropdowns.pivotTable.source.data.findObject(title, "title").isTaken;
						// console.log(cnt, sourceItemHandleScope.itemScope.modelValue.isTaken, sourceItemHandleScope, destSortableScope, destItemScope);
						// return cnt > 0 || !isTaken ;
						return true;
					},

					itemMoved: function (event) {
						let sourceItem = event.source.itemScope.modelValue;
						let sourceName = event.source.sortableScope.options.name;
						let sourceDropdown = $controller.$dropdowns.pivotTable[sourceName];
						sourceItem.isTaken = true;
						let destinationData = event.dest.sortableScope.modelValue;
						let destinationName = event.dest.sortableScope.options.name;
						let destinationDropdown = $controller.$dropdowns.pivotTable[destinationName];
						let destinationItem = destinationData.findObject(sourceItem.$$uid, "$$uid");
						delete destinationItem.$$uid;
						if (!destinationItem.order || !destinationItem.expression) {
							destinationItem.order = destinationItem.invariantField || destinationItem.bindTo;
							destinationItem.expression = "dataItem[\"" + destinationItem.bindTo + "\"]";
						}
						sourceDropdown.$ctrl.datasourceChanged();
						destinationDropdown.$ctrl.datasourceChanged(destinationItem);
					},
					orderChanged: function (event) {
						var controller = event.dest.sortableScope.element.scope().$ctrl;
						var dataItem = controller.dataItemClean(event.source.itemScope.modelValue);
						var data = event.dest.sortableScope.modelValue;
						controller.datasourceChanged(false, dataItem);
					}
				}
			},
			columns: {
				properties: {
					title: "Column properties",
					applyText: this.template.getMessage("toolbar", "btnApply"),
					cancelText: this.template.getMessage("common", "cancel"),
					orderDirectionValues: ["Ascending", "Descending"],
					confirm: function ($event) {
						$event.stopPropagation();
						this.original.orderDirection = this.column.orderDirection === this.orderDirectionValues[0] ? "ASC" : "DESC";
						// if (parseInt(this.column.width) > 0) this.original.width = this.column.width;
						this.original.show = this.column.show;
						this.close();
					},
					onOpen: function (params) {
						this.original = params[1];
						this.column = angular.copy(this.original);
						this.column.firstLevel = params[2];
						this.column.orderDirection = this.column.orderDirection === "ASC" ? this.orderDirectionValues[0] : this.orderDirectionValues[1];
						this.openFinish = true;
					},
				},

				remove: function (source, $event) {
					if ($event) $event.stopPropagation();
					if ($controller.$dropdowns.pivotTable.columns.data.countObject(source.title, "title") === 1) {
						let column = $controller.$dropdowns.pivotTable.source.data.findObject(source.title, "title");
						column.isTaken = false;
					}
					this.$ctrl.dataItemRemove(source, false);
				},
				clear: function () {
					let data = angular.copy(this.data);
					data.each(function (column) {
						this.remove(column);
					}, this);
				},
				asSortable: {
					name: "columns",
					clone: false,
					accept: function (sourceItemHandleScope, destSortableScope, destItemScope) {
						return true;
					},
					itemMoved: function (event) {
						let sourceItem = event.source.itemScope.modelValue;
						let sourceName = event.source.sortableScope.options.name;
						let sourceDropdown = $controller.$dropdowns.pivotTable[sourceName];
						sourceItem.isTaken = true;
						let destinationData = event.dest.sortableScope.modelValue;
						let destinationName = event.dest.sortableScope.options.name;
						let destinationDropdown = $controller.$dropdowns.pivotTable[destinationName];
						let destinationItem = destinationData.findObject(sourceItem.$$uid, "$$uid");
						delete destinationItem.$$uid;
						if (destinationName === "values") {
							destinationItem.type = "sum";
							destinationItem.index = sourceItem.index;
							destinationItem.name = destinationDropdown.setItemName(destinationItem.type, destinationItem.title);
						}
						sourceDropdown.$ctrl.datasourceChanged();
						destinationDropdown.$ctrl.datasourceChanged(destinationItem);
					},
					orderChanged: function (event) {
						var controller = event.dest.sortableScope.element.scope().$ctrl;
						var dataItem = controller.dataItemClean(event.source.itemScope.modelValue);
						var data = event.dest.sortableScope.modelValue;
						controller.datasourceChanged(false, dataItem);
					}
				}
			},
			clear: function () {
				this.rows.clear();
				this.values.clear();
				this.columns.clear();
			},
			confirm: function () {
				var dropdown = this;
				let error = false;
				if (this.rows.data.length === 0 || this.values.data.length === 0) {
					$controller.$notify.error("You need to select at least on Row and one Value column!");
					error = true;
					return;
				}
				this.values.data.each(function (valueColumn) {
					let cnt = this.values.data.countObject(valueColumn.name, "name");
					if (cnt > 1) {
						error = true;
						$controller.$notify.error(valueColumn.name + " are selected more than once, which is not allowed!");
						return false;
					}
				}, this);
				if (error) return;
				this.edited = true;
				if (this.profiles.selected) $controller.profiles.selectedPivot = this.profiles.selected;
				$pivotTable.show(this);
			},
			selectSource: function (source) {
				if (source.isTaken) {
					this.rows.$ctrl.dataItemAdd(this.rows.add(source));
				} else {
					while (true) {
						let item = this.rows.data.findObject(source.title, "title");
						if (item) this.rows.$ctrl.dataItemRemove(item);
						else break;
					}
					while (true) {
						let item = this.columns.data.findObject(source.title, "title");
						if (item) this.columns.$ctrl.dataItemRemove(item);
						else break;
					}
					while (true) {
						let item = this.values.data.findObject(source.title, "title");
						if (item) this.values.$ctrl.dataItemRemove(item);
						else break;
					}
				}
			},
			onOpen: function () {
				var dropdown = this;
				if (!this.edited) {
					let columns = angular.copy($controller.columns.hideable);
					while (true) {
						let index = columns.findObjectIndex(null, "bindTo");
						if (index === -1) break;
						columns.splice(index, 1);
					}
					let index = columns.findObjectIndex("$$uid", "bindTo");
					if (index > -1) columns.splice(index, 1);
					dropdown.source.data = columns;
					columns.forEach(function (column) {
						column.order = column.invariantField || column.bindTo;
						column.expression = "dataItem[\"" + column.bindTo + "\"]";
						column.orderDirection = "ASC";
					});
					dropdown.rows.data = [];
					angular.copy($controller.groups.defs).forEach(function (group) {
						if (group.expression === 'true') return true;
						let column = columns.findObject(group.order, "sortable");
						if (!column) return true;

						column.isTaken = true;
						dropdown.rows.data.push({
							expression: group.expression,
							title: column.title,
							orderDirection: group.order.startsWith("-") ? "DESC" : "ASC",
							order: group.order.startsWith("-") ? group.order.substring(1) : group.order,
							width: column.width,
							def: column.def
						});
					}, this);

					dropdown.values.data = [];
					for (let calcName in $controller.groups.allLevelsCalculations) {
						let calculation = angular.copy($controller.groups.allLevelsCalculations[calcName]);
						let column = columns.findObject(calculation.column, "title");
						if (!column || column.hidden) continue;
						column.isTaken = true;
						dropdown.values.data.push({
							expression: calculation.expression,
							title: calculation.column,
							type: calculation.type,
							index: column.index,
							def: column.def,
							width: column.width,
							name: this.values.setItemName(calculation.type, calculation.column)
						});
					}
					dropdown.columns.data = [];
					this.profiles.items = $controller.profiles.pivots;
					if ($controller.profiles.selectedPivot) this.profiles.selected = $controller.profiles.selectedPivot;
					else this.profiles.selected = null;
				}

				dropdown.openFinish = true;
			},
			onOpenFinish: function () {
				let popup = this.popup;
				let width = popup.popupElement.find(".config-body").width();
				if (!$controller.$dataStore.isMobileDevice) {
					// popup.popupElement.find(">div").width(width);
					// popup.attrs.popupRelativeLeft = -width + 40;
				}

			},
		};
		this.calculations = {
			items: {},
			hasItems: false,
			scanChildren: function (items, iterateFn) {
				items.forEach(function (group, i) {
					iterateFn(group);
					group.calculations = {};
					if (group.children && group.children.length > 0 && !group.lastLevel) this.scanChildren(group.children, iterateFn);
				}, this);
			},
			init: function (groups) {
				for (let level in this.items) {
					let levelCalculations = this.items[level];
					for (let calculationName in levelCalculations) {
						let calculation = levelCalculations[calculationName];
						calculation.returnValue = undefined;
					}
				}
				if (groups) {
					groups.forEach(function (group) {
						group.calculations = {};
					});
				} else dataSource.getCollection("groupsLevels").forEach(function (level, i) {
					level.forEach(function (group) {
						group.calculations = {};

					});
				});
			},
			calculate(dataItem) {
				let self = $pivotTable;
				for (let level in this.items) {
					let levelCalculations = this.items[level];
					for (let calculationName in levelCalculations) {
						let calculation = levelCalculations[calculationName];
						// let group = dataItem.groups[calculation.groupLevel];
						let group = $pivotTable.pivot.dataItemsGroups[dataItem.$$uid][calculation.groupLevel];
						if (group.calculations[calculation.name] === undefined) group.calculations[calculation.name] = calculation.initialValue();
						group.calculations[calculation.name] = calculation.iteratorFn(dataItem, group.calculations[calculation.name]);
					}
				}
				//console.log("dataItem", dataItem, angular.copy(dataItem.groups));
			},
			add(item) {
				var root = this.items[item.groupLevel];
				if (root === undefined) {
					this.items[item.groupLevel] = {};
					root = this.items[item.groupLevel];
				}
				if (root[item.name] !== undefined) throw "Calculation " + item.name + ", already defined for " + item.groupLevel ? (" group level " + item.groupLevel) : " global scope";
				root[item.name] = item;
				this.hasItems = true;
			}
		};
		this.controller.$pivot = $pivotTable;
	}//end constructor
	$destroy() {
		this.controller.$$grid.$$pivotTable.$destroy();
		this.controller.$$grid.$$pivotTable = null;
		delete this.controller.$$grid.$$pivotTable;
		this.template = null;
		delete this.template;
		this.pivot = null;
		delete this.pivot;
		this.calculations = null;
		delete this.calculations;
		this.__proto__ = null;//jshint ignore:line
		delete this.__proto__;//jshint ignore:line
		this.controller.$pivot = null;
		delete this.controller.$pivot;
		this.controller = null;
		delete this.controller;
		// this.controller.$pivot.pivot = null;
		// this.controller.$pivot.calculations = null;
		// this.controller.$pivot.__proto__ = null;//jshint ignore:line
		// this.controller.$pivot = null;
	}

	setGroupsDefs() {
		let calculations = angular.copy(this.pivot.values);
		// let calculations = this.pivot.values;
		this.calculations.items = [];
		this.calculations.hasItems = false;
		this.pivot.groups = angular.copy(this.pivot.rows);
		this.pivot.groups.splice(0, 0, {expression: "true", title: "General total"});

		this.pivot.columns.each(function (column, rowIndex) {
			let group = {
				title: column.title,
				order: (column.orderDirection === "ASC" ? "" : "-") + column.order,
				expression: column.expression,
				show: column.show,
				orderExpression: column.orderExpression,
				rowIndex: rowIndex + 1
			};
			this.pivot.groups.push(group);
		}, this);
		let orderBy = "";
		this.pivot.groups.forEach(function (group, level) {
			group.level = level;
			group.lastRow = level === this.pivot.rows.length;
			group.lastLevel = level === this.pivot.groups.length - 1;
			group.calculations = {};
			if (group.order !== undefined) orderBy += (orderBy === "" ? "" : ",") + group.order;
			// console.log("order column", group.expression, group.order);
		}, this);
		let scope = this.controller.$parent;
		var self = this;
		this.pivot.groups.forEach(function (group, i) {
			calculations.forEach(function (calculationDef) {
				calculationDef.name = this.controller.$dropdowns.pivotTable.values.setItemName(calculationDef.type, calculationDef.title);

				var calculation, initialValue, returnFn;
				if (calculationDef.type === "custom") {
					calculation = scope.$eval(calculationDef.aggregateDef);
					if (!angular.isFunction(calculation.iteratorFn)) throw "For calculation " + calculationDef.name + " iteratorFn from " + calculationDef.aggregateDef + " is not a function";
					if (!angular.isFunction(calculation.initialValue)) throw "For calculation " + calculationDef.name + " initialValue from " + calculationDef.aggregateDef + " is not a function";
					if (!angular.isFunction(calculation.returnFn)) throw "For calculation " + calculationDef.name + " returnFn from " + calculationDef.aggregateDef + " is not a function";
					calculation.groupLevel = group.level;
				} else {
					if (['min', 'max', 'first'].indexOf(calculationDef.type) > -1) initialValue = function () {
						return undefined;
					};
					else initialValue = function () {
						return parseFloat(calculationDef.initialValue) || 0;
					}; //jshint ignore:line
					calculation = {
						name: calculationDef.name,
						groupLevel: group.level,
						initialValue: initialValue,
						iteratorFn: this.controller.$dataSource.getIteratorFn(calculationDef),
						returnFn: function (returnValue) {
							return returnValue;
						},
					};
				}
				this.calculations.add(calculation);
			}, this);
		}, this);
	}

	createDatasource(dropdown) {
		this.pivot = {
			source: dropdown.source.data,
			rows: dropdown.rows.data,
			columns: dropdown.columns.data || [],
			values: this.controller.$orderBy(dropdown.values.data, "index"),
			initial: this.controller.$dataSource.collections.filtered,
			columnsLabels: [],
			result: []
		};
		this.setGroupsDefs();
		this.orderApply();
		let treeData = this.createTreeData();
		return this.pivot.result;
	}

	createTreeData() {
		let lastLevelItems = [];
		let previousItem = null;
		this.pivot.dataItemsGroups = {};
		this.pivot.ordered.forEach(function (dataItem) {
			let treeDataParent = null;
			//dataItem.groups = [];
			this.pivot.dataItemsGroups[dataItem.$$uid] = [];
			let treeDataGroup = null;
			let previousItemGroups = previousItem ? this.pivot.dataItemsGroups[previousItem.$$uid] : [];
			this.pivot.groups.forEach(function (group, level) {
				let value = eval(group.expression);//jshint ignore:line
				let fullValue = (treeDataParent === null ? "" : (treeDataParent.fullValue + "--")) + value;
				treeDataGroup = previousItemGroups.length === this.pivot.groups.length && previousItemGroups[level].fullValue === fullValue ? previousItemGroups[level] : undefined;
				if (!treeDataGroup) {
					treeDataGroup = angular.copy(group);
					treeDataGroup.value = value;
					if (group.orderExpression) treeDataGroup.orderValue = eval(group.orderExpression); //jshint ignore:line
					treeDataGroup.fullValue = fullValue;
					treeDataGroup.parent = treeDataParent;
					treeDataGroup.children = [];
					treeDataGroup.columns = {};
					if (group.lastRow) {
						treeDataGroup.columns[treeDataGroup.title] = treeDataGroup.value;
						let group = treeDataGroup.parent;
						while (group) {
							treeDataGroup.columns[group.title] = group.value;
							group = group.parent;
						}
						lastLevelItems.push(treeDataGroup);
					}
					if (treeDataGroup.parent) treeDataGroup.parent.children.push(treeDataGroup);
				}
				// dataItem.groups.push(treeDataGroup);
				this.pivot.dataItemsGroups[dataItem.$$uid].push(treeDataGroup);
				treeDataParent = treeDataGroup;
			}, this);
			this.calculations.calculate(dataItem);
			previousItem = dataItem;
		}, this);
		let data = [];
		let columnsLabels = [];
		lastLevelItems.each(function (source) {
			let item = {};
			for (let column in source.columns) {
				item[column] = source.columns[column];
			}
			for (let column in source.calculations) {
				item[column] = source.calculations[column];
			}
			let scanChildren = function (children, columnsLabels, parent) {
				children.each(function (child) {
					let column = columnsLabels.findObject(child.value.toString(), "title");
					if (!column) {
						column = {
							label: child.title,
							title: child.value.toString(),
							orderColumn: child.orderValue || child.value,
							order: child.order,
							children: [],
							colspan: 0,
							show: child.show,
							lastLevel: child.lastLevel,
							parent: parent,
							addChild: function (child) {
								if (this.children.findObject(child.title, "title")) return;
								this.children.push(child);
								let parent = this;
								while (parent) {
									parent.colspan++;
									parent = parent.parent;
								}
							}
						};
						columnsLabels.push(column);
					}
					let keys = child.fullValue.split("--");
					keys.splice(0, this.pivot.rows.length + 1);
					let fullValue = keys.join("--");
					//console.log("fullValue", fullValue);
					this.pivot.values.each(function (calculationDef) {
						let rowSpan = child.level === this.pivot.groups.length ? undefined : this.pivot.groups.length - child.level;
						let key = fullValue + '--' + calculationDef.name;
						column.addChild({label: calculationDef.title, title: calculationDef.name, rowSpan: rowSpan, aggType: calculationDef.type, orderColumn: " " + calculationDef.name});
						item[key] = child.calculations[calculationDef.name];
					}, this);
					if (!child.lastLevel) scanChildren.call(this, child.children, column.children, column);

				}, this);
			};
			if (source.children.length > 0) scanChildren.call(this, source.children, columnsLabels);
			else
				for (let column in source.calculations) {
					item[column] = source.calculations[column];
				}
			data.push(item);
		}, this);
		this.pivot.result = data;
		if (columnsLabels.length > 0) {
			let direction = this.pivot.columns[0].orderDirection !== "ASC" ? "-" : "";
			this.pivot.columnsLabels = this.controller.$orderBy(columnsLabels, direction + "orderColumn");
			let orderChildren = function (child, level) {
				if (!child.children) return;
				if (level === this.pivot.columns.length) return;
				let direction = this.pivot.columns[level].orderDirection !== "ASC" ? "-" : "";
				child.children = this.controller.$orderBy(child.children, direction + "orderColumn");
				child.children.each(function (child) {
					orderChildren.call(this, child, level + 1);
				}, this);

			};
			this.pivot.columnsLabels.each(function (child) {
				orderChildren.call(this, child, 1);
			}, this);
		} else this.pivot.columnsLabels = [];
	}

	orderApply() {
		let orderBy = [];
		this.pivot.rows.forEach(function (row) {
			if (!row.order) return;
			if (!row.order.includes(",")) {
				let order = row.order.startsWith("-") ? row.order.substring(1) : row.order;
				orderBy.push((row.orderDirection === "ASC" ? "" : "-") + order);
			}
			else row.order.split(",").forEach(function (order) {
				orderBy.push(order);
			});
		});
		this.pivot.columns.forEach(function (row) {
			if (!row.order) return;
			if (!row.order.includes(",")) {
				let order = row.order.startsWith("-") ? row.order.substring(1) : row.order;
				orderBy.push((row.orderDirection === "ASC" ? "" : "-") + order);
			}
			else row.order.split(",").forEach(function (order) {
				orderBy.push(order);
			});
		});
		let escapedOrder = [];
		orderBy.forEach(function (order, i) {
			let desc = order.startsWith('-');
			let fieldName = desc ? order.substr(1) : order;
			let escapedFieldName = (desc ? "-" : "") + "\'" + fieldName + "\'";
			escapedOrder.push(escapedFieldName);
		}, this);
		this.pivot.ordered = this.controller.$orderBy(this.pivot.initial, escapedOrder);
	}

	createDataTableContent(dropdown, axDt, columnsDropdowns, ctrl) {
		if (axDt.getAttribute("freeze-columns-enabled") !== "false" && this.pivot.columns.length > 0) ctrl.setAttribute("left-freezed-columns", this.pivot.rows.length + 1);
		ctrl.setAttribute("order-by", "");
		// axDt.setAttribute("has-horizontal-virtual-scroll", "true");
		let title = dropdown.profiles.selected ? "Pivot Table: " + dropdown.profiles.selected : "Pivot Table";
		axDt.find("ax-toolbar>label.header-title").html(title);
		let axGroups = createElement("ax-groups");
		let calculations = createElement("ax-all-levels-calculations", {"show-on": "header"});
		if (this.pivot.columns.length === 0) {
			this.pivot.values.forEach(function (column, i) {
				let aggType = ["sum", "count"].includes(column.type) ? "sum" : column.type;
				createElement("ax-calculation", {column: column.title, "aggregate-type": aggType, "display-label": false}, "", calculations);
			}, this);
			axGroups.appendChild(calculations);
		}
		this.pivot.groups.forEach(function (column, i) {
			if (i >= this.pivot.rows.length) return;
			let axGroup = createElement("ax-group", {
				expression: column.expression === "true" ? "true" : "dataItem[\"" + column.title + "\"]",
				collapsible: column.expression !== "true",
				showCalculationsOn: column.expression === "true" ? "footer" : "header",
				label: column.title,
			});
			if (column.order) axGroup.setAttribute("order-by", (column.orderDirection !== "ASC" ? "-" : "") + column.title);
			createElement("ax-group-header", {
				show: column.expression !== "true",
				showValue: column.expression !== "true",
				showToggleCollapsed: column.expression !== "true",
				showCounter: false,
				showFilter: true,
				labelIndent: (i - 1) * 20,
			}, "", axGroup);
			if (column.expression === "true") {
				createElement("ax-group-footer", {
					showValue: false,
					showCounter: false,
					labelIndent: 100,
				}, "", axGroup);

			}
			axGroups.appendChild(axGroup);
		}, this);
		let headerRowsCount = this.pivot.columns.length + 1;
		// console.log("headerRowsCount", headerRowsCount)
		this.pivot.rows.forEach(function (column, i) {
			let def = angular.copy(column.def);
			let axColumn = createElement("ax-column", {
				bindTo: column.title,
				sortable: column.title,
				header: column.title,
				width: column.width + "px"
			});
			if (def.hasAttribute("date-format")) axColumn.setAttribute("date-format", def.getAttribute("date-format"));
			if (def.hasAttribute("datetime-format")) axColumn.setAttribute("datetime-format", def.getAttribute("datetime-format"));
			if (i < this.pivot.rows.length - 1 && !column.show) axColumn.setAttribute("hidden-column", "");
			if (i === this.pivot.rows.length - 1) {
				axColumn.setAttribute("hideable", false);
				axColumn.setAttribute("sortable", column.title);
				if (column.order) ctrl.setAttribute("order-by", (column.orderDirection !== "ASC" ? "-" : "") + column.title);
			}
			let axView = $(def).find("ax-column-view")[0];
			if (axView.getAttribute("type") === "custom") ;
			else {
				axView.setAttribute("bind-to", column.title);
				axView.removeAttribute("hidden-column");
				axColumn.appendChild(axView);
			}
			axDt.appendChild(axColumn);
		}, this);
		if (this.pivot.columns.length === 0) {
			this.pivot.values.each(function (column, i) {
				let axColumn = createElement("ax-column", {
					bindTo: column.name,
					header: column.name,
					headerMenu: false,
					hideable: false,
					style: "text-align:right;padding-right:5px;",
					width: (column.width * 1) + "px"
				});
				createElement("ax-column-header", {
					rowIndex: 1,
					title: column.name,
					headerMenu: true,
					sortable: column.name,
				}, "<div class='border-left'></div>" + column.title, axColumn);
				axDt.appendChild(axColumn);
			}, this);
		} else {
			if (this.pivot.columnsLabels.length > 0 && axDt.getAttribute("freeze-columns-enabled") !== "false" && this.pivot.columns.length > 0) ctrl.setAttribute("left-freezed-columns", this.pivot.rows.length + 1 + this.pivot.values.length);

			this.pivot.values.each(function (column, i) {
				let axColumn = createElement("ax-column", {
					header: column.name,
					bindTo: column.name,
					headerMenu: false,
					hideable: false,
					style: "text-align:right;padding-right:5px;",
					width: (column.width * 1) + "px"
				});
				if (i === 0) {
					this.pivot.columns.each(function (column, i) {
						let header = createElement("ax-column-header", {rowIndex: i + 1, colspan: this.pivot.values.length, headerTitle: column.title + " Select"});
						let attrs = {
							datasource: "$ctrl.columnsDropdowns[\"" + column.title + "\"].data",
							ctrl: "$ctrl.columnsDropdowns[\"" + column.title + "\"]",
							listItemIdField: "id",
							listSelectableRows: "multiple",
							dropdownModel: "$ctrl.columnsDropdowns[\"" + column.title + "\"].selected",
							onSelectionChange: "$ctrl.columnsDropdowns[\"" + column.title + "\"].onChange()",
							dropdownModelType: "object",
							emptyOptionText: "\"" + column.title + " selected: none\"",
							listHeight: "250px",
							listOrderBy: column.order,
							listItemInvariantField: "invariant",
							listShowSearch: true,
							listShowCheckAll: true,
							listShowUncheckAll: true,
							listShowCloseButton: true,
							disableAnimation: true,
							closeOnMouseleave: false,
							class: "form-control",
							style: "width: 100%;"
						};
						if (column.def.getAttribute("date-format")) {
							attrs.convertType = "date";
							attrs.convertDisplayFormat = column.def.getAttribute("date-format");
							//TODO de create template de view
						} else if (column.def.getAttribute("datetime-format")) {
							attrs.convertType = "datetime";
							attrs.convertDisplayFormat = column.def.getAttribute("datetime-format");
							//TODO de create template de view
						}
						if (column.def.getAttribute("number-format")) {
							attrs.convertType = "number";
							attrs.convertDisplayFormat = column.def.getAttribute("number-format");
							//TODO de create template de view
						}


						createElement("ax-dropdown-list", attrs, "", header);
						axColumn.appendChild(header);
					}, this);
					//header = "Totals";
				}
				createElement("ax-column-header", {
					rowIndex: this.pivot.columns.length + 1,
					sortable: column.name,
					headerMenu: true,
					headerTitle: column.name,
					title: column.name
				}, "<div class='border-left'></div>" + column.name, axColumn);
				axDt.appendChild(axColumn);
				let aggType = ["sum", "count"].includes(column.type) ? "sum" : column.type;
				createElement("ax-calculation", {column: column.name, "aggregate-type": aggType, "display-label": false}, "", calculations);

			}, this);
			this.pivot.columnsLabels.each(function (column, i) {
				let scanChildren = function (children, parent) {
					children.each(function (child) {
						child.parent = parent;
						if (child.children) return scanChildren.call(this, child.children, child);
						if (false && parent && parent.children.length <= this.pivot.values.length + 1 && !parent.lastLevel) {
							let parent1 = parent;
							while (parent1) {
								parent1.colspan = parent1.colspan - 1;
								parent1 = parent1.parent;
							}
							//console.log("not show", child);
							return;
						}
					}, this);
				};
				scanChildren.call(this, column.children, column);
			}, this);
			let columnsDatasource = {};
			let firstLevelOfColumnsLabel = null;
			this.pivot.columns.each(function (column, i) {
				columnsDatasource[column.title] = [];
				columnsDatasource[column.title].first = i === 0;
				if (i === 0) firstLevelOfColumnsLabel = column.title.urlAccepted();
				columnsDatasource[column.title].add = function (item) {
					if (this.findObject(item.title, "id")) return;
					this.push({id: item.title, invariant: item.orderColumn});
				};
			});
			let columnsDefs = {};
			this.pivot.columns.each(function (column) {
				let def = angular.copy(this.pivot.source.findObject(column.title, "title"));
				let template = "";
				if ($(def.templates.td.view).find("[ng-bind]").length > 0) {
					$(def.templates.td.view).find("[ng-bind]").each(function (i, element) {
						let ngBind = element.getAttribute("ng-bind").replace("dataItem[\"" + (column.bindTo || column.order) + "\"]", "\"<<>>\"");
						if (ngBind !== element.getAttribute("ng-bind")) {
							element.setAttribute("ng-bind", ngBind);
							element.style["text-align"] = "center";
							template = def.templates.td.view.outerHTML;
						}
					});
				}
				columnsDefs[column.title] = function (title) {
					if (!template) return title;
					else return template.replace("<<>>", title);
				};
			}, this);
			this.pivot.columnsLabels.each(function (column, i) {
				let scanChildren = function (children, parent) {
					children.each(function (child) {
						child.parent = parent;
						if (child.children) return scanChildren.call(this, child.children, child);
						if (parent && parent.children.length <= this.pivot.values.length + 1 && !parent.lastLevel) {
							// nu mai merg filtrarile pe coloane corect;
							//return;
						}
						let def = this.pivot.source.findObject(child.label, "title");
						let axColumn = createElement("ax-column", {
							headerMenu: false,
							hideable: false,
							style: "text-align:right;padding-right:5px;",
							width: (def.width * 1) + "px"
						});
						//console.log("set column hideable=false", child.title);
						let parent1 = child;
						let parents = [];
						while (parent1) {
							parent1 = parent1.parent;
							if (parent1) parents.push(parent1);
						}
						let bindTo = "";
						parents.eachLastToFirst(function (parent, i) {
							bindTo += (bindTo ? "--" : "") + parent.title;
							let attrName = "column-" + parent.label.urlAccepted();
							if (!parent.show) {
								let hiddenColumn = (axColumn.getAttribute("hidden-column") || "").split(";");
								hiddenColumn.push(attrName);
								axColumn.setAttribute("hidden-column", hiddenColumn.join(";"));
							}
							axColumn.setAttribute(attrName, parent.title);
							if (parent.added) return;
							parent.added = true;
							columnsDatasource[parent.label].add(parent);
							let headerTemplate = columnsDefs[parent.label](parent.title);
							let title = parent.label + " = " + parent.title;
							createElement("ax-column-header", {rowIndex: parents.length - i, colspan: parent.colspan,headerTitle: parent.title,  title: title}, headerTemplate, axColumn);
						}, this);
						bindTo += (bindTo ? "--" : "") + child.title;
						let rowIndex = parents.length + 1;
						let rowSpan = headerRowsCount - rowIndex + 1;
						let columnCfg = {rowIndex: rowIndex, rowspan: rowSpan, title: " for " + child.parent.label + ": " + child.parent.title};
						// console.log("column cfg", columnCfg);
						createElement("ax-column-header", columnCfg, child.aggType + " of " + child.label, axColumn);
						axColumn.setAttribute("bind-to", bindTo);
						//createElement("ax-column-view", { type: "number", ngBind: "::dataItem[\"" + bindTo + "\"] !== undefined ? dataItem[\"" + bindTo + "\"]:''"}, "", axColumn);
						let header = bindTo.replaceAll("--", " ");
						axColumn.setAttribute("header", header);
						let aggType = ["sum", "count"].includes(child.aggType) ? "sum" : child.aggType;
						createElement("ax-calculation", {column: header, "aggregate-type": aggType, "display-label": false}, "", calculations);

						//console.log("column", axColumn.outerHTML);
						axDt.appendChild(axColumn);
					}, this);
				};
				scanChildren.call(this, column.children, column);
			}, this);
			axGroups.appendChild(calculations);
			//this.pivot.columnsDropdowns = {};
			for (let column in columnsDatasource) {
				let data = columnsDatasource[column];
				let columnDef = this.pivot.columns.findObject(column, "title");
				let first = data.first;
				delete data.first;
				delete data.add;
				columnsDropdowns[column] = {
					data: data,
					pivotTableCtrl: this.controller.$$grid.$$pivotTable,
					host: this.template.element.linked.parent(),
					label: column,
					selected: columnDef.show ? angular.copy(data) : [],
					onOpen: function () {//jshint ignore:line
						this.previousSelected = {cnt: this.selected.length, ids: ""};
						for (let i = 0; this.selected.length !== this.data.length && i < this.selected.length; i++) {
							this.previousSelected.ids += "---" + this.selected[i].id;
						}
						this.openFinish = true;
					},
					onClose: function () {//jshint ignore:line
						let dropdown = this;
						if (this.previousSelected.cnt === this.selected.length && this.selected.length === this.data.length) return;
						let currentIds = "";
						for (let i = 0; this.selected.length !== this.data.length && i < this.selected.length; i++) {
							currentIds += "---" + this.selected[i].id;
						}
						if (currentIds === this.previousSelected.ids && this.previousSelected.cnt === this.selected.length) return;
						console.clear();
						let $controller = this.pivotTableCtrl;
						let loader = $controller.getLoader(this.host);
						$controller.$timeout(function () {
							$controller.timeStamp(true, 'pivot-create');
							var element = $controller.element.initial;
							let columnAttr = "column-" + dropdown.label.urlAccepted();
							element.find(">ax-column[" + columnAttr + "]").each(function (i, column) {
								let columnValue = column.getAttribute(columnAttr);
								let isSelected = dropdown.selected.findObject(columnValue, "id") ? true : false;
								let hiddenColumn = (column.getAttribute("hidden-column") || "");
								if (isSelected) {
									let hiddens = hiddenColumn.split(";");
									if (hiddens.includes(columnAttr)) {
										hiddens.splice(hiddens.indexOf(columnAttr), 1);
										hiddenColumn = hiddens.join(";");
									}
								}
								if (!isSelected && !hiddenColumn.split(";").includes(columnAttr)) hiddenColumn = (hiddenColumn ? hiddenColumn + ";" : "") + columnAttr;
								if (!hiddenColumn) column.removeAttribute("hidden-column");
								else column.setAttribute("hidden-column", hiddenColumn);
								//console.log("column hidden", columnAttr, columnValue, hiddenColumn);
							});
							$controller.render({loader: loader});
						});
					}
				};
			}
		}
		axDt.appendChild(axGroups);
		// console.log(axDt.outerHTML());
	}

	show(dropdown) {
		console.clear();
		let timeout1 = 0;
		let axPivotTable = this.controller.element.linked.closest("ax-grid-content").find("ax-grid-pivot-table");
		// axPivotTable.find("ax-table").css({"display": "none"});
		let timeout = 300;
		let pivotTableDropdown = this;
		let pivotTableCtrl = this.controller.$$grid.$$pivotTable;
		pivotTableCtrl.dataLoaded = true;
		pivotTableCtrl.timeStamp(true, 'pivot-create', false);
		pivotTableDropdown.controller.$timeout(function () {
			axPivotTable.slideShow("top", timeout);
			this.hide();
			dropdown.close(false, true);
			pivotTableDropdown.loader = this.getLoader(pivotTableDropdown.template.element.linked.parent());
			this.$timeout(function () {
				let data = pivotTableDropdown.createDatasource(dropdown);
				pivotTableCtrl.timeStamp(false, 'pivot-create', "datasource create");
				let pivotConfig = {
					compiled: false,
					show: true,
					popupClose: function () {
						pivotTableDropdown.controller.show();
						this.data = [];
						// this.pivot = null;
						pivotTableDropdown.controller.$pivot.pivot = null;
						// pivotTableDropdown.controller.$pivot = null;
						console.log(this);
						this.$ctrl.$timeout(function () {
							this.datasourceClear();
							this.element.initial.find("ax-column,ax-groups").remove();
							this.hide();
							axPivotTable.slideHide("bottom", 500);
						});

					},
					createTemplate: function () {
						let ctrl = this.$ctrl;
						var element = ctrl.$template.element.initial;
						element.find(">ax-column").remove();
						pivotTableCtrl.timeStamp(false, 'pivot-create', "createTemplate start");
						ctrl.columnsDropdowns = {};
						pivotTableDropdown.createDataTableContent(dropdown, element, ctrl.columnsDropdowns, ctrl);
						pivotTableCtrl.timeStamp(false, 'pivot-create', "createTemplate finish");
						ctrl.render({loader: pivotTableDropdown.loader, datasource: data});
					},
					controllerIsCreated: function () {
						if (this.compiled) return;
						this.compiled = true;
						this.createTemplate();
					}
				};
				angular.extend(pivotTableCtrl.config, pivotConfig);
				pivotTableDropdown.pivot.dataTableConfig = pivotConfig;
				pivotTableCtrl.show(true);
				pivotTableCtrl.config.controllerIsCreated();
			}, timeout);
		}, timeout1);
	}
}