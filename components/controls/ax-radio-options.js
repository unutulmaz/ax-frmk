(function (window, angular) {
	var module = angular.module('ax.components');
	module.component('axRadioOptions',
		{
			bindings: {
				ngModel: "=",
				options: "=?",
				disabledOptions: "=?",
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
		var template;
		if ($element.html().trim() === "") {
			var unchecked = $attrs.uncheckedClass || "fa-circle-o";
			var baseClass = unchecked.split("-")[0];
			var i = createElement("i", { class: baseClass + " " + unchecked });
			var span = createElement("span", { "ng-bind": "option" });
			var options = createElement("ax-radio-option", {
				"ng-repeat": "option in $ctrl.options track by option",
				"ng-attr-tabindex": "{{::($ctrl.tabIndex + $index)}}"
			}, i.outerHTML + span.outerHTML);
			if ($element[0].getAttribute("has-input") !== "false") options.setAttribute("has-input", "true");
			$element[0].removeAttribute("has-input");
			template = options.outerHTML;
		} else template = $element.html();

		return template;
	}

	function controller(scope, element, attrs, $timeout, $compile) {
		var classes = {
			checked: attrs.checkedClass || "fa-check-circle-o",
			unchecked: attrs.uncheckedClass || "fa-circle-o"
		};
		classes.baseClass = classes.checked.split("-")[0];
		element.find("i.checkbox-i").addClass(classes.baseClass);
		scope.$ctrl.tabIndex = parseInt(attrs.tabindex) || 0;
		var loading = true;
		let blurHandle = function ($event) {
			//console.log("ngBlur ?", self.ngModel, stopFireBlur, scope.$parent.$parent.$parent.dataItem);
			if (stopFireBlur) return;
			element.removeClass("hasFocus");
			scope.$parent.$event = $event;
			if (self.modelChanged && attrs.saveData) {
				//console.log("saveData executed", self.ngModel, attrs.saveData, scope.$parent.$parent.$parent.dataItem);
				if (scope.$parent.$eval(attrs.saveData)) self.modelChanged = false;
			}
			if (attrs.ngBlur) scope.$parent.$eval(attrs.ngBlur);
		};
		element.find(">div [tabindex]")
			.focus(function ($event) {
				element.addClass("hasFocus");
				scope.$parent.$event = $event;
				//if (attrs.ngFocus) scope.$parent.$eval(attrs.ngFocus);
				$event.stopPropagation();
			})
			.blur(blurHandle);
		//!!!!!!!!!!!!!!!!!!!de pus watch/observer pe options !!!!!!!!!!!!!!!!!!!!!!!
		$timeout(function () {
			scope.$watch("$ctrl.ngModel", function () {
				//console.log("--------ngModel changed", scope.$ctrl.ngModel);
				if (element[0].hasAttribute("ng-change")) scope.$ctrl.ngChange();
				if (scope.$ctrl.ngModel === undefined || scope.$ctrl.ngModel === null ) return;
				element.find(">ax-radio-option").each(function (i, item) {
					var optionText = angular.element(item).text();
					//console.log("--------ngModel changed", scope.$ctrl.ngModel, optionText);
					if (scope.$ctrl.ngModel.toString() === optionText) changeValue(item, true);
				});
			});
		});
		var selectOption = function (target, noApply) {
			var option = angular.element(target).closest("ax-radio-option");
			if (!loading && !noApply) {
				//console.log("select option", loading, noApply);
				if (element[0].hasAttribute("readonly") || element[0].hasAttribute("disabled")) return false;
				if (option[0].hasAttribute("readonly") || option[0].hasAttribute("disabled")) return false;
			}
			loading = false;
			if (option.hasClass(classes.checked)) return false;
			element.find(">ax-radio-option>i." + classes.checked).removeClass(classes.checked).addClass(classes.unchecked);
			option.find("i." + classes.unchecked).removeClass(classes.unchecked).addClass(classes.checked);
			return true;
		};
		var changeValue = function (target, noApply) {
			//console.log("change Value", target, noApply);
			if (selectOption(target,noApply)) {
				var optionText = angular.element(target).closest("ax-radio-option").text();
				scope.$ctrl.ngModel = optionText;
				if (noApply) return;
				scope.$apply();
			}
		};
		/**
		 * @param {MouseEvent} event
		 */
		var clickEventHandler = function (event) {
			changeValue(angular.element(event.target).closest("ax-radio-option"));
		};

		/**
		 * @param {KeyboardEvent} event
		 */
		var keydownEventHandler = function (event) {
			if (event.altKey || event.ctrlKey) return;
			if (event.keyCode === keyCodes.Return || event.keyCode === keyCodes.Spacebar) {
				changeValue(angular.element(event.target).closest("ax-radio-option"));
				event.stopPropagation();
			}
		};
		axUtils.addEventListener(element[0], "keydown", keydownEventHandler);
		axUtils.addEventListener(element[0], "click", clickEventHandler);

	}
})(window, angular);