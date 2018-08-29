(function () {
	var module = angular.module('ax.components');
	var bindings = {};

	module.component('axSeeAlso', {
		bindings: bindings,
		template: controlTemplate,
		controller: controlController
	});
	controlTemplate.$inject = ["$element", "$attrs"];

	function controlTemplate($element, $attrs) {
		$attrs.initialHtml = $element[0].outerHTML;
		$element[0].style.cssText ="position: absolute;right:30px;height:100%;display:inline-flex;" + $element[0].style.cssText ;
		var element = createElement("ax-dropdown-popup", {
			style: "width:auto;font-weight: normal;margin:auto",
			"btn-class": "text no-border",
			btnStyle: "padding:0 10px",
			"caret-class": "fa",
			"popup-class": "see-also menu",
			"popup-absolute-right": "30px",
			"btn-text": $attrs.btnText
		});
		// element.addCssText($element[0].style.cssText);
		element.setAttribute("popup-absolute-right", element.style.right);
		$element.find("ax-see-also-option").each(function (index, option) {
			let a = createElement("a", {"ng-click": "popupClose()"}, option.innerHTML);
			if (option.hasAttribute("url")) {
				a.setAttribute("ng-href", option.getAttribute("url"));
				if (option.hasAttribute("target")) a.setAttribute("target", option.getAttribute("target"));
				else a.setAttribute("target", "_blank");
			} else if (option.hasAttribute("route")) a.setAttribute("ui-sref", option.getAttribute("route"));
			element.appendChild(a);
		});
		return element;
	}

	controlController.$inject = ["$element", "$scope", "$attrs"];

	function controlController(element, scope, attrs) {
	}
}());

