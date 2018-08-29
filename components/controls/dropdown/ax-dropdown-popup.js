function axDropdownPopup(popupTemplate, $element, $attrs, templateFactory, $compile, $timeout, $document, $dataStore, dateParser) {
	var axDropdown = {};
	axDropdown = {
		uid: axUtils.Guid(),
		template: {
			getUserDefinedParams: function () {
				var openParams = "";
				if ($attrs.openParams) {
					var params = $attrs.openParams.split(";");
					for (var i = 0; i < params.length; i++) {
						if (params[i].length === 0) continue;
						//openParams += "," + "$parent." + params[i];
						openParams += "," + params[i];
					}
				}
				return openParams;
			},
			toggleButton: function () {
				$element.addClass('inline');
				var openParams = "$event" + this.getUserDefinedParams();
				var hasInput = (angular.isDefined($attrs.tabindex) && $attrs.tabindex !== "-1") || (angular.isDefined($attrs.hasInput) && $attrs.hasInput !== "false");
				var tabIndex = $attrs.tabindex ? parseInt($attrs.tabindex) : (hasInput ? 0 : -1);
				var button = createElement('button',
					{
						type: "button",
						style: ($attrs.btnStyle || $attrs.buttonStyle || '') + ";width:100% !important;",
						tabindex: tabIndex,
						uid: axDropdown.uid,
						class: "dropdown-toggle " + ($attrs.btnClass || $attrs.buttonClass || ''),
						"ng-keydown": "dropdown.toggleButton.keyDown($event)",
						"ng-click": "dropdown.toggleButton.click(" + openParams + ")"
					});
				if (hasInput) button.setAttribute("has-input", "");
				if ($attrs.ngDisabled) button.setAttribute('ng-disabled', 'dropdown.ngDisabled({$event:$event})');
				if ($attrs.ngReadonly) button.setAttribute('ng-readonly', 'dropdown.ngReadonly({$event:$event})');
				if ($attrs.ngFocus) button.setAttribute('ng-focus', 'dropdown.ngFocus({$event:$event})');
				if ($attrs.ngBlur) button.setAttribute('ng-blur', 'dropdown.ngBlur({$event:$event})');

				button.style.position = "relative";
				$element[0].removeAttribute("has-input");
				let toggleTemplate = $element.find(">ax-dropdown-toggle-button");
				if (toggleTemplate.length > 0) {
					button.innerHTML = toggleTemplate.html();
					button.addAttributes(toggleTemplate[0].attributes, button);
					toggleTemplate.remove();
				}
				if (["AX-DROPDOWN-LIST", "AX-DROPDOWN-TABLE"].includes($element[0].tagName)) {
					let showClearButton = $attrs.showClearButton === 'true';
					let btnWidth = applicationInfo.theme.dimensions.iconButtonWidth;
					let marginRight = btnWidth * (showClearButton ? 2 : 1) - 5;
					if ($attrs.btnBindHtml) {
						button.setAttribute("bind-html-compile", $attrs.btnBindHtml);
					} else if ($attrs.btnHtml) {
						button.innerHTML = $attrs.btnHtml;
					} else if ($attrs.class && $attrs.class.includes("ax-autocomplete-dropdown")) {
						//console.log("is autocmplete");
					} else if ($element.attr('list-selectable-rows') === 'multiple') {
						var innerHtml = "<div style='text-align:left;white-space:nowrap;'  bind-html-compile='dropdown.toggleButton.getText();' ></div> ";
						var wrapper = createElement('div',
							{
								style: 'overflow-y:auto;overflow-x:hidden;height:100%;'
							}, innerHtml);
						button.appendChild(wrapper);
					} else {
						createElement("div",
							{
								style: 'overflow:hidden;text-align:left;white-space: nowrap;',
								'ng-bind': 'dropdown.toggleButton.getText();'
							}, '', button);
					}
					if (showClearButton) {
						let clearBtn = createElement('i', {
							class: 'dropdown-clear fa fa-eraser btn icon',
							'ng-if': 'dropdown.showClearButton',
							'ng-click': 'dropdown.toggleButton.clearModel($event)'
						});
						button.addClass("has-clear-btn");
						button.appendChild(clearBtn);
						axDropdown.showClearButton = true;
					}
					var caret = createElement('div', {class: 'caret-holder'}, "<span class='" + ($attrs.caretClass || 'caret') + "'></span>");
					if ($attrs.caretStyle) caret.style.cssText = $attrs.caretStyle;
					button.addClass("has-caret");
					button.appendChild(caret);
					axDropdown.toggleButton.template = button.outerHTML;
					return;
				} else if ($attrs.btnText) {
					button.innerHTML = $attrs.btnText ? "<span ng-bind='dropdown.toggleButton.getText();' ></span > " : '';

				} else if ($attrs.btnHtml) {
					button.innerHTML = $attrs.btnHtml;
				}
				if ($attrs.caretClass !== "fa") {
					var span = createElement('div', {class: 'caret-holder'}, "<span class='" + ($attrs.caretClass || 'caret') + "'></span>");

					if ($attrs.caretStyle) span.style.cssText = $attrs.caretStyle;
					button.appendChild(span);
					button.addClass("has-caret");
				}
				axDropdown.toggleButton.template = button.outerHTML;
				if (!$attrs.templateUrl) {
					axDropdown.popup.template = popupTemplate || $element.html();
				}

			},
			popup: function () {
				if (!axDropdown.popupTemplate) {
					var popupElement = createElement('ax-popup',
						{
							class: "dropdown-popup " + ($attrs.popupClass || ''),
							uid: axDropdown.uid,
							launcher: "dropdown",
							style: "overflow: auto;position:absolute!important;visibility:hidden;max-height:auto"
						});
					if ($attrs.dontRegisterToStack !== undefined) popupElement.setAttribute('dont-register-to-stack', '');
					if ($attrs.popupAbsoluteTop) popupElement.setAttribute('popup-absolute-top', $attrs.popupAbsoluteTop);
					if ($attrs.popupAbsoluteBottom) popupElement.setAttribute('popup-absolute-bottom', $attrs.popupAbsoluteBottom);
					if ($attrs.popupAbsoluteLeft) popupElement.setAttribute('popup-absolute-left', $attrs.popupAbsoluteLeft);
					if ($attrs.popupAbsoluteRight) popupElement.setAttribute('popup-absolute-right', $attrs.popupAbsoluteRight);
					if ($attrs.popupRelativeLeft) popupElement.setAttribute('popup-relative-left', $attrs.popupRelativeLeft);
					if ($attrs.popupRelativeTop) popupElement.setAttribute('popup-relative-top', $attrs.popupRelativeTop);
					// if (!$dataStore.isMobileDevice) {
					if ($attrs.closeOnBlur) popupElement.setAttribute('close-on-blur', $attrs.closeOnBlur);
					if ($attrs.closeOnMouseleave && $attrs.closeOnMouseleave !== "false") popupElement.setAttribute('ng-mouseleave', "dropdown.ctrl.close()");
					// }
					if ($attrs.closeOnDestroy) popupElement.setAttribute('close-on-destroy', $attrs.closeOnDestroy);
					if ($attrs.disableAnimation) popupElement.setAttribute('disable-animation', $attrs.disableAnimation);
					if ($attrs.popupDirection) popupElement.setAttribute('popup-direction', $attrs.popupDirection);

					if ($attrs.popupWidth) popupElement.style.width = $attrs.popupWidth;
					if ($attrs.popupHeight) popupElement.style.height = $attrs.popupHeight;
					if ($attrs.popupMaxHeight) popupElement.style['max-height'] = $attrs.popupMaxHeight;
					popupElement.innerHTML = axDropdown.popup.template;
					axDropdown.popup.popupTemplate = popupElement.outerHTML;
				}
				var template = angular.element(axDropdown.popup.popupTemplate);
				// template.find('[role=table-header] thead').css('visibility', 'hidden');
				var axDatatable = template.find('> ax-list, > ax-table');
				if (!$attrs.popupWidth && axDatatable.length > 0) {
					let width = axDatatable[0].getAttribute('width') || axDatatable[0].style.width || "";
					if (!width || width.indexOf("%") > -1) template.css('width', axDropdown.popup.$toggleButton.outerWidth() + 'px');
				}
				angular.element('body').append($compile(template[0].outerHTML)(axDropdown.popup.scope));
				axDropdown.popup.openStep = 3;
			}
		},
		toggleButton: {
			clearModel: function ($event) {
				$event.stopPropagation();
				$event.preventDefault();
				var dropdown = axDropdown.popup.scope.dropdown;
				if (dropdown.ctrl.close) dropdown.ctrl.close();
				if (dropdown.ngReadonly() || dropdown.ngDisabled()) return false;
				var toggleButton = dropdown.popup.$toggleButton ? dropdown.popup.$toggleButton : null;
				if (toggleButton) {
					var loaderClasses = 'dropdown-clear fa fa-spinner fa-pulse fa-fw';
					let spinner = createElement("i", {class: loaderClasses});
					toggleButton.append(spinner);
				}
				if ($attrs[dropdown.elementTag + 'SelectableRows'] === 'single') {
					dropdown.dropdownModel = null;
				} else dropdown.dropdownModel = [];
				this.onSelectionChange();

				// if (dropdown.ctrl.table) dropdown.ctrl.table.$ctrl.selectRows(false);
				$timeout(function () {
					dropdown.onSelectionChange();
					if (toggleButton) $timeout(function () {
						toggleButton.find(".fa-spinner").remove();
					});
				});
				return false;
			}
			,
			getText: function () {
				var text;
				if ($attrs.btnText) {
					text = axDropdown.popup.scope.$parent.$eval($attrs.btnText);
					return axDropdown.popup.scope.$parent.$eval($attrs.btnText);
				}
				else if ($attrs.dropdownModel && axDropdown.popup.scope) {
					//console.log("getText", $attrs.dropdownModel, axDropdown.dropdownModel, this.text);
					return this.text;
				}
				return false;
			}
			,
			onSelectionChange: function () {
				var dropdown = axDropdown.popup.scope.dropdown;
				if (!dropdown) return;
				if (!dropdown.convertData) {
					if ($attrs.convertType) {
						dropdown.convertData = function (value) {
							var convertType = {fn: convertDataTypes[$attrs.convertType]};
							if ($attrs.convertDisplayFormat) convertType.displayFormat = $attrs.convertDisplayFormat;
							//if ($attrs.convertFormat) convertType.format = $attrs.convertFormat;
							return convertType.fn(value, dropdown.dateParser);
						};
					} else dropdown.convertData = function (value) {
						return value;
					};
				}
				var itemDisplayField = $attrs.itemDisplayField || $attrs[dropdown.elementTag + "ItemDisplayField"] || $attrs[dropdown.elementTag + "ItemIdField"];
				var itemIdField = $attrs.itemIdField || $attrs[dropdown.elementTag + "ItemIdField"];
				dropdown.showClearButton = false;
				if ($attrs[dropdown.elementTag + 'SelectableRows'] === 'single') {
					if (!dropdown.dropdownModel) this.text = axDropdown.popup.scope.$parent.$eval($attrs.emptyOptionText) || "";
					else {
						let item;
						if (dropdown.dropdownModelType === 'object') {
							if (angular.isObject(dropdown.dropdownModel)) item = dropdown.dropdownModel;
						} else item = axUtils.findObject(dropdown.datasource, itemIdField, dropdown.dropdownModel);
						dropdown.showClearButton = item[itemDisplayField] !== "" && item[itemDisplayField] !== undefined && item[itemDisplayField] !== null;
						if (item) this.text = dropdown.convertData(item[itemDisplayField]);
						else this.text = "";
					}
				} else {
					if (!dropdown.dropdownModel || dropdown.dropdownModel.length === 0) this.text = axDropdown.popup.scope.$parent.$eval($attrs.emptyOptionText) || "";
					else {
						var text = "";
						var values = [];
						for (let i = 0; i < dropdown.dropdownModel.length; i++) {
							let value = dropdown.dropdownModel[i], item;
							if (dropdown.dropdownModelType === 'object') item = value;
							else item = axUtils.findObject(dropdown.datasource, itemIdField, value);
							if (item[itemDisplayField] === '') continue;
							values.push(dropdown.convertData(item[itemDisplayField]));
						}
						text = values.sort().join('<br/>');
						dropdown.showClearButton = true;
						dropdown.oldText = text;
						this.text = text;
					}
				}

			}
			,
			click: function ($event) {
				// $dataStore.timeStamp(true, "popup-open");
				$event.preventDefault();
				var isOpen = axDropdown.popup.openStep === 5;
				var isClose = !axDropdown.popup.openStep;
				if (!isClose && !isOpen) {
					$event.stopImmediatePropagation();
					$event.stopPropagation();
					return false;
				} else if (isClose) axDropdown.popup.launch(arguments, true);
				else axDropdown.popup.close(arguments);
				return true;
			}
		}
		,
		popup: {
			template: "",
			templateUrl:
				"ax-dropdown-popup",
			launchSteps:
				{
					1:
						'toggleClicked', 2:
						'viewControllerLoaded', 3:
						'templateCreated'
				}
			,
			getTemplate: function (templateUrl) {
				var popup = this;
				templateFactory.getTemplate(templateUrl)
					.then(function (response) {
						popup.template = response.data;
						// $dataStore.timeStamp(false, "popup-open", "get template");

					});
			}
			,

			launch: function (params, preventDocumentClick) {
				// $dataStore.timeStamp(false, "popup-open", "launch");
				var popupObj = this;
				if (popupObj.scope.dropdown.ngReadonly() || popupObj.scope.dropdown.ngDisabled()) return false;
				if (!this.scope.dropdown.ctrl) console.error("No ctrl object for popup found!!");
				for (let uid in this.scope.dropdown.ctrl.parents) {
					if (uid === this.scope.dropdown.ctrl.uid) continue;
					let parent = this.scope.dropdown.ctrl.parents[uid];
				}
				this.scope.dropdown.ctrl.scope = function () {
					return popupObj.scope;
				};
				var $event = params[0];
				this.element = angular.element($event.currentTarget).parent();

				if ($attrs.templateUrl && !this.template) popupObj.getTemplate(this.scope.$eval($attrs.templateUrl));

				var loaderClasses = 'fa fa-spinner fa-pulse fa-fw';
				this.preventDocumentClick = true;
				//console.log("open params", params);
				this.openParams = params;
				this.$toggleButton = popupObj.isAutocomplete || popupObj.isAutocompletePopup ? angular.element($event.currentTarget).closest("ax-autocomplete") : angular.element($event.currentTarget).parent();
				this.zIndex = axUtils.findHighestZIndex(this.$toggleButton) || 10;
				this.toggleHeight = parseInt(this.$toggleButton.outerHeight()) + parseInt($attrs.popupRelativeHeight || 0);
				this.toggleWidth = parseInt(this.$toggleButton.outerWidth());
				this.buttonClasses = this.$toggleButton.find('.dropdown-toggle').attr("class");
				if (this.buttonClasses.contain('fa')) {
					this.$toggleButton.find('button').attr("class", "dropdown-toggle " + loaderClasses);
				}
				if (popupObj.scope.dropdown.ctrl.openFinish && popupObj.scope.dropdown.ctrl.close) popupObj.scope.dropdown.ctrl.close();
				popupObj.scope.dropdown.ctrl.openFinish = false;
				popupObj.scope.dropdown.ctrl.popup = popupObj;
				if ($attrs.popupDirection) this.popupDirection = $attrs.popupDirection;
				else this.popupDirection = "down";
				this.openStep = 1;
				popupObj.scope.dropdown.ctrl.close = popupObj.close;
				if (popupObj.scope.dropdown.ctrl.onOpen) {
					let open = false;
					try {
						open = popupObj.scope.dropdown.ctrl.onOpen(params);
					} catch (err) {
						console.error("Error opening popup", err);
					}
					if (open === false) {
						this.openStep = false;
						return;
					}
				} else {
					popupObj.scope.dropdown.ctrl.openFinish = true;
				}
			}
		}
		,
		onClose: angular.noop,
		post:

			function (scope, element) {
				var template = this.template;
				var popupObj = this.popup;
				var self = this;
				scope.dataStore = $dataStore;
				popupObj.openStep = false;
				popupObj.scope = scope;
				Object.defineProperty(popupObj, "$parent", {
					get() {
						return scope.$parent;
					}
				});
				this.scope = scope;
				popupObj.element = element;
				if (element.hasClass("ax-autocomplete-dropdown")) popupObj.isAutocomplete = true;
				if (element.hasClass("ax-autocomplete-popup")) popupObj.isAutocompletePopup = true;

				if (this.ctrl.onClose) this.onClose = this.ctrl.onClose;
				if (this.ctrl.onInitDone) this.ctrl.onInitDone();
				this.ctrl.launch = function (params, preventDocumentClick) {
					popupObj.launch(params, preventDocumentClick);
				};
				this.ctrl.findPopup = function () {
					return popupObj.popupElement;
				};

				axDropdown = this;// o fi bine?
				if ($attrs.dropdownModel) {
					popupObj.scope.$watch(function () {
						return scope.dropdown.datasource;
					}, function () {
						self.toggleButton.onSelectionChange();
					});
					popupObj.scope.$watch(function () {
						return axDropdown.dropdownModel;
					}, function () {
						self.toggleButton.onSelectionChange();
					});
				}
				popupObj.scope.$watch(function () {
						return popupObj.openStep === 1 && popupObj.scope.dropdown.ctrl.openFinish && popupObj.template;
					},
					function (value) {
						if (!value) return;
						popupObj.openStep = 2;
						template.popup();
					});
				if ($attrs.closeOnDestroy !== "false") {
					element.on("$destroy",
						function () {
							if (!popupObj) return;
							if (popupObj.openStep > 3) popupObj.findPopup().unbind().remove();
							popupObj.scope.dropdown = null;
							scope.$destroy();
							element = null;
							scope = null;
							popupObj = null;
						});
				}
			}
	};
	axDropdown.template.toggleButton();
	return axDropdown;
}