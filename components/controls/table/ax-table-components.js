(function () {
	var module = angular.module('ax.components');
	var bindings = {
		onSelectionChange: "&",
		config: '=?',
		parentConfig: "=?",
		selectableRowsModel: '=?',
		selectableDisabled: "&",
		rowIsDisabled: '&',
		canEdit: "=?",
		datasource: '=?',
		datasourceConfig: "=?"
	};


	var props = {
		bindings: bindings,
		template: $axTableTemplate,
		controller: $axTableController
	};
	module.component('axTable', props);
	module.component('axList', props);

	$axTableTemplate.$inject = ["$element", "$attrs"];

	function $axTableTemplate($element, $attrs) {
		// if ($attrs.debug === "true") console.log("template", $element.outerHTML());
		if ($attrs.hasGrid !== "true") {
			$element.find(">ax-table-editor").remove();
			if ($attrs.editRow === "editor") $element.setAttribute("edit-row", "");
		}
		$element.find(">ax-table-content").remove();
		$attrs.initial = angular.copy($element);
		$element.html("");
		let template = createElement("ax-table-content", {
			template: "$ctrl.element.html",
			tabindex: "1",
			ngKeydown: "$ctrl.tableKeyDown($event)",
			style: "display:block;position:relative;width:100%;height:100%;overflow:hidden"
		});
		var defaultAttrs = $axTableConfig().defaultAttrs;
		for (let attr in defaultAttrs) {
			if (angular.isDefined($attrs[attr])) continue;
			$attrs.initial.attr(axUtils.reverseCamelCase(attr), defaultAttrs[attr]);
			$attrs[attr] = defaultAttrs[attr];
		}

		if ($element[0].tagName === "AX-TABLE" || $attrs.hideable === "true") {
			$attrs.initial.attr("hideable", "true");
			template.setAttribute("ng-if", "$ctrl._show");
			template.style.visibility = "hidden";
		}
		// if ($attrs.debug === "true") console.log("template", template.outerHTML);
		return template.outerHTML;
	}

	$axTableController.$inject = ["$element", "$scope", "$attrs", "$window", "$compile", "$interpolate", 'ngDialog', '$timeout', 'axDataStore', 'notify', 'axApi', '$injector', "orderByFilter", "$filter", "uibDateParser", "$parse"];

	function $axTableController($element, scope, attrs, $window, $compile, $interpolate, ngDialog, $timeout, dataStore, notify, $axApi, $injector, $orderBy, $filter, dateParser, $parse) {
		if (attrs.debug === "true") dataStore.timeStamp(false, "pivot-create", "controller start", false);
		if (attrs.config && !scope.$parent.$eval(attrs.config))
			this.config = $parse(attrs.config).assign(scope.$parent, {});
		if (!attrs.config) this.config = {};

		var template = new axTableTemplate(attrs.initial, attrs, $element, dataStore, this.config, $interpolate, scope);
		// if (attrs.debug === "true") console.log("controller template", template.html());
		template.controller = angular.extend(scope.$ctrl, template.controller);
		scope.$ctrl.$template = template;
		scope.$ctrl.$$grid = scope.$parent.grid;
		var dtConfig = {
			idField: attrs.itemIdField || "$$uid",
			orderBy: attrs.orderBy
		};
		if (attrs.datasourceConfig) dtConfig = angular.extend(this.datasourceConfig, dtConfig);
		scope.$ctrl.$filter = $filter;
		scope.$ctrl.$parse = $parse;
		scope.$ctrl.$dataStore = dataStore;
		scope.$ctrl.$ngDialog = ngDialog;
		scope.$ctrl.$dataStore = dataStore;
		scope.$ctrl.$compile = $compile;
		scope.$ctrl.$interpolate = $interpolate;

		scope.$ctrl.$timeout = function (fn, timeout) {
			//this.debug.log('timeout', unu);
			return $timeout(function () {
				if (!scope || scope.$ctrl.destroying) return;
				fn.call(scope.$ctrl);
			}, timeout || 0);
		};
		scope.$ctrl.$timeoutCancel = function (timeout) {
			return $timeout.cancel(timeout);
		};
		scope.$ctrl.timeouts = {};
		scope.$ctrl.$notify = notify;


		scope.$ctrl.$dataSource = new axTableDatasource(dtConfig, $filter, dataStore);

		var controller = new axTableController(scope.$ctrl);
		scope.$ctrl = extendPrototypeObject(scope.$ctrl, controller);
		controller = null;
		var exportObj = new axTableExport(scope.$ctrl);
		var profilesObj = new axTableProfiles(scope.$ctrl);
		if (!attrs.pivotTableMode && attrs.customizablePivotTable !== "false") var pivotTableObj = new axTablePivotTable(scope.$ctrl);

		if (attrs.editRow === "editor") {
			var editPopup = new axTableEditor(scope.$ctrl);
		}
		var filters = scope.$ctrl.config ? (scope.$ctrl.config.filters || {}) : {};
		filters = angular.extend(filters, template.controller.filters || {});
		if (!scope.$ctrl.config) scope.$ctrl.config = {};
		if (scope.$parent.grid && scope.$parent.grid.config) axUtils.objectOverwrite(scope.$ctrl.config, scope.$parent.grid.config);
		if (scope.$parent.grid) {
			scope.$parent.grid.tableKeyDown = function (event) {
				scope.$ctrl.tableKeyDown(event);
			};
			scope.$parent.grid.element.$timeout = $timeout;
		}
		scope.$ctrl.filters = filters;
		scope.$ctrl.$dataSource.table = scope.$ctrl;
		//extendPrototypeObject(scope.$ctrl, controller);
		if (attrs.api) {
			if (!attrs.datasource) attrs.datasource = 'remote';
			scope.$ctrl.$api = $injector.get(attrs.api);
		} else if (attrs.parentConfig && attrs.apiController) {
			if (!attrs.datasource) attrs.datasource = 'remote';
			let config = {
				controller: attrs.apiController.replace('api/', ''),
				idField: attrs.itemIdField
			};
			scope.$ctrl.$childApi = new $axApi(config);
		} else if (attrs.apiController) {
			if (!attrs.datasource) attrs.datasource = 'remote';
			var config = {
				controller: attrs.apiController.replace('api/', ''),
				idField: attrs.itemIdField
			};
			scope.$ctrl.$api = new $axApi(config);
		}
		if (attrs.datasource === 'remote') scope.$ctrl.autoLoadData = attrs.autoLoadData || 'true';
		scope.$ctrl.createExportApi($axApi);
		axTableProfiles.createApi($axApi, scope.$ctrl);
		if (attrs.pivotTableMode) scope.$ctrl.config = {};
		if (!scope.$ctrl.$parent) {
			Object.defineProperty(scope.$ctrl, "$parent", {
				get() {
					var parent = scope ? (scope.$ctrl.$$grid ? scope.$ctrl.$$grid.$parent : scope.$parent) : null;
					return parent;
				}
			});
			//if (scope.$ctrl.$$grid && scope.$ctrl.attrs.customizablePivotTable === "true")
			//	Object.defineProperty(scope.$ctrl, "$$pivotTable", {
			//		get() {
			//			var parent = scope.$ctrl.$$grid.$$pivotTable;
			//			return parent;
			//		},
			//		set(config) {
			//			axUtils.objectOverwrite(scope.$ctrl.$$grid.$$pivotTable.config, config);
			//		}
			//	});
		}
		scope.$ctrl.scope = function () {
			return scope;
		};
		scope.$ctrl.$orderBy = $orderBy;
		scope.$ctrl.dateParser = dateParser;
		if (scope.$ctrl.config) scope.$ctrl.config.$ctrl = scope.$ctrl;
		var self = this;
		$timeout(function () {
			scope.$ctrl.debug.log("controller post", attrs.config);
			scope.$ctrl.post($element, scope, attrs);
			if (attrs.hasGrid === "true" && attrs.pivotTableMode !== "true") scope.$ctrl.$$grid.$$table = scope.$ctrl;
			if (scope.$ctrl.$$grid && attrs.pivotTableMode === "true") {
				scope.$ctrl.$$grid.$$pivotTable = scope.$ctrl;
			}
			if (scope.$ctrl.config && scope.$ctrl.config.controllerIsCreated) scope.$ctrl.config.controllerIsCreated();
			if (template.attributes["has-horizontal-virtual-scroll"] !== "true" && template.attributes["has-dynamic-template"] !== "true") scope.$ctrl.show(true);
			scope.$ctrl.controllerLoaded = true;
			if (scope.$ctrl.datasourceSetLater) {
				scope.$ctrl.datasourceSet(scope.$ctrl.datasourceSetLater);
				scope.$ctrl.datasourceSetLater = undefined;
			}
			scope.$ctrl.debug.log("controller loaded");

			scope.$on("$destroy", scope.$ctrl.$layout.destroy);
			$element.on("$destroy", function () {
				scope.$ctrl.debug.log("destroy table");
				dropdownsStack.closePopupsFor($element);
				if (scope.$ctrl) {
					if (!scope.$ctrl.$destroying) scope.$ctrl.$destroy();
					delete scope.$ctrl;
				}

				scope.$destroy();
				scope = null;
				self = null;
				//console.log("ax-dt element destroy");
			});

			controller = null;
			template = null;
		});

	}

	module.component('axTableContent', {
		bindings: {
			template: "&",
		},
		controllerAs: "contentCtrl",
		controller: ["$scope", "$element", "$attrs", "$compile", "$timeout", function (scope, element, attrs, $compile, $timeout) {
			let contentScope;
			let $controller = scope.$parent.$ctrl;
			$controller.content = {
				scope: scope,
				element: element,
				compile: function (html, $controller) {
					if ($controller.content.contentScope) {
						delete $controller.content.contentScope.$ctrl;
						$controller.content.contentScope.$destroy();
					}
					//console.log("ax-dt-content compiled");
					element.html(html);
					let contentScope = scope.$new();
					contentScope.$ctrl = $controller;
					//console.log("content scope", contentScope);
					$compile(element.contents())(contentScope);
					$controller.content.contentScope = contentScope;
				}
			};
			scope.$watch(function () {
				return $controller.content.contentScope ? false : attrs.template;
			}, function () {
				if (!attrs.template || $controller.content.contentScope) return;
				$controller.content.compile(scope.$parent.$eval(attrs.template), $controller);
			});
			element.on("$destroy", function () {
				if (scope.$$destroyed) return;
				$controller.debug.log("detroy table content");
				$controller = null;
				scope.$destroy();
				scope = null;
			});
			return;
		}]
	});

	module.component('axEditorContent', {
		bindings: {
			template: "&",
		},
		controllerAs: "editorContentCtrl",
		controller: ["$scope", "$element", "$attrs", "$compile", function (scope, element, attrs, $compile) {
			let $editor = scope.$parent.grid.$$editor;
			// console.log("ax-editor-content controller", scope.$parent);
			$editor.content = {
				scope: scope,
				element: element,
				compile: function (html, $controller) {
					if ($controller.content.contentScope) {
						delete $controller.content.contentScope.$ctrl;
						$controller.content.contentScope.$destroy();
					}
					 // console.log("ax-editor-content compiled");
					element.html(html);
					let contentScope = scope.$parent.$new();
					//console.log("content scope", contentScope);
					$compile(element.contents())(contentScope);
					$controller.content.contentScope = contentScope;
				}
			};
			scope.$watch(function () {
				return scope.$parent.$eval(attrs.template);
			}, function (value) {
				if (!value || !attrs.template || $editor.content.contentScope) return;
				$editor.content.compile(scope.$parent.$eval(attrs.template), $editor);
			});
			return;
		}]
	});
	module.component('axTableBody', {
		bindings: {
			template: "&",
		},
		controllerAs: "bodyCtrl",
		controller: ["$scope", "$element", "$attrs", "$compile", "$timeout", function (scope, element, attrs, $compile, $timeout) {
			let bodyScope;
			let $controller = scope.$parent.$ctrl;
			$controller.body = {
				scope: scope,
				element: element,
				compile: function (html) {
					if ($controller.body.bodyScope) $controller.body.bodyScope.$destroy();
					//console.log("ax-dt-body compiled");
					element.html(html);
					let bodyScope = scope.$new();
					bodyScope.$ctrl = $controller;
					$controller.$compile(element.contents())(bodyScope);
					$controller.body.bodyScope = bodyScope;
				}
			};
			scope.$watch(function () {
				return $controller.body.bodyScope ? false : attrs.template;
			}, function () {
				if (!attrs.template || $controller.body.bodyScope) return;
				$controller.body.compile(scope.$parent.$eval(attrs.template));
			});
			return;
		}]
	});


}());