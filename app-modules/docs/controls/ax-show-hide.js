(function () {
	var module = angular.module('ax.components');
	var bindings = {};

	module.component('axShowHide', {
		bindings: bindings,
		template: controlTemplate,
		controller: controlController
	});
	controlTemplate.$inject = ["$element", "$attrs"];
	function controlTemplate($element, $attrs) {
		$attrs.initialHtml = $element[0].outerHTML;
		var template = `<button class="ax-show-hide" ng-click="$ctrl.toggle()" ng-bind="$ctrl.text"></button>`;
		return template;
	}

	controlController.$inject = ["$element", "$scope", "$attrs", "$timeout"];
	function controlController(element, scope, attrs, $timeout) {
		scope.$ctrl.show = false;
		scope.$ctrl.text = "Show";
		scope.$ctrl.toggle = function (event) {
			scope.$ctrl.show = !scope.$ctrl.show;
			var object = angular.element("body").find("#" + attrs.elementId);
			scope.$ctrl.text = scope.$ctrl.show ? "Hide" : "Show";

			if (scope.$ctrl.show) { object.removeClass("ng-hide"); }
			else { object.addClass("ng-hide"); }
			$timeout(axUtils.triggerWindowResize);
		};
		angular.element("body").find("#" + attrs.elementId).addClass("ng-hide");
		$timeout(axUtils.triggerWindowResize);
	}
}());

