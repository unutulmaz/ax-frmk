class axTableDatasource {
	constructor(config, filter, dataStore) {
		this.$filter = filter;
		this.$dataStore = dataStore;
		var dataSource = this;
		this.config = {
			idField: null,
			emptyItem: {},
			type: 'one-level',
			typeValues: ['one-level', 'nested-levels'],
			childrenPropertyName: null,
			orderBy: [],
			filterStart: angular.noop,
			itemCustomFilter: function () {
				return true;
			},
			viewFromIndex: 0,
			viewLimit: function () {
				return 30;
			},
			extendItem: null,
			calculations: [{
				name: "", groupLevel: "", initialValue: 0, iteratorFn: function (item, returnValue) {
					return returnValue;
				}, returnFn: function (returnValue) {
					return returnValue;
				}
			}]
		};

		this.collections = {
			initial: [],
			ordered: [],
			filtered: [],
			groupsLevels: [],
			items: [],
			visibleItems: [],
			viewed: [],
			index: {}
		};
		this.calculations = {
			items: {},
			hasItems: false,
			values: [],
			scanChildren: function (items, iterateFn) {
				items.each(function (group, i) {
					iterateFn(group);
					group.calculations = {};
					if (group.children && group.children.length > 0 && !group.lastLevel) this.scanChildren(group.children, iterateFn);

				}, this);
				// for (let i = 0; i < items.length; i++) {
				//     let group = items[i];
				//     iterateFn(group);
				//     group.calculations = {};
				//     if (group.children && group.children.length > 0 && !group.lastLevel) this.scanChildren(group.children, iterateFn);
				// }
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
					groups.each(function (group) {
						group.calculations = {};
					});
				} else dataSource.getCollection("groupsLevels").each(function (level, i) {
					level.each(function (group) {
						group.calculations = {};

					});
				});
			},
			calculate(dataItem) {
				for (let level in this.items) {
					let levelCalculations = this.items[level];
					for (let calculationName in levelCalculations) {
						let calculation = levelCalculations[calculationName];
						let group = dataSource.getDataItemGroupLevel(dataItem, calculation.groupLevel);
						if (group.calculations[calculation.name] === undefined) group.calculations[calculation.name] = calculation.initialValue();
						group.calculations[calculation.name] = calculation.iteratorFn(dataItem, group.calculations[calculation.name]);
					}
				}
			},
			add(item) {
				var root = this.items[item.groupLevel];
				if (root === undefined) {
					this.items[item.groupLevel] = {};
					root = this.items[item.groupLevel];
				}
				if (root[item.name] !== undefined) console.error("Calculation " + item.name + ", already defined for " + (item.groupLevel ? (" group level " + item.groupLevel) : " global scope"));
				root[item.name] = item;
				this.hasItems = true;
			},
			update() {
				if (!this.hasItems) return;
				//dataSource.table.timeStamp("start", 'calculations update');
				this.init();
				dataSource.getCollection("filtered").each(function (dataItem, index) {
					this.calculate(dataItem);
				}, this);
				//dataSource.table.timeStamp("end", 'calculations update');
			}
		};
		this.guid = this.$dataStore.nextUid.bind(this.$dataStore);
		if (config) this.setConfig(config);
	}

	$destroy() {
		this.clear();
		this.$filter = null;
		this.$dataStore = null;
		this.table = null;
		delete this.table;

	}

	setConfig(config) {
		angular.extend(this.config, config);
	}

	getIteratorFn(calculationDef) {
		let type = calculationDef.type;
		switch (type) {
			case "first":
				return function (dataItem, returnValue) {
					if (returnValue !== undefined) return returnValue;
					let value = eval(calculationDef.expression);//jshint ignore:line
					if (value === null || value === undefined) return "";
					else return value;
				};
			case "last":
				return function (dataItem, returnValue) {
					let value = eval(calculationDef.expression);//jshint ignore:line
					if (value === null || value === undefined) return "";
					else return value;
				};
			case "sum":
				return function (dataItem, returnValue) {
					let value = eval(calculationDef.expression);//jshint ignore:line
					if (value === null || value === undefined || isNaN(value)) return returnValue;
					else return returnValue + parseFloat(value);
				};
			case "cumulative":
				return function (dataItem, returnValue) {
					let value = eval(calculationDef.expression);//jshint ignore:line
					if (value === null || value === undefined || isNaN(value)) return returnValue;
					else return returnValue + parseFloat(value);
				};
			case "count":
				return function (dataItem, returnValue) {
					let value = eval(calculationDef.expression);//jshint ignore:line
					if (value === null || value === undefined) return returnValue;
					else return returnValue + 1;
				};
			case "min":
				return function (dataItem, returnValue) {
					let value = eval(calculationDef.expression);//jshint ignore:line
					if (value === null || value === undefined || isNaN(value)) return returnValue;
					else return returnValue ? Math.min(returnValue, value) : value;
				};
			case "max":
				return function (dataItem, returnValue) {
					let value = eval(calculationDef.expression);//jshint ignore:line
					if (value === null || value === undefined || isNaN(value)) return returnValue;
					else return returnValue ? Math.max(returnValue, value) : value;
				};
			case "custom":
		}
	}

	setGroupsDefs(groups, scope) {
		this.groups = groups;
		this.table.distinctValues.groupsLevels = {};
		this.table.debug.log("datasource set groups", groups);
		var self = this;
		this.calculations.hasItems = false;
		this.calculations.items = {};
		this.calculations.values = [];

		for (let i = 0; i < groups.length; i++) {
			let group = groups[i];
			this.table.distinctValues.groupsLevels[i] = {data: []};
			let result = function () { //jshint ignore:line
				if (group.expression !== 'true') console.warn("This method work only to 'All records' group");
				let value;
				if (this.returnValue) value = this.returnValue;
				else {
					let groupedCollection = self.getCollection("groupsLevels");
					if (!groupedCollection[0]) return "";
					if (!groupedCollection[0][0]) return "";
					value = groupedCollection[0][0].calculations[this.name];
					this.returnValue = value;
				}
				return this.returnFn(value);
			};
			for (let name in group.calculations) {
				let calculationDef = group.calculations[name];
				var calculation, initialValue, returnFn;
				if (calculationDef.type === "custom") {
					calculation = scope.$eval(calculationDef.aggregateDef);
					if (!angular.isFunction(calculation.iteratorFn)) throw "For calculation " + calculationDef.name + " iteratorFn from " + calculationDef.aggregateDef + " is not a function";
					if (!angular.isFunction(calculation.initialValue)) throw "For calculation " + calculationDef.name + " initialValue from " + calculationDef.aggregateDef + " is not a function";
					if (!angular.isFunction(calculation.returnFn)) throw "For calculation " + calculationDef.name + " returnFn from " + calculationDef.aggregateDef + " is not a function";
					calculation.result = result;
					calculation.groupLevel = group.level;
				} else {
					if (['min', 'max', 'first'].indexOf(calculationDef.type) > -1) initialValue = function () {
						return undefined;
					};
					else initialValue = function () {//jshint ignore:line
						return parseFloat(calculationDef.initialValue) || 0;
					};
					calculation = {
						name: name,
						groupLevel: group.level,
						initialValue: initialValue,
						iteratorFn: this.getIteratorFn(calculationDef),
						returnFn: function (returnValue) {
							return returnValue;
						},
						result: result
					};
				}
				this.calculations.add(calculation);
			}
		}
	}

	setViewItems(view) {
		this.config.viewFromIndex = view.fromIndex;
		this.config.lastNavigableIndex = Math.max(1, view.lastNavigableIndex);
		this.config.viewLimit = view.limit || function () {
			return null;
		};
	}

	clear() {
		this.collections.ordered.length = 0;
		this.collections.filtered.length = 0;
		this.collections.groupsLevels.length = 0;
		this.collections.items.length = 0;
		this.collections.visibleItems.length = 0;
		this.collections.viewed.length = 0;

		this.collections = {
			initial: [],
			ordered: [],
			filtered: [],
			groupsLevels: [],
			items: [],
			visibleItems: [],
			viewed: [],
			index: {}
		};
		this.groups = [];
		this.calculations.items = {};
		this.calculations.hasItems = false;
	}

	getCollection(name, length) {
		let collection = this.collections[name];
		if (length) return collection.length;
		else return (collection || []);
	}

	forEach(data, iterator, context) {
		if (!data || !angular.isArray(data)) return;
		for (let i = 0; i < data.length; i++) {
			if (iterator.call(context, data[i], i) === false) break;
		}
	}

	loadData(data) {
		// this.table.timeStamp(true, 'datasource loaded');
		this.initIndex();
		let limitItems = this.table.$dataStore.isDevelopment() && this.table.$dataStore.axLimit;
		this.collections.initial = limitItems ? this.table.datasource.limit(parseInt(this.table.$dataStore.axLimit)) : this.table.datasource;
		if (limitItems) console.warn("you have limit to loaded items to: ", this.table.datasource.limit(parseInt(this.table.$dataStore.axLimit)));
	}

	initIndex() {
		this.collections.ordered = [];
		this.collections.filtered = [];
		this.collections.groupsLevels = [];
		this.collections.items = [];
		this.collections.visibleItems = [];
		this.collections.index = {objectByUid: {}, objectById: {}, attrs: {}, initialIndex: {}};
	}

	addInitialItem(item, index) {
		//nu genera alt uid daca exista deja;
		if (!item.$$uid) item.$$uid = this.guid();
		if (this.config.extendItem && !this.dataItemGetAttr(item, "extended")) {
			this.config.extendItem(item);
			this.dataItemSetAttr(item, "extended", true);
		}
		this.dataItemSetIndex(item, "initial", index);
		this.collections.index.objectByUid[item.$$uid] = item;
		if (this.config.idField) this.collections.index.objectById[item[this.config.idField]] = item;
	}

	collectionsUpdate(orderBy) {
		this.initIndex();
		this.forEach(this.collections.initial, this.addInitialItem, this);
		// this.table.timeStamp(false, 'datasource loaded', "initial items loaded");
		this.orderApply(orderBy || this.config.orderBy);
		// this.table.timeStamp(false, 'datasource loaded', "ordering and grouping");
	}

	changeOrder(order) {
		this.config.orderBy = order;
		this.orderApply();
	}

	orderApply(orderBy) {
		let ordered = [];
		if (orderBy.length > 0) {
			let escapedOrder = [];
			for (let i = 0; i < orderBy.length; i++) {
				let order = orderBy[i];
				let desc = order.startsWith('-');
				let fieldName = desc ? order.substr(1) : order;
				let escapedFieldName = (desc ? "-" : "") + "\'" + fieldName + "\'";
				escapedOrder.push(escapedFieldName);
			}
			this.config.orderBy = escapedOrder;
			if (this.table.attrs.pivotTableMode === "true1") ordered = this.collections.initial;
			else ordered = this.$filter('orderBy')(this.collections.initial, escapedOrder);
		} else ordered = this.collections.initial;
		this.collections.ordered = new Array(ordered.length);
		this.collections.index.orderedIndex = {};
		this.collections.groupsLevels = new Array(this.groups.length);
		this.collections.items = [];
		this.collections.index.itemsIndex = {};

		this.hasGroupFooter = false;
		this.groups.each(function (group, i) {
			this.collections.groupsLevels[i] = [];
			if (group.hasFooter) this.hasGroupFooter = true;
		}, this);
		let previousItem = null;
		ordered.each(function (item, index) {
				this.collections.index.attrs[item.$$uid] = {
					groups: new Array(this.groups.length)
				};
				previousItem = this.addOrderedItem(item, index, previousItem);
			},
			this);
		if (ordered.length > 0 && this.hasGroupFooter) this.setGroupFooterItems(null, previousItem, true);

	}

	addOrderedItem(item, index, previousItem) {
		this.dataItemSetIndex(item, "ordered", index);
		this.collections.ordered[index] = item;
		return this.setDataItemsGroups(item, previousItem);
	}

	filterInit() {
		this.collections.filtered = [];
		this.collections.index.filteredIndex = {};
		this.collections.visibleItems = [];
		this.collections.index.visibleItemsIndex = {};
		this.collections.index.viewedIndex = {};
		this.calculations.init();
		this.config.filterStart();
	}

	filterApply() {
		this.filterInit();
		this.table.prepareFilter();
		let items = this.getCollection("items");
		items.each(function (item, i) {
			this.dataItemSetAttr(item, "hidden", true);
			this.dataItemSetAttr(item, "filtered", true);
			if (item.isGroupHeader) {
				item.groupRecords = 0;
			}
		}, this);
		let ordered = this.getCollection("ordered");
		let previousItem;
		ordered.each(function (item, i) {
			let visible = this.table.itemFilter(item);
			if (visible) {
				previousItem = this.addFilteredItem(item, previousItem);
				this.calculations.calculate(item);
			}
		}, this);
		let filtered = this.getCollection("filtered");
		this.noFilters = ordered.length === filtered.length;
		if (filtered.length > 0) {
			this.dataItemSetAttr(filtered[0], 'isFirstItem', true);
			this.dataItemSetAttr(filtered[filtered.length - 1], 'isLastItem', true);
		}
		this.updateVisibleList();
		// this.table.timeStamp(false, "filter apply", 'filter records');
		// this.table.timeStamp(false, 'datasource loaded', "filter records");
	}

	addFilteredItem(item, previousItem) {
		let index = this.collections.filtered.length;
		this.collections.filtered[index] = item;
		this.dataItemSetIndex(item, "filtered", index);
		let groups = this.dataItemGetAttr(item, "groups");
		let previousGroups = previousItem ? this.dataItemGetAttr(previousItem, "groups") : new Array(groups.length);
		let hidden = false;

		let self = this;
		groups.each(function (group, i) {
			group.groupRecords++;
			this.dataItemSetAttr(group, "filtered", false);

			let parentGroup = group.parent();
			hidden = parentGroup ? parentGroup.collapsed : false;
			if (hidden) {
				self.groupSetAttr(group, "collapsed", true);
				group.collapsed = true;
			}
			this.dataItemSetAttr(group, "hidden", hidden);
			if (group.footerDataItem) {
				this.dataItemSetAttr(group.footerDataItem, "hidden", hidden);
				this.dataItemSetAttr(group.footerDataItem, "filtered", false);
			}
		}, this);
		let group = groups[groups.length - 1];
		this.dataItemSetAttr(item, "hidden", group.collapsed);
		this.dataItemSetAttr(item, "filtered", false);
		return item;
	}

	addItemsItem(item) {
		let index = this.collections.items.length;
		this.dataItemSetIndex(item, "items", index);
		if (item.isGroupItem) this.collections.index.objectByUid[item.$$uid] = item;
		this.collections.items.axPush(item);
	}

	setGroupFooterItems(dataItem, previousItem, last) {
		var currentGroups = this.dataItemGetAttr(previousItem, 'groups');
		if (!last) {
			var nextItemGroups = [];
			var nextItemFullValue = "";
			for (let i = 0; i < this.groups.length; i++) {
				let groupDef = this.groups[i];
				let value = eval(groupDef.expression);//jshint ignore:line
				nextItemFullValue = (i === 0 ? "" : nextItemGroups[i - 1].fullValue + "--") + value;
				let newGroup = {
					isGroupItem: true,
					level: groupDef.level,
					footerHtml: groupDef.hasFooter,
					isGroupFooter: true,
					def: groupDef,
					fullValue: nextItemFullValue,
				};
				nextItemGroups.axPush(newGroup);
			}
			if (currentGroups[this.groups.length - 1].fullValue === nextItemFullValue) return;
			nextItemGroups.eachLastToFirst(function (groupDef, i) {
				if (groupDef.fullValue === currentGroups[i].fullValue) return false;
				if (!groupDef.footerHtml) return true;
				let group = angular.copy(currentGroups[i]);
				group.isGroupItem = true;
				group.isGroupHeader = false;
				group.isGroupFooter = true;
				group.$$uid = this.guid();
				group.lastDataItem = previousItem;
				group.label = groupDef.def.label;
				group.footerLabel = groupDef.def.footer.label;
				group.footerIndent = groupDef.def.footerIndent;
				this.addItemsItem(group);
				let groupHeader = this.getDataItemGroupLevel(previousItem, groupDef.level);
				groupHeader.lastDataItem = previousItem;
				Object.defineProperty(group, "headerDataItem", {
					get() {//jshint ignore:line
						return groupHeader;
					}
				});//jshint ignore:line
				Object.defineProperty(group, "calculations", {
					get() {//jshint ignore:line
						return groupHeader.calculations;
					}
				});//jshint ignore:line
				groupHeader.footerDataItem = group;

			}, this);
		} else {
			for (let i = this.groups.length - 1; i >= 0; i--) {
				let groupDef = this.groups[i];
				if (!groupDef.hasFooter) continue;
				let group = angular.copy(currentGroups[i]);
				group.isGroupItem = true;
				group.isGroupHeader = false;
				group.isGroupFooter = true;
				group.$$uid = this.guid();
				group.lastDataItem = previousItem;
				group.label = groupDef.label;
				group.footerLabel = groupDef.footer.label;
				group.footerIndent = groupDef.footerIndent;
				this.addItemsItem(group);
				let groupHeader = this.getDataItemGroupLevel(previousItem, groupDef.level);
				groupHeader.lastDataItem = previousItem;
				Object.defineProperty(group, "headerDataItem", {
					get() {//jshint ignore:line
						return groupHeader;
					}
				});//jshint ignore:line
				Object.defineProperty(group, "calculations", {
					get() {//jshint ignore:line
						return groupHeader.calculations;
					}
				});//jshint ignore:line
				groupHeader.footerDataItem = group;
			}
		}
	}

	/**
	 * @param {axTableController} table ax-table controller
	 */
	setDataItemsGroups(dataItem, previousItem) {
		var treeDataParent = null;
		let previousItemGroups = [];
		if (previousItem) {
			// this.dataItemSetAttr(previousItem, 'lastItem', []);
			previousItemGroups = this.dataItemGetAttr(previousItem, "groups");
			if (this.hasGroupFooter) this.setGroupFooterItems(dataItem, previousItem);
		}
		for (let i = 0; i < this.groups.length; i++) {
			let groupDef = this.groups[i];
			let value;
			try {
				value = eval(groupDef.expression); // jshint ignore:line
			} catch (Error) {
				throw "Error evaluating group expression: " + groupDef.expression;
			}
			let fullValue = (i === 0 ? "" : treeDataParent.fullValue + '--') + value;
			if (previousItemGroups.length === this.groups.length && !previousItemGroups[i]) console.log("datasource", this, fullValue, dataItem);
			let treeDataGroup = previousItemGroups.length === this.groups.length && previousItemGroups[i].fullValue === fullValue ? previousItemGroups[i] : undefined;
			if (!treeDataGroup) {
				treeDataGroup = this.createGroupItem(i, groupDef, treeDataParent, dataItem);
				treeDataGroup.groupRecords = 0;
				if (groupDef.header.showFilter && !this.table.distinctValues.groupsLevels[i].data.findObject(value, "id")) {
					this.table.distinctValues.groupsLevels[i].data.push({id: value, value: value});
				}
				this.collections.groupsLevels[i].push(treeDataGroup);
				if (this.groupGetAttr(treeDataGroup, "collapsed")) treeDataGroup.collapsed = true;
				if (treeDataGroup.collapsed) this.groupSetAttr(treeDataGroup, "collapsed", true);
				this.addItemsItem(treeDataGroup);
			}
			treeDataParent = treeDataGroup;
			treeDataGroup.groupRecords++;
			this.dataItemGetAttr(dataItem, 'groups')[i] = treeDataGroup;
		}
		this.addItemsItem(dataItem);
		return dataItem;
	}

	getDataItemGroupLevel(dataItem, level) {
		var groups = this.dataItemGetAttr(dataItem, 'groups');
		return groups[level];
	}


	createGroupItem(i, groupDef, treeDataParent, dataItem) {
		let value = eval(groupDef.expression); // jshint ignore:line
		let fullValue = (i === 0 ? "" : treeDataParent.fullValue + '--') + value;
		let lastLevel = groupDef.level === this.groups.length - 1;
		let group = {
			expression: groupDef.expression,
			level: groupDef.level,
			collapsible: groupDef.collapsible,
			maximizable: groupDef.maximizable,
			hasHeader: groupDef.hasHeader,
			hasFooter: groupDef.hasFooter,
			label: groupDef.label,
			headerLabel: groupDef.header.label,
			footerLabel: groupDef.footer.label,
			$$uid: this.guid(),
			isGroupItem: true,
			isGroupHeader: true,
			calculations: {},
			value: value,
			first: false,
			parent: function () {
				return treeDataParent;
			},
			fullValue: fullValue,
			lastLevel: lastLevel,
			collapsed: groupDef.collapsed,
			firstDataItem: dataItem
		};
		group.collapsed = this.groupGetAttr(group, "collapsed");
		if (group.collapsed === null) group.collapsed = groupDef.collapsed;
		group.filter = this.groupGetAttr(group, "filter") || false;
		return group;
	}

	setLastGroupDataItem(previousItem, currentFullValue, j) {
		var prevLastItem = this.dataItemGetAttr(previousItem, 'lastItem');
		prevLastItem[j] = this.dataItemGetAttr(previousItem, 'groups')[j].fullValue !== currentFullValue;
		if (prevLastItem[j]) this.dataItemGetAttr(previousItem, 'groups')[j].lastDataItem = previousItem.$$uid;
	}

	paginateInit() {
		this.collections.index.viewedIndex = {};
		this.collections.index.firstViewedIndex = undefined;
		this.collections.index.lastViewedIndex = undefined;
		this.collections.index.lastNavigableIndex = undefined;
		this.collections.viewed = [];
	}

	updateVisibleList() {
		this.collections.visibleItems = [];
		this.collections.index.visibleItemsIndex = {};
		this.collections.index.viewedIndex = {};
		this.paginated = undefined;
		var data = this.getCollection('items');
		data.each(this.addVisibleItem, this);
		// for (let index = 0; index < data.length; index++) {
		//     this.addVisibleItem(data[index]);
		// }
	}

	addVisibleItem(item) {
		let hidden = this.dataItemGetAttr(item, "hidden");
		if (hidden) return true;
		if (this.noFilters) {
			if (item.isGroupHeader) {
				if (!item.hasHeader) return true;
			}
		} else {
			if (item.isGroupHeader) {
				if (item.groupRecords === 0 || !item.hasHeader) return true;
			}
			else if (item.isGroupFooter) {
				if (item.headerDataItem.groupRecords === 0) return true;
			}
			else {
				if (this.dataItemGetIndex(item, "filtered") === undefined) return true;
			}
		}
		this.dataItemSetIndex(item, "visibleItems", this.collections.visibleItems.length);
		this.collections.visibleItems.axPush(item);
		return true;
	}

	/**
	 * @param {axTableController} table ax-table controller
	 */
	paginateApply() {
		this.fromIndex = this.config.viewFromIndex;
		this.limit = this.config.viewLimit ? this.config.viewLimit() : null;
		this.toIndex = this.limit !== null ? this.config.viewFromIndex + this.limit - 1 : this.collections.visibleItems.length;

		if (this.paginated) if (this.paginated.from === this.fromIndex && this.paginated.to === this.toIndex) {
			//console.log("datasource paginate apply not executed", this.paginated.from, this.fromIndex ,this.paginated.to ,this.toIndex)
			return false;
		}
		this.paginateInit();
		var data = this.getCollection("visibleItems");
		// if (data.length === 0) return true;
		var cntItems = 0;
		var lastItem = null;
		var firstItem = null;
		this.paginated = {
			from: this.fromIndex,
			to: this.toIndex,
		};
		if (data.length > 0)
			for (let index = this.fromIndex - 1; index < this.toIndex; index++) {
				let item = data[index];
				// if (!firstItem && !item.isGroupItem) firstItem = item;
				this.addViewedItem(item);
				// if (!item.isGroupItem) lastItem = item;
				cntItems++;
			}
		let viewed = this.collections.viewed;
		if (viewed.length > 0) {
			this.collections.index.firstViewedIndex = viewed[0].$$uid;
			this.collections.index.lastNavigableIndex = viewed[Math.min(viewed.length, this.config.lastNavigableIndex) - 1].$$uid;
			this.collections.index.lastViewedIndex = viewed[viewed.length - 1].$$uid;
		}
		return true;
	}

	addViewedItem(item) {
		this.dataItemSetIndex(item, "viewed", this.collections.viewed.length);
		this.collections.viewed.axPush(item);
	}

	getLastVisibleItemIndex() {
		var data = this.getCollection('items');
		for (let i = data.length - 1; i >= 0; i--) {
			let item = data[i];
			if (item.isGroupItem) continue;
			let hidden = this.dataItemGetAttr(item, "hidden");
			if (hidden) continue;
			return i;
		}
		return -1;
	}

	groupExpandLastLevels() {
		this.getCollection("items").each(function (item, i) {
			if (item.isGroupHeader && item.collapsed) {
				item.collapsed = false;
				this.groupSetAttr(item, "collapsed", false);
			}
			this.dataItemSetAttr(item, "hidden", false);
		}, this);
	}

	groupExpandLevels(level, lastLevel) {
		this.getCollection("groupsLevels")[level].each(function (group, i) {
			if (level < lastLevel && group.collapsed) {
				group.collapsed = false;
				this.groupSetAttr(group, "collapsed", false);
			}
			this.dataItemSetAttr(group, "hidden", false);
			if (group.footerDataItem) this.dataItemSetAttr(group.footerDataItem, "hidden", false);
		}, this);
		if (level === this.groups.length)
			this.getCollection("filtered").each(function (item, i) {
				this.dataItemSetAttr(item, "hidden", false);
			}, this);
	}

	groupCollapseLevels(level, topLevel) {
		this.getCollection("groupsLevels")[level].each(function (group, i) {
			if (!group.collapsed) {
				group.collapsed = true;
				this.groupSetAttr(group, "collapsed", true);
			}

			if (!topLevel) {
				this.dataItemSetAttr(group, "hidden", true);
				if (group.footerDataItem) this.dataItemSetAttr(group.footerDataItem, "hidden", true);
			}
		}, this);
		if (level === this.groups.length - 1)
			this.getCollection("filtered").each(function (item, i) {
				this.dataItemSetAttr(item, "hidden", true);
			}, this);
	}


	groupCollapsed(group, allLevels) {
		let startIndex = this.dataItemGetIndex(group, "items") + 1;
		this.getCollection("items").each(function (item, i) {
			if (item.isGroupItem) {
				if (item.level <= group.level) return false;
				if (!item.collapsed) {
					item.collapsed = true;
					this.groupSetAttr(item, "collapsed", true);
				}
			}
			else {
				let itemGroups = this.dataItemGetAttr(item, "groups");
				if (itemGroups[group.level].fullValue !== group.fullValue) return false;
			}
			this.dataItemSetAttr(item, "hidden", true);
		}, this, startIndex);

		if (!allLevels) this.updateVisibleList();
	}

	groupExpanded(group, allLevels) {
		let startIndex = this.dataItemGetIndex(group, "items") + 1;
		this.getCollection("items").each(function (item, i) {
			if (item.isGroupItem) {
				if (item.level === group.level) return false;
				if (item.level > group.level + 1) return true; // asta e posibil sa dea dude undeva!!!!!!!!!!!
			} else {
				if (!group.lastLevel) return true;
				let itemGroups = this.dataItemGetAttr(item, "groups");
				if (itemGroups[group.level].fullValue !== group.fullValue) return false;
			}
			this.dataItemSetAttr(item, "hidden", false);
		}, this, startIndex);
		if (!allLevels) this.updateVisibleList();
	}


	dataItemSetClone(dataItem) {
		this.dataItemSetAttr(dataItem, "clone", angular.copy(dataItem));
	}

	dataItemGetClone(dataItem) {
		return this.dataItemGetAttr(dataItem, "clone");
	}

	dataItemRemoveAttr(dataItem, attr) {
		if (!this.collections.index.attrs[dataItem.$$uid] || !angular.isDefined(this.collections.index.attrs[dataItem.$$uid][attr])) return;
		this.collections.index.attrs[dataItem.$$uid][attr] = undefined;
	}

	dataItemGetAttr(dataItem, attr) {
		var value;
		if (!this.collections.index.attrs[dataItem.$$uid] || !angular.isDefined(this.collections.index.attrs[dataItem.$$uid][attr])) value = null;
		else value = this.collections.index.attrs[dataItem.$$uid][attr];
		return value;
	}

	dataItemSetAttr(dataItem, attr, value) {
		if (!this.collections.index.attrs[dataItem.$$uid]) this.collections.index.attrs[dataItem.$$uid] = {};
		this.collections.index.attrs[dataItem.$$uid][attr] = value;
	}

	dataItemSetIndex(dataItem, collection, value) {
		this.collections.index[collection + "Index"][dataItem.$$uid] = value;
	}

	dataItemGetIndex(dataItem, collection) {
		return this.collections.index[collection + "Index"][dataItem.$$uid];
	}

	getGroupByFullValue(fullValue) {
		return this.findObject(fullValue, "fullValue", this.collections.items);
	}

	groupSetAttr(group, attr, value) {
		if (!this.collections.index.groupsAttrs) this.collections.index.groupsAttrs = {};
		if (!this.collections.index.groupsAttrs[attr]) this.collections.index.groupsAttrs[attr] = {};
		this.collections.index.groupsAttrs[attr][group.fullValue] = value;
	}


	groupGetAttr(group, attr) {
		var value;
		if (!this.collections.index.groupsAttrs) this.collections.index.groupsAttrs = {};
		if (!this.collections.index.groupsAttrs[attr] || !angular.isDefined(this.collections.index.groupsAttrs[attr][group.fullValue])) value = null;
		else value = this.collections.index.groupsAttrs[attr][group.fullValue];
		return value;
	}

	add(item, applyChangesOnSave) {
		this.addInitialItem(item, this.collections.initial.length);
		this.collections.initial.axPush(item);
		// if (applyChangesOnSave) {
		if (true) {
			this.dataItemSetAttr(item, 'groups', new Array(this.groups.length));
			this.addOrderedItem(item, this.getCollection("ordered", true));
			//this.addItemsItem(item);
			this.addFilteredItem(item);
			this.addVisibleItem(item);
			this.paginated = undefined;
			if (this.table.attrs.editRow === "editor") this.addViewedItem(item);
			//else this.dataItemSetClone({$$uid:dataItem.$$uid})
		}
		this.calculations.update();

	}

	delete(item, applyChangesOnSave) {
		this.removeCollectionItem("initial", item);
		if (!applyChangesOnSave) {
			this.removeCollectionItem("ordered", item);
			this.removeCollectionItem("filtered", item);
			this.removeCollectionItem("items", item);
			this.removeCollectionItem("visibleItems", item);
			this.paginated = undefined;
		}
		this.calculations.update();
	}

	removeCollectionItem(collection, item) {
		// console.log("removeItem", collection, item);
		let index = this.dataItemGetIndex(item, collection);
		this.dataItemSetIndex(item, collection, undefined);
		this.collections[collection].splice(index, 1);
		this.getCollection(collection).each(function (item, i) {
			this.dataItemSetIndex(item, collection, i);
		}, this, index);
	}

	update(item, applyChangesOnSave) {
		var originalItem = this.findDataItemById(item);
		if (!originalItem && item.$$uid) {
			originalItem = this.collections.index.objectByUid[item.$$uid];
			if (item[this.config.idField]) this.collections.index.objectById[item[this.config.idField]] = item;
		}
		if (!originalItem) throw "Not found item in initial collections for " + item.toString();
		angular.extend(originalItem, item);
		this.calculations.update();

	}

	create() {
		return this.config.emptyItem();
	}

	findExtendedObject(objectFind, data) {
		data = data || this.collections.initial;
		for (var i = 0; i < data.length; i++) {
			var item = data[i];
			let isNotEquale = false;
			for (let j in objectFind) {
				if (objectFind.hasOwnProperty(j)) {
					if (objectFind[j] === item[j]) continue;
					isNotEquale = true;
					break;
				}
			}
			if (isNotEquale) continue;
			else return item;
		}
		return false;
	}

	findOriginalObjectIndex(objectFind, data) {
		data = data || this.collections.initial;
		for (var i = 0; i < data.length; i++) {
			var item = data[i];
			let isNotEquale = false;
			for (let j in item) {
				if (item.hasOwnProperty(j)) {
					if (objectFind[j] === item[j]) continue;
					isNotEquale = true;
					break;
				}
			}
			if (isNotEquale) continue;
			else return i;
		}
		return -1;
	}

	isEmptyObject(item) {
		for (let prop in item) {
			if (!item.hasOwnProperty(prop)) continue;
			return false;
		}
		return true;
	}

	findDataItemById(dataItem) {
		let columnToSearch = this.config.idField;
		return this.collections.index.objectById[dataItem[columnToSearch]];
	}

	findObject(value, columnToSearch, data) {
		columnToSearch = columnToSearch || this.config.idField;
		if (columnToSearch === this.config.idField) return this.collections.index.objectById[value];

		data = data || this.getCollection("ordered");
		for (var i = 0; i < data.length; i++) {
			var item = data[i];
			if (!angular.isDefined(item[columnToSearch])) continue;
			if (item[columnToSearch] == value) return item; // eslint-disable-line
		}
		return false;
	}

	findObjectIndex(value, columnToSearch, data) {
		columnToSearch = columnToSearch || this.config.idField;
		data = data || this.getCollection("ordered");
		for (var i = 0; i < data.length; i++) {
			var item = data[i];
			if (!angular.isDefined(item[columnToSearch])) continue;
			if (item[columnToSearch] == value) return i; // eslint-disable-line
		}
		return -1;
	}
}
