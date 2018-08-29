(function () {
	var module = angular.module('ax.components');
	var bindings = {
		config: '=?',
		datasource: '=',
		readOnly: "=?"
	};

	module.component('axForm', {
		bindings: bindings,
		template: controlTemplate,
		controller: controlController
	});
	var attrs = {
		"config": "",
		"controller": "",
		"controller-as": "",
		"trap-focus": "false",
		"read-only": "Expression which evaluate if form is readonly or not",
		"datasource": "Object which hold form data",
		"api": "axApi component, alternate can be injected from axTable",
		"api-controller": "Name for api-controller",
		"item-id-field": "Name of id field in Db",
		"metadata-id": "If the backend provide metadata for models this is id for storing metadata in client-side. Usual can be api-controller name, if it's used"
	};
	controlTemplate.$inject = ["$element", "$attrs"];
	function controlTemplate($element, $attrs) {
		$attrs.initialHtml = $element[0].outerHTML;
		if (!$element[0].hasAttribute("read-only")) $element[0].setAttribute("read-only", $attrs.config + ".readOnly");
		var template = new axFormTemplate($element[0]);
		$attrs.fieldsWithErrorMsg = template.fieldsWithErrorMsg;
		$attrs.template = template.html;
		$attrs.attributes = template.attributes;
		return $attrs.template;
	}
	controlController.$inject = ["$element", "$scope", "$attrs", "axApi", "$timeout", "notify", "$controller", "$injector", "axDataStore", "$parse"];
	function controlController($element, scope, attrs, $axApi, $timeout, $notify, $controller, $injector, dataStore, $parse) {
		if (attrs.controller &&
			(angular.isString(attrs.controller) ||
				angular.isArray(attrs.controller) ||
				angular.isFunction(attrs.controller))) {

			var label;

			if (attrs.controllerAs && angular.isString(attrs.controllerAs)) {
				label = attrs.controllerAs;
			}
			var locals = {};
			var controllerInstance = $controller(attrs.controller,
				angular.extend(
					locals,
					{
						$scope: scope,
						$element: $element
					}),
				true,
				label
			);

			if (attrs.bindToController) {
				angular.extend(controllerInstance.instance,
					{});
			}
			$element.data('axFormControllerController', controllerInstance());
		}
		if (attrs.config) {
			var ctrlScope = attrs.controller ? scope.$ctrl.config : scope.$parent.$eval(attrs.config) ;
			if (!ctrlScope) {
				scope.$ctrl.config = attrs.controller ? {} : $parse(attrs.config).assign(scope.$parent, {});
				this.config = scope.$ctrl.config;
			}
		}
		this.$parent = scope.$parent;
		this.element = {
			$source: $element,
			source: $element[0],
			initialHtml: attrs.initialHtml,
			template: attrs.template,
			attrs: attrs,
			scope: scope.$parent
		};
		scope.$ctrl.$notify = $notify;
		scope.$ctrl.$timeout = function (fn, timeout) {
			return $timeout(function () {
				if (!scope || scope.$ctrl.destroying) return;
				fn.call(scope.$ctrl);
			}, timeout || 0);
		};
		scope.$ctrl.fieldsWithErrorMsg = attrs.fieldsWithErrorMsg;
		scope.$ctrl.attributes = attrs.attributes;
		if (attrs.api) {
			scope.$ctrl.$api = $injector.get(attrs.api);
		}
		else if (attrs.apiController) {
			if (!attrs.itemIdField) console.error("When you set an api-controller you need to setup an item-id-field!");
			var config = {
				controller: attrs.apiController.replace('api/', ''),
				idField: attrs.itemIdField
			};
			scope.$ctrl.$api = new $axApi(config);
		}
		var controller = new axFormController(scope, dataStore);
		if (attrs.notifySuccess === "true") controller.notifySuccess = true;
		if (this.config) {
			this.config.$ctrl = controller;
			scope.$ctrl = extendPrototypeObject(scope.$ctrl, this.config.$ctrl);
			extendPrototypeObject(this, this.config.$ctrl);
			if (this.config.onInitDone)
				$timeout(function () {
					scope.$ctrl.config.onInitDone();
				});
			if (this.config.$api) scope.$ctrl.$api = this.config.$api;
		} else if (scope.config) {
			scope.$ctrl.config = scope.config;
			if (scope.config.onInitDone)
				$timeout(function () {
					scope.config.onInitDone();
				});
		}
		if (attrs.trapFocus === "true") {
			$timeout(function () {
				controller.trapFocus = new axTrapFocus($element, scope);
				if (controller.config && controller.config.keyboardHandle) controller.trapFocus.keyboardHandleCallback = function (event) {
					controller.config.keyboardHandle(event);
				};
				controller.trapFocus.autoFocus();
			});
		}
	}
}());

