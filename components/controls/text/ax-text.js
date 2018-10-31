(function (window, angular) {
	var module = angular.module('ax.components');
	module.component('axText',
		{
			bindings: {
				ngModel: "=",
				ngChange: "&",
				ngDisabled: "&",
				ngReadonly: "&",
			},
			template: template,
			controller: controller
		});
	template.$inject = ["$element", "$attrs"];

	function template($element, $attrs) {
		var attributes = $element[0].attributes;
		if (!$element[0].hasAttribute("tabindex")) $element.attr("tabindex", "0");
		var template = "";

		var container = createElement("div", { style: "position:relative;width:100%;height:100%;display:inline-flex;vertical-align:top" });
		let element = createElement('input', {
			type: 'text',
			tabindex: $element.attr("tabindex"),
			"ng-model": "$parent." + $attrs.ngModel,

			"has-input": "true"
		});
		if ($attrs.ngModelOptions) element.setAttribute("ng-model-options", $attrs.ngModelOptions);
		if ($attrs.type) element.setAttribute("type", $attrs.type);
		if ($attrs.ngReadonly) element.setAttribute("ng-readonly", "$ctrl.ngReadonly()");
		if ($attrs.ngDisabled) element.setAttribute("ng-disabled", "$ctrl.ngDisabled()");
		if ($attrs.ngChange) element.setAttribute("ng-change", "$ctrl.ngChange()");
		if ($attrs.autocomplete) element.setAttribute("autocomplete", $attrs.autocomplete);
		if ($attrs.name) element.setAttribute("name", $attrs.name);
		$element[0].removeAttribute("ng-model");
		$element[0].removeAttribute("ng-model-options");

		template = element.outerHTML;
		let printableElement = createElement('div', {
			class: 'printable',
			style: element.style.cssText,
			ngBind: "$parent." + $attrs.ngModel,
		});
		template += printableElement.outerHTML;
		var eraserClass = $attrs.eraserClass ? $attrs.eraserClass : "fa fa-eraser";
		if (eraserClass !== "false" && ["number"].indexOf($attrs.type) === -1) {
			element = createElement('button', {
				class: "btn icon text-clear-btn " + eraserClass,
				tabindex:"-1",
				"ng-click": "$ctrl.clearValue($event)",
				style: "height:100%;line-height:inherit"
			});
			template += element.outerHTML;
		}
		container.innerHTML = template;
		template = container.outerHTML;
		$element.removeAttr("ng-blur");
		return template;
	}

	controller.$inject = ["$scope", "$element", "$attrs", "$timeout"];

	function controller(scope, element, attrs, $timeout) {
		var inputElement = element.find(">div>input");
		var self = this;
		element.focus(function () {
			// console.log("focus ax-text");
			inputElement.focus();
		});
		let blurHandle = function ($event) {
			if ($event.relatedTarget && $($event.relatedTarget).closest("ax-text").length && $($event.relatedTarget).closest("ax-text")[0] === element[0]) return;
			// console.log("blurHandle", $event.target);
			angular.element(this).closest("ax-text").removeClass("hasFocus");
			scope.$parent.$event = $event;
			if (self.modelChanged && attrs.saveData) {
				if (scope.$parent.$eval(attrs.saveData)) self.modelChanged = false;
			}
			if (attrs.axBlur) scope.$parent.$eval(attrs.axBlur);
		};
		element.find(">div [tabindex]")
			.focus(function ($event) {
				// console.log("focus input", $event.target);
				angular.element(this).closest("ax-text").addClass("hasFocus");
				scope.$parent.$event = $event;
				$event.stopPropagation();
			})
			.blur(blurHandle);
		var loading = true;
		scope.$watch("$ctrl.ngModel", function (value) {
			// console.log("ngModel ", attrs.ngModel, value);
			self.modelChanged = true;
			if (attrs.eraserClass !== "false") {
				if (value === undefined || value === null || value === "") element.find(".text-clear-btn").addClass("ng-hide");
				else element.find(".text-clear-btn").removeClass("ng-hide");
			}
		});
		scope.$ctrl.clearValue = function ($event) {
			if (element.attr("readonly") === "readonly" || element.attr("readonly") === "true" || element.attr("readonly") === "") return;
			if (element.attr("disabled") === "disabled" || element.attr("disabled") === "true" || element.attr("disabled") === "") return;
			$event.stopPropagation();
			scope.$ctrl.ngModel = undefined;
			inputElement.val(undefined);

			$timeout(function () {
				scope.$parent.$event = $event;
				if (attrs.ngChange) scope.$ctrl.ngChange();
				if (attrs.saveData) scope.$parent.$eval(attrs.saveData);
				if (attrs.axBlur) scope.$parent.$eval(attrs.axBlur);
			});
			inputElement.focus();
		};
	}
})(window, angular);