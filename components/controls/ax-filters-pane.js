(function(window, angular) {
	var module = angular.module('ax.components');
	module.component('axFiltersPane',
		{
			bindings: {
				config: "=?"
			},
			template: template,
			controller: controller
		});
	template.$inject = ["$element", "$attrs"];
	function template($element, $attrs) {
		var attributes = $element[0].attributes;
		var template = new axFiltersPaneTemplate($element[0]);
		$attrs.initial = angular.copy($element);
		return template;
	}

	controller.$inject = ["$scope", "$element", "$attrs", "$timeout", "$compile", "axDataStore", "$http", "notify", "$filter", "$parse"];
	function controller(scope, element, attrs, $timeout, $compile, dataStore, $http, notify, $filter,$parse) {
		scope.$ctrl = new axFiltersPaneController(scope.$parent, attrs.initial, attrs, $timeout, dataStore, $http, notify, $filter,$parse);
	}
})(window, angular);

class axFiltersPaneTemplate extends axElement {
	constructor(element, scope) {
		super();
		this.attributes = {
			title: "",
			"pane-width": "",
			"header-height": "",
			"config": "$ctrl",
			"auto-load-data": "true",
			"load-data-url": "",
			"load-data-responses": ""
		};
		return this.create(element, scope);
	}

	create(element, scope) {
		this.extractAttributesValues(element, scope);
		this.config = this.attributes.config;
		this.uid = axUtils.Guid();
		this.source.setAttribute("uid", this.uid);
		var left = parseInt(this.attributes["pane-width"]) - 10;
		if (this.attributes.collapsible) this.source.setAttribute("ng-style", "{left: " + this.config + ".collapsed? '" + left + "px': '0'}");
		this.addStyle("position", "relative");
		this.addStyle("height", "100%");
		this.addStyle("width", this.attributes["pane-width"]);
		var div = axElement.createDOMElement("div", this.source.attributes);
		div.setAttribute("class", "filters-pane");
		div.style.margin = "";
		div.setAttribute("role", "side-panel");
		var header = this.createHeader(element);
		div.appendChild(header);
		var body = this.createBody();
		div.appendChild(body);
		this.createEdit(div);
		return div;
	}

	createHeader(element) {
		var axHeaderDef = this.getDirectChildrenOfType("ax-filters-pane-header");
		var div;
		var clearBtn = this.createDOMElement("button", {
			class: "btn icon clear-btn ",
			"uib-tooltip": "Clear all filters",
			"ng-click": "$ctrl.clear();$event.stopPropagation()",
			style: 'width:25px;padding:0;margin:1px 1px 1px 5px;'
		});
		var clearIcon = this.createDOMElement("i", { class: "fa fa-eraser" });
		clearBtn.appendChild(clearIcon);
		if (axHeaderDef.length === 0) {
			div = axElement.createDOMElement("div", { role: "filters-pane-header" });
			if (!this.attributes["header-height"]) throw "No pane-height attribute provided for ax-filters-pane element!";
			div.addStyle("height", this.attributes["header-height"]);
			var span = axElement.createDOMElement("span", { role: "filter-pane-title" });
			var titleNode = document.createTextNode(this.attributes.title);
			span.appendChild(titleNode);
			div.appendChild(span);
			div.appendChild(clearBtn);
		} else {
			axHeaderDef[0].setAttribute("role", "filters-pane-header");
			if (!axHeaderDef[0].getAttribute("height")) throw "No height attribute provided for ax-filters-pane-header element!";
			this.attributes["header-height"] = axHeaderDef[0].getAttribute("height") || this.attributes["header-height"];
			div = axElement.createDOMElement("div", axHeaderDef[0].attributes);
			div.addStyle("height", this.attributes["header-height"]);
			axElement.addChildren(div, axHeaderDef[0]);
			element.removeChild(axHeaderDef[0]);
			div.appendChild(clearBtn);
		}
		if (element.hasAttribute('collapsible') && element.getAttribute('collapsible') !== 'false') {
			if (div.children.length === 0) {
				let span = this.createDOMElement('span');
				span.innerHTML = div.innerHTML;
				div.innerHTML = span.outerHTML;
			}
			var closePaneIcon = axElement.createDOMElement("span",
					{
						class: 'fa fa-angle-double-left',
						"ng-class": "{'fa-angle-double-left': !$ctrl.collapsed, 'fa-angle-double-right': $ctrl.collapsed}",
						"ng-click": "$ctrl.togglePane()",
						"uib-tooltip": "Open/hide filters pane.",
						"style": "position: absolute; right: 0px; top: 6px; "
					});
			div.appendChild(closePaneIcon);
		}
		return div;
	}

	createBody() {
		var bodyDiv = axElement.createDOMElement("div",
				{
					role: "filters-pane-view",
					style: "overflow:hidden;border:0px solid;position:absolute;top:" + this.attributes["header-height"] + ";left:0;right:10px;bottom:0;"
				});
		this.items = this.getDirectChildrenOfType("ax-filters-pane-item");
		this.createView(bodyDiv);
		return bodyDiv;
	}

	createView(bodyDiv) {
		this.itemsViews = [];
		for (let i = 0; i < this.items.length; i++) {
			let item = this.items[i];
			item.uid = axUtils.Guid();
			item.setAttribute("uid", item.uid);
			let config = item.getAttribute("config");
			let title = item.getAttribute("title");
			let viewColumn = item.getAttribute("view-column");
			let idColumn = item.getAttribute("id-column");
			let invariantColumn = item.getAttribute("invariant-column");
			let viewsDef = this.getDirectChildrenOfType("ax-filters-pane-item-view", item);
			if (viewsDef.length === 0) {
				let view = this.createViewItem(item, config, title, viewColumn, idColumn, invariantColumn);
				bodyDiv.appendChild(view);
			}
		}
		return;
	}

	createViewItem(item, config, title, viewColumn, idColumn, invariantColumn) {
		var div = this.createDOMElement("div",
				{
					role: "filter-item-view"

				});
		var titleDiv = this.createDOMElement("div",
				{
					role: "filter-item-view-title",
					"ng-click": "$ctrl.edit = '" + config + "'"
				});
		var titleTextNode = document.createTextNode(title);
		titleDiv.appendChild(titleTextNode);
		var span = this.createDOMElement("span", {
			"ng-show": "$ctrl.children." + config + ".getSelectedItems().length>0",
			'ng-bind': "' '+ ($ctrl.children." + config + ".getSelectedItems().length) + ' items' "

		});
		titleDiv.appendChild(span);
		var toggleIcon = this.createDOMElement("button",
				{
					class: "fa toggle-btn",
					uib: "Collapse/expand list of items",
					"ng-class": "{'fa-compress': !$ctrl.children." + config + ".collapsed, 'fa-expand': $ctrl.children." + config + ".collapsed}",
					"ng-click": "$ctrl.children." + config + ".collapsed = !$ctrl.children." + config + ".collapsed;$event.stopPropagation()"
				});
		titleDiv.appendChild(toggleIcon);
		var toolbarDiv = this.createDOMElement('div', { role: 'filter-toolbar', class: 'inline allWidth' });
		var clearBtn = this.createDOMElement("button", {
			class: "btn btn-primary clear-btn ",
			'ng-disabled': "$ctrl.children." + config + '.selectedItems.length===0',
			"ng-click": "$ctrl.children." + config + ".clear();$event.stopPropagation()",
			style: 'width:200px;padding:0;margin:1px 1px 1px 0px;border-style:solid;'
		});
		var clearIcon = this.createDOMElement("i", { class: "fa fa-eraser" });
		clearBtn.appendChild(clearIcon);
		clearBtn.innerHTML += "Clear filter";
		toolbarDiv.appendChild(clearBtn);
		var editBtn = this.createDOMElement("button", {
			class: "btn btn-primary edit-btn",
			"ng-click": "$ctrl.loadEdit('" + config + "')",
			style: 'width:200px;padding:0;margin:1px 0px 1px 1px;border-style:solid;'
		});
		var editIcon = this.createDOMElement("i", { class: "fa fa-edit" });
		editBtn.appendChild(editIcon);
		editBtn.innerHTML += "Edit filter";
		toolbarDiv.appendChild(editBtn);
		div.appendChild(titleDiv);
		div.appendChild(toolbarDiv);
		var bodyDiv = this.createDOMElement("ax-list",
								{
									role: "filter-item-view-body",
									config: "$ctrl.children." + config + ".view",
									"ng-hide": "$ctrl.children." + config + ".collapsed || $ctrl.children." + config + '.selectedItems.length===0',
									width: '100%',
									style: 'position:relative;height:150px;overflow-y:auto',
									datasource: "$ctrl.children." + config + '.selectedItems',
									orderBy: invariantColumn !== 'null' ? invariantColumn : viewColumn,
									'show-close-popup': 'false',
									'item-display-field': viewColumn,
									'item-id-field': idColumn,
									'item-invariant-field': invariantColumn !== 'null' ? invariantColumn : ''
								});
		createElement('ax-column',
				{
					width: '227px',
					'ng-class': "{ 'deleted-item': dataItem.Deleted }"
				}, "<div style='width:200px !important;overflow:hidden' ng-bind='::dataItem[\"" + viewColumn + "\"]'></div>"
				+ "<i class='fa fa-eraser filter-item-remove' style='position:absolute;right:0;top:0' ng-click='$event.stopPropagation();$ctrl.$parent.$ctrl.children." + config + ".onItemDeselect(dataItem)'></i>", bodyDiv); //jshint ignore:line

		div.appendChild(bodyDiv);
		return div;
	}

	createEdit(container) {
		var edit = this.createDOMElement("div",
				{
					"ng-if": "!$ctrl.collapsed",
					"style": "position: absolute; top: 0; bottom: 0; left: 0; width: " + this.attributes["pane-width"] + ";",
					"role": "filter-edit-pane",
					"ng-style": "{'z-index':$ctrl.edit?100:-100}"
				});

		this.itemsViews = [];
		for (let i = 0; i < this.items.length; i++) {
			let item = this.items[i];
			let editItem = {
				config: item.getAttribute("config"),
				title: item.getAttribute("title"),
				idColumn: item.getAttribute("id-column"),
				viewColumn: item.getAttribute("view-column"),
				invariantColumn: item.hasAttribute("invariant-column") ? item.getAttribute("invariant-column") : '',
				editsDef: this.getDirectChildrenOfType("ax-filters-pane-item-edit", item)
			};

			if (editItem.editsDef.length === 0)
				editItem.template = this.createEditItem(item, editItem.config, editItem.title, editItem.viewColumn, editItem.idColumn, editItem.invariantColumn);
			else
				editItem.template = this.createCustomEditItem(item, editItem.editsDef[0], editItem.config, editItem.title, editItem.viewColumn, editItem.idColumn, editItem.invariantColumn);
			edit.appendChild(editItem.template);
		}
		container.appendChild(edit);
		return;
	}

	createCustomEditItem(item, editDef, config, title, viewColumn, idColumn, invariantColumn) {
		var div = this.createDOMElement("div",
				{
					"ng-class": "{'filter-show':($ctrl.edit=='" + config + "')}",
					"ng-if": "$ctrl.edit=='" + config + "'",
					class: "filter-edit",
					id: item.uid,
					role: "filter-item-edit",
					"filter-for": title
				});
		var titleDiv = this.createDOMElement("div",
				{
					role: "filter-item-edit-title"
				});

		var titleTextNode = document.createTextNode(title);
		titleDiv.appendChild(titleTextNode);

		var closeIcon = this.createDOMElement("button",
				{
					class: "fa fa-long-arrow-left",
					role: "filter-edit-close",
					"uib-tooltip": "Close edit panel",
					"ng-click": "$ctrl.closeEdit();"
				});
		titleDiv.appendChild(closeIcon);

		var bodyDiv = this.createDOMElement("div", { role: "filter-item-edit-body" });
		axElement.addChildren(bodyDiv, editDef);
		div.appendChild(titleDiv);
		div.appendChild(bodyDiv);
		return div;
	}

	createEditItem(item, config, title, viewColumn, idColumn, invariantColumn) {
		var div = this.createDOMElement("div",
				{
					"ng-class": "{'filter-show':($ctrl.edit=='" + config + "')}",
					"ng-if": "$ctrl.edit=='" + config + "'",
					class: "filter-edit",
					id: item.uid,
					role: "filter-item-edit",
					"filter-for": title
				});
		var titleDiv = this.createDOMElement("div",
				{
					role: "filter-item-edit-title"
				});

		var titleTextNode = document.createTextNode(title);
		titleDiv.appendChild(titleTextNode);

		var closeIcon = this.createDOMElement("button",
				{
					class: "fa fa-long-arrow-left",
					role: "filter-edit-close",
					"uib-tooltip": "Close edit panel",
					"ng-click": "$ctrl.closeEdit();"
				});
		titleDiv.appendChild(closeIcon);
		var bodyDiv = createElement('ax-list',
				{
					role: "filter-item-edit-body",
					'style': 'top:26px;left:0;bottom:0;width:260px;height:initial;',
					'selectable-rows': 'multiple',
					'item-id-field': idColumn,
					'item-display-field': viewColumn,
					'show-close-popup': 'false',
					'item-invariant-field': invariantColumn === null ? '' : invariantColumn,
					'config': '$parent.$parent.$ctrl.children.' + config,
					'datasource': '$parent.$parent.$ctrl.children.' + config + '.data',
					'selectable-rows-model': '$parent.$parent.$ctrl.children.' + config + '.selectedItems',
					'selectable-rows-model-type': 'object',
					'on-selection-change': '$parent.$parent.$ctrl.children.' + config + '.onSelectionChange(dataItem)',
					'order-by': invariantColumn === "" ? viewColumn : invariantColumn,
					'show-check-all': true,
					'show-uncheck-all': true,
					'show-search': true
				});
		div.appendChild(titleDiv);
		div.appendChild(bodyDiv);
		return div;
	}

}

class axFiltersPaneController {
	constructor(scope, element, attrs, $timeout, dataStore, $http, notify, $filter, $parse) {
		this.scope = scope;
		this.collapsed = false;
		this.dataStore = dataStore;
		this.$timeout = $timeout;
		this.notify = notify;
		this.$http = $http;
		this.loadDataApiArgs = {};
		this.children = [];
		this.uid = attrs.$$element.attr("uid");
		this.config = attrs.config;
		this.loadDataResponses = attrs.loadDataResponses;
		this.loadDataUrl = attrs.loadDataUrl;
		this.initialCollapsed = false;
		var items = angular.element(element).find(">ax-filters-pane-item");
		for (let i = 0; i < items.length; i++) {
			let item = items[i];
			item.uid = item.getAttribute("uid");
			let config = item.getAttribute("config");
			let title = item.getAttribute("title");
			let viewColumn = item.getAttribute("view-column");
			let invariantColumn = item.getAttribute("invariant-column");
			let idColumn = item.getAttribute("id-column");
			let callback = this.selectItemCallback;
			let filterConfig = this.scope.$eval(config) || {};
			let filterScope;
			if (filterConfig.textFieldName !== viewColumn) {
				filterScope = filterObject(title, viewColumn, invariantColumn, idColumn, callback, $filter, $timeout);
				filterScope.uid = item.uid;
				filterScope = axUtils.objectOverwrite(filterScope, filterConfig);
				$parse(config).assign(this.scope, filterScope);
			} else {
				filterScope = filterConfig;
				filterScope.uid = item.uid;
			}
			this.children[config] = filterScope;
		}

		var filtersScopeObject = this.scope.$eval(attrs.config)  || {};
		this.initialCollapsed = filtersScopeObject.collapsed;
		filtersScopeObject.collapsed = false;
		if (!filtersScopeObject.selectItemCallback) {
			filtersScopeObject.selectItemCallback = angular.noop;
		}
		filtersScopeObject.loaded = true;
		filtersScopeObject = axUtils.objectOverwrite(this, filtersScopeObject);
		$parse(attrs.config).assign(this.scope, filtersScopeObject);

	}
	clearData() {
		for (let childName in this.children) {
			if (!this.children.hasOwnProperty(childName)) continue;
			let child = this.children[childName];
			child.clear();
			child.clearData();
		}
	}
	clear() {
		for (let childName in this.children) {
			if (!this.children.hasOwnProperty(childName)) continue;
			let child = this.children[childName];
			child.clear();
		}
	}
	loadEdit(templateName) {
		this.edit = templateName;
	}
	loadData() {
		var $ctrl = this;
		if (this.initialCollapsed) {
			this.initialCollapsed = false;
			this.togglePane(true);
		}
		var loader = this.dataStore.loader();
		var apiArgs = angular.isFunction(this.loadDataApiArgs) ? this.loadDataApiArgs() : this.loadDataApiArgs;
		this.$http.get(this.loadDataUrl, { params: apiArgs })
				.then(function(response) {
					if (!response.data.status) {
						loader.remove();
						console.error(":-(", response);
						return;
					}
					let responses = $ctrl.loadDataResponses.split(";");
					for (let i = 0; i < responses.length; i++) {
						if (responses[i] === "") continue;
						let obj = responses[i].split("=>");
						let serverResponse = obj[0];
						var scopeContainer = obj[1];
						try {
							if (scopeContainer === "")
								eval("$ctrl.scope." + serverResponse + "= response.data." + serverResponse + ";");// jshint ignore:line
							else
								eval("$ctrl.scope." + scopeContainer + "= response.data." + serverResponse + ";");// jshint ignore:line
						} catch (exception) {
							console.error("load-data-responses error for: " + responses[i], obj[0], obj[1]);
							console.error(exception);
						}
					}
					if (angular.isFunction($ctrl.loadDataCallback)) $ctrl.loadDataCallback(response.data.data);
					loader.remove();
				})
				.catch(function(response) {
					console.error(response);
					$ctrl.notify.error(response.statusText || "Filter data service failed!");
					loader.remove();
				});
	}
	getElement(selector) {
		return angular.element("[role=side-panel][uid=" + this.uid + "] " + selector);
	}
	togglePane(collapsed) {
		if (angular.isDefined(collapsed)) this.collapsed = collapsed;
		else this.collapsed = !this.collapsed;
		if (this.collapsed) {
			angular.element("[role=side-panel][uid=" + this.uid + "]").removeClass('pane-left-expand').addClass('pane-left-collapse');
		} else {
			angular.element(event.target).closest("[role=side-panel][uid=" + this.uid + "]").removeClass('pane-left-collapse').addClass('pane-left-expand');
		}
		this.$timeout(axUtils.triggerWindowResize);
	}

	closeEdit() {
		var $ctrl = this;
		var uid = this.scope[this.edit].uid;
		var element = angular.element("#" + uid + ".filter-edit").addClass('pane-left-closing');
		this.$timeout(function() {
			element.removeClass('pane-left-closing');
			$ctrl.edit = undefined;
		},
				450);
	}
}


var filterObject = function(title, textFieldName, invariantColumn, idFieldName, callback, $filter, $timeout) {
	var obj = {
		collapsed: false,
		$filter: $filter,
		$timeout: $timeout,
		title: title,
		textFieldName: textFieldName,
		invariantColumn: invariantColumn,
		idFieldName: idFieldName,
		data: [],
		selectedItems: [],
		currentItem: {},
		getNoItemsText: function() {
			if (this.getSelectedItems().length === 0)
				return "Use Edit button for select filter items.";
			else return "";
		},
		getSelectedItemsIds: function() {
			var ids = [];
			var items = this.getSelectedItems();
			for (var i = 0; i < items.length; i++) {
				var item = items[i];
				ids.push(item[this.idFieldName]);
			}
			return ids;
		},
		getSelectedItems: function() {
			var selected = [];
			if (this.filterStart) this.filterStart();
			for (var i = 0; i < this.selectedItems.length; i++) {
				var item = this.selectedItems[i];
				if (this.isFilteredItem(item)) continue;
				selected.push(item);
			}
			return selected;
		},
		clearData: function() {
			this.data = [];
		},
		clear: function() {
			for (let i = 0; i < this.data.length; i++) {
				let item = this.data[i];
				this.onItemDeselect(item);
			}
		},
		isFilteredItem: function(item) {
			if (this.itemCustomFilter && !this.itemCustomFilter(item)) return true;
			else return false;
		},
		onSelectionChange: function(item) {
			if (this.isSelected(item)) this.onItemSelect(item);
			else this.onItemDeselect(item);
		},
		onItemSelect: function(item) {
			item.selected = true;
			if (this.selectedItems.indexOf(item) > -1) this.view.$ctrl.datasourceChanged();
			else this.view.$ctrl.dataItemAdd(item);
			if (callback) callback(item);
		},
		onItemDeselect: function(item) {
			item.selected = false;
			var index = this.selectedItems.indexOf(item);
			if (index === -1) this.view.$ctrl.datasourceChanged();
			else this.view.$ctrl.dataItemRemove(item);
			if (callback) callback(item);
		}
	};
	return obj;
};
