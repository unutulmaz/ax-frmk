(function () {
	var module = angular.module('ax.components');
	var bindings = {
		ngDisabled: '&',
		ngReadonly: '&',
		ngFocus: '&',
		ngBlur: '&',
		btnText: "&",
		onSelectionChange: "&",
		rowIsDisabled: "&",
		ctrl: '=?',
		datasource: "=",
		dropdownModel: '=?',
		dropdownModelType: "@"
	};
	module.component('axDropdownTable', {
		bindings: bindings,
		controllerAs: 'dropdown',
		template: ["$element", "$attrs", 'templateFactory',
			function axDropdownTableTemplate($element, $attrs, templateFactory) {
				$attrs.template = new axDropdownTable(null, $element, $attrs, templateFactory);
				return $attrs.template.toggleButton.template;
			}],
		controller: axDropdownTableController
	});
	axDropdownTableController.$inject = ["$element", "$scope", "$attrs", 'templateFactory', '$compile', '$timeout', '$document', 'axDataStore', "$filter", "uibDateParser"];

	function axDropdownTableController($element, $scope, $attrs, templateFactory, $compile, $timeout, $document, dataStore, $filter, dateParser) {
		$attrs.template = new axDropdownTable($attrs.template.popup.template, $element, $attrs, templateFactory, $compile, $timeout, $document, dataStore, $filter, dateParser);
		$element.find('.dropdown-toggle').attr('uid', $attrs.template.uid);
		if (!this.ctrl) this.ctrl = {};
		this.$attrs = $attrs;
		this.elementTag = $element[0].tagName.toLowerCase().replace('ax-dropdown-', '');
		$attrs.template = angular.extend(this, $attrs.template);
		$attrs.template.dateParser = dateParser;
		$attrs.template.post($scope, $attrs.$$element);
	}

	module.component('axDropdownList', {
		bindings: bindings,
		controllerAs: 'dropdown',
		template: ["$element", "$attrs", 'templateFactory',
			function axDropdownTableTemplate($element, $attrs, templateFactory) {
				$attrs.template = new axDropdownTable(null, $element, $attrs, templateFactory);
				if ($attrs.linkPopupTemplateUrl) {
					let popup = createElement("ax-dropdown-popup", {
						class: "link-popup",
						hasInput: true
					});
					for (let i = 0; i < $element[0].attributes.length; i++) {
						let attrName = $element[0].attributes[i].nodeName;
						if (!attrName.startsWith("link-popup")) continue;
						popup.setAttribute(attrName.replace("link-popup-", ""), $element[0].attributes[i].nodeValue);
					}
					$attrs.template.toggleButton.template += popup.outerHTML;
				}
				return $attrs.template.toggleButton.template;
			}],
		controller: axDropdownTableController
	});

}());

function axDropdownTable(popupTemplate, $element, $attrs, templateFactory, $compile, $timeout, $document, dataStore, $filter, dateParser) {
	var axDropdown = new axDropdownPopup(popupTemplate, $element, $attrs, templateFactory, $compile, $timeout, $document, dataStore, $filter, dateParser);
	var elementTag = $element[0].tagName.toLowerCase().replace('ax-dropdown-', '');
	if (!popupTemplate) {
		//if (!$element.attr('popup-max-width') && !$element.attr('popup-width')) $element.attr('popup-width', $element.attr(elementTag + '-width') || $element.css('width'));
		if (!$element.attr('popup-max-height') && !$element.attr('popup-height')) $element.attr('popup-height', $element.attr(elementTag + '-height'));
		$element.attr('popup-class', 'popup-table ' + $element.attr('popup-class'));
		$attrs.popupClass = $element.attr('popup-class');
		$attrs.$attr.popupClass = 'popup-class';
		if (!$attrs[elementTag + 'SelectableRows']) {
			$attrs[elementTag + 'SelectableRows'] = 'single';
			$attrs.$attr[elementTag + 'SelectableRows'] = elementTag + "-selectable-rows";
		}
		if ($attrs.dropdownModelType === 'id-field' && !$attrs[elementTag + 'ItemIdField']) {
			console.error("For dropdown-model-type=id-field, you must provide a " + elementTag + "-item-id-field attribute value");
			return;
		}
		var attrs = {
			config: "launcher.table"
		};
		for (let attr in $attrs) {
			if ($attrs.hasOwnProperty(attr)) {
				if (!attr.startsWith(elementTag)) continue;
				let attrOriginal = $attrs.$attr[attr];
				let axTableAttr = attrOriginal.replace(elementTag + '-', '');
				if (axTableAttr === 'datasource') attrs[axTableAttr] = "launcher.$parent." + $attrs[attr];
				else if (axTableAttr === 'item-id-field') attrs['item-id-field'] = $attrs[attr];
				else if (axTableAttr === 'item-display-field') attrs['item-display-field'] = $attrs[attr];
				else attrs[axTableAttr] = $attrs[attr];
			}
		}
		if ($element[0].children.length === 0 && !$element.attr(elementTag + '-item-id-field')) {
			if (!$element.attr(elementTag + '-item-display-field')) {
				console.error("No " + elementTag + "-item-display-field attribute or ax-column templates provided!");
				return;
			}
		}
		if (!$attrs.autoFocus && !$attrs[elementTag + "AutoFocus"]) attrs["auto-focus"] = "true";
		if ($attrs.datasource) attrs.datasource = '$parent.dropdown.datasource';
		//if ($attrs.onSelectionChange) attrs['on-selection-change'] = '$parent.dropdown.onSelectionChange()'; nu e necesar
		if ($attrs.dropdownModel) attrs['selectable-rows-model'] = '$parent.dropdown.dropdownModel';
		if ($attrs.dropdownModelType) attrs['selectable-rows-model-type'] = $attrs.dropdownModelType;
		if ($attrs.rowIsDisabled) attrs['row-is-disabled'] = '$parent.dropdown.rowIsDisabled({dataItem:dataItem})';
		var axDatatable = createElement("ax-" + elementTag, attrs, $element.html());
		axDatatable.style.position = "relative";
		axDatatable.style.height = $element.attr(elementTag + '-height') || '200px';
		axDatatable.style.border = 'none';
		var width = $attrs.listWidth || $element.attr('popup-width') || $element.attr('width') || $element[0].style.width;
		if (width) axDatatable.style.width = width;

		if (attrs["selectable-rows"] === "multiple" && !$attrs.closeOnMouseleave) axDatatable.setAttribute("ng-mouseleave", "launcher.close()");
		$element.html(axDatatable.outerHTML);
	} else {
		if (!$element[0].hasAttribute('close-on-blur')) $attrs.closeOnBlur = 'true';
	}
	if (!$attrs.templateUrl) {
		axDropdown.popup.template = popupTemplate || $element.html();
	}
	axDropdown.template.toggleButton();
	$element[0].removeAttribute("has-input");
	return axDropdown;
}
