(function (window, angular) {
	var module = angular.module('ax.components');
	module.component('axCheckbox',
		{
			bindings: {
				ngModel: "=",
				ngChange: "&"
			},
			template: template,
			controller: controller
		});
	template.$inject = ["$element", "$attrs"];
	controller.$inject = ["$scope", "$element", "$attrs", "$timeout", "$compile"];

	function template($element, $attrs) {
		var attributes = $element[0].attributes;
		if (!$element[0].hasAttribute("tabindex")) $element.attr("tabindex", "0");
		var i = createElement('i', {class: "checkbox-i"});
		var elementHtml = $element.html().trim();
		if (elementHtml !== "") i.addCssText("margin-right:0px;");
		else {
			$element.addClass("no-template");
		}
		var elementInner = createElement("div", {}, elementHtml);
		var template = i.outerHTML + (elementHtml ? elementInner.outerHTML : "");
		return template;
	}

	function controller(scope, element, attrs, $timeout, $compile) {
		var classes = {
			checked: attrs.checkedClass || "fa-check-square-o",
			unchecked: attrs.uncheckedClass || "fa-square-o"
		};
		classes.baseClass = classes.checked.split("-")[0];
		element.find("i.checkbox-i").addClass(classes.baseClass);

		scope.$watch("$ctrl.ngModel", function () {
			if (scope.$ctrl.ngModel) element.find("i.checkbox-i").removeClass(classes.unchecked).addClass(classes.checked);
			else element.find("i.checkbox-i").addClass(classes.unchecked).removeClass(classes.checked);
			if (element[0].hasAttribute("ng-change")) scope.$ctrl.ngChange();
		});
		var changeValue = function () {
			scope.$ctrl.ngModel = !scope.$ctrl.ngModel;
			scope.$apply();
			if (attrs.saveData) scope.$parent.$eval(attrs.saveData);

		};
		/**
		 * @param {MouseEvent} event
		 */
		var clickEventHandler = function (event) {
			if (element[0].hasAttribute("readonly") || element[0].hasAttribute("disabled")) return;
			changeValue();
		};
		axUtils.addEventListener(element[0], "click", clickEventHandler);
		/**
		 * @param {KeyboardEvent} event
		 */
		var keydownEventHandler = function (event) {
			if (element[0].hasAttribute("readonly") || element[0].hasAttribute("disabled")) return;
			if (event.altKey || event.ctrlKey) return;
			if (event.keyCode === keyCodes.Return || event.keyCode === keyCodes.Spacebar) {
				changeValue();
				event.stopPropagation();
				event.preventDefault();
			}
		};
		axUtils.addEventListener(element[0], "keydown", keydownEventHandler, false);
	}
})(window, angular);