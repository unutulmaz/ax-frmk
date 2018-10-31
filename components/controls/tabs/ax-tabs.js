(function () {
	var module = angular.module('ax.components');
	var bindings = {
		config: '=?',
		tabsTitles: '=',
		tabsDisabled: "&"
	};

	module.component('axTabs', {
		bindings: bindings,
		template: controlTemplate,
		controllerAs: "$tabsCtrl",
		controller: controlController
	});
	controlTemplate.$inject = ["$element", "$attrs"];

	function controlTemplate($element, $attrs) {
		$attrs.initialHtml = $element[0].outerHTML;
		var header, template;
		if (applicationInfo.theme.baseOn === "bootstrap4") header = createElement("ul", {class: "tabs-header nav nav-tabs"});
		else header = createElement("div", {class: "tabs-header nav nav-tabs"});
		if (applicationInfo.theme.baseOn === "bootstrap4") {
			template = createElement("li", {
				class: "tab nav-item",
				"ng-repeat": "title in $tabsCtrl.tabsTitles",
				"ng-attr-tab-title": "{{::title}}",

				"ng-disabled": "$tabsCtrl.tabsDisabled({title:title})"
			}, createElement("a", {class:"nav-link", href:"#", "ng-bind": "::title"}), header);
		} else
			template = createElement("button", {
				class: "tab nav-item",
				"ng-repeat": "title in $tabsCtrl.tabsTitles",
				"ng-attr-tab-title": "{{::title}}",
				"ng-bind": "::title",
				"ng-disabled": "$tabsCtrl.tabsDisabled({title:title})"
			}, "", header);


		var tabsViews = $element.find(">ax-tab-view[tab-title]");
		if (tabsViews.length === 0) console.error("No ax-tab-view element with tab-title attribute found in ax-tabs control!");
		$attrs.template = header.outerHTML;
		tabsViews.each(function (index, view) {
			angular.element(view).addClass("tab-view");
			$attrs.template += view.outerHTML;
		});
		$attrs.attributes = template.attributes;
		return $attrs.template;
	}

	controlController.$inject = ["$element", "$scope", "$attrs", "$timeout"];

	function controlController(element, scope, attrs, $timeout) {
		var initialSelect = false;
		var activateTab = function (target) {
			var button = angular.element(target).closest(".tab[tab-title]");
			if (button.length === 0) return;
			if (button[0].hasAttribute("disabled")) return;
			angular.element(target).closest(".tabs-header").find(".tab.active, .tab>.active").removeClass("active");
			angular.element(target).closest("ax-tabs").find(">ax-tab-view.active").removeClass("active");
			var tabTitle = button.attr("tab-title");
			if (applicationInfo.theme.baseOn === "bootstrap4") button.find(">a").addClass("active");
			else button.addClass("active");
			var tabView = angular.element(target).closest("ax-tabs").find(">ax-tab-view[tab-title='" + tabTitle + "']");
			tabView.addClass("active");
			if (!initialSelect) {
				$timeout(function () {
					var controls = tabView.find(focusableElements);
					if (controls.length > 0) controls[0].focus();
				});
			} else initialSelect = false;
		};
		var tabsHeader = element.find(">.tabs-header");
		/**
		 * @param {MouseEvent} event
		 */
		var clickEventHandler = function (event) {
			event.preventDefault();
			activateTab(event.target);
		};
		axUtils.addEventListener(tabsHeader[0], "click", clickEventHandler, false);
		/**
		 * @param {KeyboardEvent} event
		 */
		var keydownEventHandler = function (event) {
			if (event.altKey || event.ctrlKey) return;
			if (event.keyCode === keyCodes.Return || event.keyCode === keyCodes.Spacebar) {
				event.stopPropagation();
				activateTab(event.target);
			}
		};
		axUtils.addEventListener(tabsHeader[0], "keydown", keydownEventHandler);
		if (attrs.initialSelect) $timeout(function () {
			initialSelect = true;
			var tabTitle = scope.$parent.$eval(attrs.initialSelect);
			var tabButton = element.find(".tab[tab-title='" + tabTitle + "']");
			if (tabButton.length > 0) activateTab(tabButton[0]);
		});
		var axForm = element.closest("ax-form >*");
		if (axForm.length > 0) {
			scope.$ctrl = axForm.scope().$ctrl;
		}
	}
}());

