(function (window, angular) {
	var module = angular.module('ax.components');
	module.component('axDatetime',
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
	controller.$inject = ["$scope", "$element", "$attrs", "$timeout"];

	function template($element, $attrs) {
		if (!$element[0].hasAttribute("tabindex")) $element.attr("tabindex", "0");
		var template = "", element;
		if (axUtils.navigator.isChrome1 || axUtils.navigator.isOpera1) {
			element = createElement('input', {
				"ng-model": "$ctrl.ngModel",
				"has-input": "true",
				type: 'date'
			});
			if ($attrs.ngChange) element.setAttribute("ng-change", "$ctrl.ngChange()");
			if ($attrs.ngDisabled) element.setAttribute("ng-disabled", "$ctrl.ngDisabled()");
			element.setAttribute("string-to-date", "");
			template = element.outerHTML;
		} else {
			var format = $attrs.type === "date" ? ($attrs.dateFormat ? $attrs.dateFormat : axDateFormat) : ($attrs.datetimeFormat ? $attrs.datetimeFormat : axDateTimeFormat);
			var container = createElement("div", {style: "position:relative;width:100%;display:inline-flex;vertical-align:top"});
			let tabIndex = parseInt($element.attr("tabindex"));
			element = createElement('input', {
				type: 'text',
				tabindex: tabIndex,
				"ng-model": "$parent." + $attrs.ngModel,
				"has-input": "true",
				"uib-datepicker-popup": format,
				"alt-input-formats": "['YYYY-MM-DD', 'YYYY-MM-DD hh:mm:ss']",
				"is-open": "$ctrl.popupOpened",
				"placeholder": format.toLowerCase()
			});

			if ($attrs.ngChange) element.setAttribute("ng-change", "$ctrl.ngChange()");
			if ($attrs.ngReadonly) element.setAttribute("ng-readonly", "$ctrl.ngReadonly()");
			if ($attrs.ngDisabled) element.setAttribute("ng-disabled", "$ctrl.ngDisabled()");
			$element[0].removeAttribute("ng-model");

			template = element.outerHTML;

			let printableElement = createElement('div', {
				class: 'printable',
				style: element.style.cssText
			}, "{{$parent." + $attrs.ngModel + "|date:'" + format + "'}}");
			template += printableElement.outerHTML;

			element = createElement('button', {
				class: "btn icon fa fa-eraser date-clear-btn",
				"ng-click": "$ctrl.clearValue($event)",
				"tabindex": -1
			});
			template += element.outerHTML;
			element = createElement('button', {
				class: "btn icon glyphicon glyphicon-calendar date-open-popup",
				"has-input": "true",
				tabindex: tabIndex + 1,
				"ng-click": "$ctrl.openPopup($event)",
				style: "padding:0 2px"
			});
			template += element.outerHTML;
			container.innerHTML = template;
			template = container.outerHTML;
		}
		return template;
	}

	function controller(scope, element, attrs, $timeout) {
		var inputElement = element.find(">div>input");
		var loading = true, self = this;
		self.modelChanged = false;
		element.focus(function () {
			inputElement.focus();
		});
		let blurHandle = function ($event) {
			if ($event.relatedTarget && $($event.relatedTarget).closest("ax-datetime").length && $($event.relatedTarget).closest("ax-datetime")[0] === element[0]) return;
			if (scope.$ctrl.popupOpened) return;
			angular.element(this).closest("ax-datetime").removeClass("hasFocus");
			this.hasFocus = false;
			if (!self.modelChanged ) return;
			if (self.modelChanged && attrs.saveData) (scope.$parent.$eval(attrs.saveData));
			scope.$parent.$event = $event;//e nevoie pt. $eval
			if (attrs.ngBlur) scope.$parent.$eval(attrs.ngBlur);
			if (attrs.ngChange) scope.$ctrl.ngChange();
			self.modelChanged = false;
		};
		inputElement.blur(blurHandle);

		element.find(">div [tabindex]")
			.focus(function ($event) {
				this.hasFocus = true;
				angular.element(this).closest("ax-datetime").addClass("hasFocus");
				scope.$parent.$event = $event;
				//if (attrs.ngFocus) scope.$parent.$eval(attrs.ngFocus);
				$event.stopPropagation();
			})
			.blur(blurHandle);
		scope.$on("$destroy", function (event) {
			if (element.hasClass("hasFocus")) blurHandle(event);
		});
		scope.$ctrl.popupOpened = null;
		scope.$ctrl.openPopup = function ($event) {
			$event.stopPropagation();
			if (element.attr("readonly") === "readonly" || element.attr("readonly") === "true" || element.attr("readonly") === "") return;
			if (element.attr("disabled") === "disabled" || element.attr("disabled") === "true" || element.attr("disabled") === "") return;
			scope.$ctrl.popupOpened = !scope.$ctrl.popupOpened;
		};
		scope.$ctrl.clearValue = function ($event) {
			if (element.attr("readonly") === "readonly" || element.attr("readonly") === "true" || element.attr("readonly") === "") return;
			if (element.attr("disabled") === "disabled" || element.attr("disabled") === "true" || element.attr("disabled") === "") return;

			$event.stopPropagation();
			scope.$ctrl.ngModel = undefined;
			$timeout(function () {
				scope.$parent.$event = $event;
				if (attrs.ngChange) scope.$ctrl.ngChange();
				if (attrs.saveData) scope.$parent.$eval(attrs.saveData);
				if (attrs.ngBlur) scope.$parent.$eval(attrs.ngBlur);
			});
			inputElement.val(null);
		};
		scope.$watch("$ctrl.popupOpened", function (opened) {
			if (opened === null) return;
			if (!scope.$ctrl.popupOpened) {
				element.focus();
				if (attrs.ngBlur) scope.$parent.$eval(attrs.ngBlur);
				if (attrs.ngChange) scope.$ctrl.ngChange();
				if (attrs.saveData) scope.$parent.$eval(attrs.saveData);
			}

		});
		scope.$watch("$ctrl.ngModel", function (ngModel) {
			inputElement.removeClass("ng-valid-date").removeClass("ng-invalid-date1");
			$timeout(function () {
				self.modelChanged = true;
				// console.log("ngModel  changed", ngModel);
				inputElement.removeClass("ng-valid-date").removeClass("ng-invalid-date1");
				if (ngModel === undefined && (inputElement.val() !== null || inputElement.val() !== "")) inputElement.addClass("ng-invalid-date1");
				if (ngModel !== undefined) inputElement.addClass("ng-valid-date");
				if (ngModel === undefined || ngModel === null) element.find(".date-clear-btn").addClass("ng-hide");
				else element.find(".date-clear-btn").removeClass("ng-hide");
				if (attrs.ngChange) scope.$ctrl.ngChange();
				// console.log("ngModel changed end", ngModel);
			});
		});
	}
})(window, angular);