(function (window, angular) {
	var module = angular.module('ax.components');
	module.component('axAutocomplete',
		{
			bindings: {
				ngModel: "=",
				datasource: "=",
				datasourceFilter: "&",
				datasourceFilterParam: "=",
				onModelChanged: "&",
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

		var container = createElement("div", {style: "position:relative;width:100%;height:100%;display:inline-flex;vertical-align:top"});
		let tabIndex = parseInt($element.attr("tabindex"));
		let element = createElement('input', {
			type: 'text',
			tabindex: tabIndex,
			"ng-model": "$ctrl.displayValue",
			"has-input": "true"
		});
		if ($attrs.ngModelOptions) element.setAttribute("ng-model-options", $attrs.ngModelOptions);
		if ($attrs.type) element.setAttribute("type", $attrs.type);
		if ($attrs.ngReadonly) element.setAttribute("ng-readonly", "$ctrl.ngReadonly()");
		if ($attrs.ngDisabled) element.setAttribute("ng-disabled", "$ctrl.ngDisabled()");
		if ($attrs.ngChange) element.setAttribute("ng-change", "$ctrl.ngChange()");
		$element[0].removeAttribute("ng-model");
		$element[0].removeAttribute("ng-model-options");

		template = element.outerHTML;


		let printableElement = createElement('div', {
			class: 'printable',
			style: element.style.cssText,
			ngBind: "$ctrl.displayValue"
		});
		template += printableElement.outerHTML;

		let popupWidth = $attrs.popupWidth ? parseInt($attrs.popupWidth) : parseInt($element.css("width"));
		let dropdown = createElement("ax-dropdown-list", {
			datasource: "$ctrl.filteredDatasource",
			dropdownModel: "$ctrl.ngModel",
			dropdownModelType: "id-field",
			debug: true,
			ctrl: "$ctrl.popupCtrl",
			listItemIdField: $attrs.itemIdField,
			listWidth: "100%",
			popupRelativeTop: "3px",
			listAutoFocus: false,
			tabindex: -1,
			listClass: "ax-autocomplete-dropdown",
			listItemShowCheck: $attrs.itemShowCheck || false,
			class: "ax-autocomplete-dropdown",
			btnClass: "btn icon",
			disableAnimation: true
		});
		if ($element.find("ax-dropdown-list").length > 0) {
			let listTemplate = $element.find("ax-dropdown-list")[0];
			dropdown.innerHTML = listTemplate.innerHTML;
			dropdown.addAttributes(listTemplate.attributes);
		}
		if ($attrs.itemDisplayField) dropdown.setAttribute("list-item-display-field", $attrs.itemDisplayField);
		if ($attrs.itemInvariantField) dropdown.setAttribute("list-item-invariant-field", $attrs.itemInvariantField);
		if ($attrs.ngReadonly) dropdown.setAttribute("ng-readonly", "$ctrl.ngReadonly()");
		if ($attrs.ngDisabled) dropdown.setAttribute("ng-disabled", "$ctrl.ngDisabled()");
		template += dropdown.outerHTML;

		if ($attrs.linkPopupTemplateUrl) {
			let popup = createElement("ax-dropdown-popup", {
				class: "link-popup ax-autocomplete-dropdown",
				btnClass: "btn icon",
				hasInput: ""
			});
			for (let i = 0; i < $element[0].attributes.length; i++) {
				let attrName = $element[0].attributes[i].nodeName;
				if (!attrName.startsWith("link-popup")) continue;
				popup.setAttribute(attrName.replace("link-popup-", ""), $element[0].attributes[i].nodeValue);
			}
			popup.setAttribute("tabindex", tabIndex + 1);
			template += popup.outerHTML;
		} else if ($element.find("ax-dropdown-popup").length > 0) {
			let popupTemplate = $element.find("ax-dropdown-popup")[0];
			let popup = createElement("ax-dropdown-popup", {
				class: "link-popup ax-autocomplete-dropdown",
				btnClass: "btn icon",
				hasInput: ""
			});
			popup.innerHTML = popupTemplate.innerHTML;
			popup.addAttributes(popupTemplate.attributes);
			popup.setAttribute("tabindex", tabIndex + 1);

			template += popup.outerHTML;
		}

		container.innerHTML = template;
		template = container.outerHTML;
		return template;
	}

	controller.$inject = ["$scope", "$element", "$attrs", "$timeout"];

	function controller(scope, element, attrs, $timeout) {
		var inputElement = element.find(">div>input");
		var self = this;
		self.loading = true;
		element.focus(function () {
			inputElement.focus();
		});
		var stopFireBlur = false;
		var finishOpenPopup = function () {
			//console.log("stopFireBLur", true);
			stopFireBlur = false;
		};

		let blurHandle = function ($event) {
			// console.log("ngBlur ?", $event, self.ngModel, "stopFireBlur", stopFireBlur, scope.$parent.$parent.$parent.dataItem);
			if ($event.relatedTarget && $($event.relatedTarget).closest("ax-autocomplete").length && $($event.relatedTarget).closest("ax-autocomplete")[0] === element[0]) return;
			if (stopFireBlur) return;
			element.removeClass("hasFocus");
			scope.$parent.$event = $event;
			$timeout(function () {
				if (self.modelChanged && attrs.saveData) {
					//console.log("saveData executed", self.ngModel, attrs.saveData, scope.$parent.$parent.$parent.dataItem);
					if (scope.$parent.$eval(attrs.saveData)) self.modelChanged = false;
				}
				if (attrs.ngBlur) scope.$parent.$eval(attrs.ngBlur);
			});
		};
		element.find(">div [tabindex]")
			.focus(function ($event) {
				element.addClass("hasFocus");
				// console.log("focus", $event.currentTarget);
				scope.$parent.$event = $event;
				//if (attrs.ngFocus) scope.$parent.$eval(attrs.ngFocus);
				$event.stopPropagation();
			})
			.blur(blurHandle);
		this.popupCtrl = {
			onOpen: function (params) {
				dropdownsStack.closePopupsFor(element);
				this.disableFocus = params[0].disableFocus;
				this.openFinish = true;
			},
			onClose: function () {
				stopFireBlur = false;
			},
			onOpenFinish: function () {
				if (!this.disableFocus) $timeout(function () {
					if (!stopFireBlur) stopFireBlur = true;
					let $controller = self.popupCtrl.table.$ctrl;
					let dataItem = $controller.getCollection('index').objectById[$controller.selectableRowsModel];
					if (dataItem) $controller.goToDataItem(dataItem, false, finishOpenPopup);
					else $controller.goToRow(0, false, false, finishOpenPopup);
				}, 0);
			}
		};
		this.invariant = attrs.itemInvariantField ? axCreateInvariant.remove : String.cleaning;
		this.invariantField = attrs.itemInvariantField || attrs.itemDisplayField;
		self.displayValue = "";
		self.displayValueChanged = false;
		var getDatasource = function () {
			if (!attrs.datasourceFilter) return self.datasource || [];
			return self.datasourceFilter({datasource: self.datasource, param: self.datasourceFilterParam}) || [];
		};
		var modelChanged = function (newValue, oldValue) {
			self.modelChanged = newValue !== oldValue;
			// console.log("model changed", self.modelChanged, newValue);
			let dataSource = getDatasource();
			if ((!self.selectedItem || self.selectedItem[attrs.itemIdField] !== newValue) && newValue !== undefined)
				self.selectedItem = dataSource.findObject(newValue, attrs.itemIdField);

			if (newValue === undefined) self.selectedItem = undefined;
			if (self.selectedItem) self.filteredDatasource = dataSource;
			self.displayValue = self.selectedItem ? self.selectedItem[attrs.itemDisplayField] : (self.displayValueChanged ? self.displayValue : "");
			self.selectedDisplayValue = self.displayValue;
			self.displayValueChanged = false;
			if (element.hasAttribute("readonly") || element.hasAttribute("disabled")) return;
			if (attrs.onModelChanged && !self.loading && self.modelChanged) self.onModelChanged({selected: self.selectedItem});
			self.loading = self.filteredDatasource === undefined;
		};
		scope.$watch("$ctrl.ngModel", modelChanged);

		if (attrs.datasourceFilterParam) {
			scope.$watch("$ctrl.datasourceFilterParam", function () {
				self.filteredDatasource = getDatasource();
			});
		}
		scope.$watch("$ctrl.datasource", function () {
			self.filteredDatasource = getDatasource();
			if (self.loading) self.loading = false;
			else modelChanged(self.ngModel, self.ngModel);
		});
		scope.$watch("$ctrl.displayValue", function (value) {
			if (element.hasAttribute("readonly") || element.hasAttribute("disabled")) return;
			if (self.selectedDisplayValue === self.displayValue) return;
			self.displayValueChanged = true;
			if (value === "") {
				self.filteredDatasource = getDatasource();
				self.ngModel = undefined;
			} else {
				value = attrs.itemInvariantField ? self.invariant(value).toLowerCase() : value.cleaning().toLowerCase();
				self.filteredDatasource = getDatasource().filter(function (item, i, data) {
					if (item[self.invariantField] === undefined) {
						console.warn(item, " doesn't has an invariant field: ", self.invariantField);
						return false;
					}
					return (item[self.invariantField].toLowerCase().includes(value));
				}, this);
				if (self.filteredDatasource.length === -1) {
					self.ngModel = self.filteredDatasource[0][attrs.itemIdField];
					self.selectedItem = self.filteredDatasource[0];
					self.displayValue = self.selectedItem[attrs.itemDisplayField];
					self.filteredDatasource = self.datasource;
					if (self.popupCtrl.openFinish) {
						self.popupCtrl.close();
						element.focus();
					}
				} else {
					self.ngModel = undefined;
					self.selectedItem = undefined;
					if (!self.popupCtrl.openFinish) self.popupCtrl.launch([{currentTarget: element, disableFocus: true}]);
				}
			}
		});
		var keydownEventHandler = function (event) {
			if (element.hasAttribute("readonly") || element.hasAttribute("disabled")) return;
			if (event.altKey || event.ctrlKey) return;
			if (event.keyCode === keyCodes.DownArrow) {
				if (!self.selectedItem) {
					stopFireBlur = true;
					event.stopPropagation();
					if (self.popupCtrl.openFinish) {
						if (self.selectedItem) self.popupCtrl.table.$ctrl.goToDataItem(self.selectedItem, false, finishOpenPopup);
						else self.popupCtrl.table.$ctrl.goToRow(self.popupCtrl.table.$ctrl.currentRowIndex || -1, false, false, finishOpenPopup);
					} else {
						element.find("ax-dropdown-list>button").trigger("click");
						$timeout(function () {
							if (self.selectedItem) self.popupCtrl.table.$ctrl.goToDataItem(self.selectedItemfalse, finishOpenPopup);
							else self.popupCtrl.table.$ctrl.goToRow(self.popupCtrl.table.$ctrl.currentRowIndex || -1, false, false, finishOpenPopup);
						});
					}
				}
			} else if (event.keyCode === keyCodes.Escape || event.keyCode === keyCodes.Tab || event.keyCode === keyCodes.Enter) {
				if (self.popupCtrl.openFinish) self.popupCtrl.close();
			} else if (event.keyCode === keyCodes.Del || event.keyCode === keyCodes.Backspace) {
				//if (self.ngModel) self.ngModel = undefined;
			}

		};
		axUtils.addEventListener(element[0], "keydown", keydownEventHandler, false);
	}
})(window, angular);