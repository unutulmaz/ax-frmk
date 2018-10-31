(function (window, angular) {
	angular.module('ax.components').component('axISpinner',
		{
			bindings: {
				config: '=?', action: '&'
			},
			template: template,
			controller: controller
		});
	template.$inject = ["$element", "$attrs"];
	controller.$inject = ["$scope", "$element", "$attrs", "$timeout", "$compile", "$parse"];

	function template($element, $attrs) {
		var attributes = $element[0].attributes;
		var i1 = createElement('i', attributes);
		i1.removeAttribute('config');
		i1.removeAttribute('spinner-class');
		i1.removeAttribute('action');
		if (!i1.hasAttribute('i-class') && !i1.hasAttribute('i-ng-class')) throw "You need to setup  i-class attribute or i-ng-class";
		if (!i1.hasAttribute('i-height')) throw "You need to setup an i-height attribute in pixels";
		if (i1.hasAttribute('i-class')) {
			i1.setAttribute('class', i1.getAttribute('i-class'));
			i1.removeAttribute('i-class');
		}
		if (i1.hasAttribute('i-ng-class')) {
			i1.setAttribute('ng-class', i1.getAttribute('i-ng-class'));
			i1.removeAttribute('i-ng-class');
		}
		// i1.style.cssText = "width: " + $attrs.iHeight + "px !important;height:" + $attrs.iHeight + "px !important;line-height:" + $attrs.iHeight + "px !important";
		i1.removeAttribute('i-height');

		var i2 = createElement('i', i1.attributes);

		i2.removeAttribute('ng-class');
		var spinnerClass = $attrs.spinnerClass || "fa fa-spinner fa-pulse fa-fw";
		i2.setAttribute('class', spinnerClass);
		$attrs.template = { normal: i1, working: i2 };
		var template = i1.outerHTML;
		return template;
	}

	function controller(scope, element, attrs, $timeout, $compile, $parse) {
		if (attrs.config && !scope.$parent.$eval(attrs.config))
			this.config = $parse(attrs.config).assign(scope.$parent, {});
		else this.config = scope.$parent.$eval(attrs.config);
		this.parent = function () {
			return scope.$parent;
		};
		var controller = this;
		controller.config.do = function (callback) {
			if (controller.config.working) return;
			if (callback && callback.stopPropagation) callback.stopPropagation();
			controller.config.working = true;
			element.html(attrs.template.working);
			var removeSpinner = function () {
				$timeout(function () {
					element.html(attrs.template.normal);
					$compile(element)(scope.$parent);
					controller.config.working = false;
					if (angular.isFunction(callback)) callback();
				});
			};
			$timeout(function () {
				try {
					controller.action({ removeSpinner: removeSpinner });
				} catch (exception) {
					console.error(exception);
				}
				if (attrs.hasCallback !== "true") removeSpinner();
			}, 100);
		};
	}
})(window, angular);

