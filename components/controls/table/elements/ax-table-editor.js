class axTableEditor {
	/**
	 *
	 * @param {axTableController} $controller
	 */
	constructor($controller) {
		this.template = $controller.$template;
		this.controller = $controller;
		let $$editor = this;
		if ($controller.element.editorDef.length === 0) return;
		let changePosition = function (position) {
			let editorDef = $controller.element.initial.find(">ax-grid-editor");
			let editor = $controller.element.linked.parent().find(">ax-table-editor");
			let dt = editor.parent().find(">ax-table");
			let editorWidth = editorDef.getAttribute("width") || editorDef.css("width");
			if (["100%", "initial", "auto"].includes(editorWidth) && position !== "over") {
				position = "over";
				console.warn("For editor position Left or Right, you need a width attribute in pixeli for ax-grid-editor");
			}
			editorDef.setAttribute("position", position);
			editor.setAttribute("position", position);
			$controller.$layout.attrs.editorPosition = position;
			if (position === "over") editor.css("width", "100%");
			else editor.width($controller.element.initial.find("ax-grid-editor").attr("width"));

			if (position === "left") {
				editor.css({"left": 0, "right": "initial"});
				dt.css({"left": editor.outerWidth(), "right": 0, "visibility": "visible"});
			} else if (position === "right") {
				editor.css({"right": 0, "left": "initial"});
				dt.css({"left": 0, "right": editor.outerWidth() - 1, "visibility": "visible"});
			} else if (position === "over") {
				editor.css({"right": 0, "left": "0", "width": "initial"});
				dt.css({"right": 0, "left": "0", "visibility": "hidden"});
			}
			this.position = position;
			//console.log("change position", this.position);
			//$controller.render();
		};
		let closeEditor = function (event) {
			$controller.element.linked.css("visibility", "visible");
			let editor = $controller.element.linked.parent().find(">ax-table-editor");
			dropdownsStack.closePopupsFor(editor);
			let dt = editor.parent().find(">ax-table");
			$controller.element.editorDef.setAttribute("initial-state", "hidden");
			let self = $controller.$$grid.$$editor;
			let finishAnimation = function () {
				self.opened = false;
				if (self.position === "over") dt.css("width", "initial");
				$controller.$parent.$apply();
				$controller.$timeout(function () {
					$controller.windowResize();
					$controller.findNextControl($controller.currentTr, -1);
					$controller.$timeout($controller.windowResize);

				});
			};
			editor.slideHide(self.position === "left" ? "left" : "right", 500, finishAnimation, dt);
		};
		let openEditor = function (event, templateUrl) {
			this.opened = true;
			let self = this;
			if (!templateUrl)
				this.form.dataItem = $controller.currentItem && $controller.currentItem.isGroupItem ? null : $controller.currentItem;
			$controller.element.editorDef.setAttribute("initial-state", "visible");
			let finishAnimation = function (element) {
				if (self.position === "over") {
					element.style.width = "initial";
					$controller.element.linked.css("visibility", "hidden");
				}
				$controller.windowResize();
				$controller.$timeout($controller.windowResize);
			};
			$controller.$timeout(function () {
				if (!templateUrl && !self.initialized) self.refreshForm();
				let editor = $controller.element.linked.parent().find(">ax-table-editor");
				self.position = editor.getAttribute("position");
				//editor.setAttribute("position", self.position);
				if (self.position === "over") {
					editor.css("width", "100%");
				} else if ($controller.$dataStore.isMobileDevice) {
					self.position = "over";
					editor.setAttribute("position", self.position);
					editor.css("width", "100%");
				}
				else editor.width($controller.element.initial.find("ax-grid-editor").attr("width"));
				let dt = editor.parent().find(">ax-table");
				editor.slideShow(self.position === "right" ? "right" : "left", 500, finishAnimation, dt, true);

			});
		};
		let editor = null;
		if ($controller.element.editorDef.attr("template-url")) {
			editor = {
				opened: $controller.element.editorDef.getAttribute("initial-state") === "visible",
				changePosition: changePosition,
				position: "over",
				goToRowCallback: angular.noop,
				open: function (event) {
					openEditor.call(this, event, true);
				},
				close: closeEditor
			};
		} else
			editor = {
				element: null,
				table: $controller,
				$spinners: {},
				opened: $controller.element.editorDef.getAttribute("initial-state") === "visible",
				changePosition: changePosition,
				form: {
					keyboardHandle: function (event) {
						var ctrlDown = event.ctrlKey || event.metKey;
						//console.log("editPopup ketboard", ctrlDown, event.keyCode);
						if (ctrlDown && event.keyCode === keyCodes.letter.S) {
							if (this.readOnly) return;
							event.preventDefault();
							event.stopPropagation();
							this.$ctrl.save(false);
							return true;
						} else if (!ctrlDown && event.keyCode === keyCodes.Escape) {
							if (this.readOnly) return $controller.$$grid.$$editor.close();
							event.preventDefault();
							event.stopPropagation();
							this.$ctrl.undo(true);
							return true;
						} else if (ctrlDown && event.keyCode === keyCodes.letter.N) {
							event.preventDefault();
							event.stopPropagation();
							this.add(true);
							return true;
						} else if (ctrlDown && event.keyCode === keyCodes.letter.D) {
							event.preventDefault();
							event.stopPropagation();
							this.delete(true);
							return true;
						} else if (!ctrlDown && event.keyCode === keyCodes.function.f2) {
							if (!this.dataItem) return;
							event.preventDefault();
							event.stopPropagation();
							this.edit(true);
							return true;
						} else if (ctrlDown && event.keyCode === keyCodes.letter.Q) {
							event.preventDefault();
							event.stopPropagation();
							$controller.changeTableFocus();
						} else if (ctrlDown && event.keyCode === keyCodes.Home) {
							event.preventDefault();
							event.stopPropagation();
							$controller.goToFirstRow();
							return true;
						} else if (ctrlDown && event.keyCode === keyCodes.End) {
							event.preventDefault();
							event.stopPropagation();
							$controller.goToLastRow();
							return true;
						} else if (event.keyCode === keyCodes.PageDown) {
							event.preventDefault();
							event.stopPropagation();
							$controller.goToNextRow();
							return true;
						} else if (event.keyCode === keyCodes.PageUp) {
							event.preventDefault();
							event.stopPropagation();
							$controller.goToPreviousRow();
							return true;
						}

						return false;

					},
					readOnly: true,
					onInitDone: function () {
						if (!$controller.config) $controller.config = {};
						if (!$controller.config.editor) $controller.config.editor = {};
						this.canChangeEditorPosition = $controller.config.editor && $controller.config.canChangeEditorPosition ? $controller.config.canChangeEditorPosition : function () {
							return true;
						};
						this.canAdd = function () {
							if ($controller.config.canAdd) return $controller.config.canAdd();
							else return $controller.dataLoaded;
						};
						this.canEdit = $controller.config.canEdit || function () {
							return true;
						};
						this.canDelete = $controller.config.canDelete || function () {
							return true;
						};
						this.canPrint = $controller.config.canPrint || function () {
							return true;
						};
						if ($controller.$$grid.$$editor.opened) $controller.element.linked.parent().find(">ax-table-editor").css("display", "block");
						this.edit = function () {
							if (!this.canEdit()) return;
							this.readOnly = false;
							this.$ctrl.readOnly = false;
							let dataItem = this.$ctrl.datasource;
							let callback = function () {
								$controller.setToEditMode(dataItem, function () {
									$controller.$$grid.$$editor.form.$ctrl.focusToFirstControl();
									if ($controller.config && $controller.config.editor.editCallback) $controller.config.editor.editCallback($controller.$$grid.$$editor.form.dataItem);
								});
							};
							this.$ctrl.update(callback);
						};
						this.add = function () {
							if (!this.canAdd()) return;
							let self = this;
							$controller.create(false, function (dataItem) {
								self.added = true;
								self.readOnly = false;
								self.$ctrl.readOnly = false;
								self.dataItem = dataItem;
								$controller.$$grid.$$editor.refreshForm();
								//$controller.$currentItemChanged(this.dataItem);
								$controller.$$grid.$$editor.form.$ctrl.focusToFirstControl();
								if ($controller.config && $controller.config.editor.createCallback) $controller.config.editor.createCallback($controller.$$grid.$$editor.form.dataItem);

							});
						};
						this.editorAfterSuccessSave = function (response) {
							angular.extend(this.dataItem, this.$ctrl.datasource);
							if ($controller.config && $controller.config.editor.afterSuccessSave) $controller.config.editor.afterSuccessSave({data: $controller.$$grid.$$editor.form.dataItem, status: true});

							$controller.setToReadOnly();
							$controller.refreshViewItem(this.dataItem, true);
							this.$ctrl.readOnly = true;
							this.readOnly = true;
							this.added = false;
						};
						this.undoCallback = function () {
							this.$ctrl.readOnly = true;
							this.readOnly = true;
							if ($controller.config && $controller.config.editor.undoCallback) $controller.config.editor.undoCallback($controller.$$grid.$$editor.form.dataItem);

							$controller.setToReadOnly();
							if (this.added) {
								this.dataItem = $controller.currentItem;
								$controller.$$grid.$$editor.refreshForm();
							}
							if ($controller.currentItem) {
								$controller.goToDataItem($controller.currentItem);
								$controller.$currentItemChanged($controller.currentItem);
							}
							this.added = false;
						};
						this.delete = function (dialog) {
							if (!this.canDelete(false) || $controller.inlineEditing) return;
							let self = this;
							if ($controller.config && $controller.config.editor.beforeDelete && !$controller.config.editor.beforeDelete($controller.$$grid.$$editor.form.dataItem)) return;
							$controller.delete(this.dataItem, dialog, function (response) {
								delete $controller.$$grid.$$editor.form.dataItem;
								$controller.$$grid.$$editor.refreshForm();
								if ($controller.config && $controller.config.editor.afterDelete) $controller.config.editor.afterDelete($controller.$$grid.$$editor.form.dataItem);
								$controller.goToRow($controller.currentRowIndex);
							});
						};
						this.print = function (type) {
							$controller.exportCurrentItem(this.$ctrl.datasource, type);
						};
						this.$ctrl.$parent = $controller.$parent;

						this.$ctrl.getTooltipFor = $controller.getTooltipFor;
						this.$ctrl.table = $controller;
						if ($controller.$api) this.$ctrl.$api = $controller.$api;
						if ($controller.element.editorDef.getAttribute("show-fields-errors-as") !== "text") this.$ctrl.fieldsWithErrorMsg = $controller.columnsWithErrorMsg;
						this.$ctrl.dataItemSetAttr = function (dataItem, attr, value) {
							$controller.dataItemSetAttr(dataItem, attr, value);
						};
						this.$ctrl.getMessage = function (category, id) {
							return $controller.$template.getMessage(category, id);
						};
						this.$ctrl.dataItemHasFieldErrors = function (dataItem, fieldName) {
							return this.errors.fields && this.errors.fields[fieldName];
						};
						axUtils.objectOverwrite(this, this.$ctrl, ["undo", "save", "delete", "$ctrl"], true, false);
						if ($controller.config) {
							axUtils.objectOverwrite(this.$ctrl.config, $controller.config, ["$ctrl"]);
							this.$ctrl.config.errors = this.$ctrl.errors;
							let self = this;
							Object.defineProperty(self.$ctrl.config, "errors", {
								get: function () {
									return self.$ctrl.errors;
								},
								set: function (errors) {
									self.$ctrl.errors = errors;
								}
							});
						}
						this.$ctrl.$dropdowns = {
							fieldEdit: $controller.$dropdowns.fieldEdit
						};
						$controller.$$grid.$$editor.position = $controller.$dataStore.isMobileDevice ? "over" : ($controller.$$grid.$$editor.position || $controller.element.editorDef.getAttribute("position"));
						$controller.$$grid.$$editor.refreshForm();
						$controller.$$grid.$$editor.initialized = true;
						//console.log("on init done", $controller.$$grid.$$editor.position );
					}
				},
				goToRowCallback: function (dataItem) {
					if (!this.opened || !this.form.$ctrl) return;
					this.form.dataItem = dataItem.isGroupItem ? null : dataItem;
					this.form.$ctrl.clearAllErrors(this.form.dataItem);
					this.refreshForm();
				},
				setFormData: function (dataItem) {
					this.form.dataItem = dataItem;
					this.form.$ctrl.datasource = angular.copy(dataItem);
					this.form.$ctrl.initialValues = angular.copy(dataItem);
				},
				refreshForm: function () {
					this.setFormData(this.form.dataItem);
					if (this.form.refreshFormCallback) this.form.refreshFormCallback(this.form.dataItem);
				},
				focus: function () {
					this.form.$ctrl.trapFocus.autoFocus();
				},
				open: function (event) {
					openEditor.call(this, event, false);
				},
				close: function (event) {
					if (!this.form.readOnly) return;
					closeEditor(event);
				}

			};
		this.controller.$$grid.$$editor = editor;
		editor.$destroy = function () {
			$$editor.controller = null;
			$$editor.template = null;
			editor.table.$$grid.$$editor = null;
			delete editor.table.$$grid.$$editor;
			editor.table = null;
			delete editor.table;
			editor.form.table = null;
			if (editor.form.config) editor.form.config.table = null;
			if (editor.form.$ctrl) editor.form.$ctrl.table = null;
			editor.__proto__ = null; //jshint ignore:line
			this.__proto__ = null; //jshint ignore:line
		};
		if (this.controller.$$grid.getEditorConfig) editor.config = this.controller.$$grid.getEditorConfig();
	}//end constructor

	static createPopupForm(template) {
		let def = template.element.editorDef;
		if (def.length === 0) {
			console.error("For edit-row=editor you need a ax-grid-editor with popup attributes");
			return;
		}
		if (def.attr("template-url")) return template.element.editorHasTemplate = true; //jshint ignore:line 
		let editorTemplate = template.element.linked.parent().find(">ax-table-editor");
		let editorContent = createElement("div", {class: "editor-content"});
		if (template.$dataStore.isMobileDevice) def.setAttribute("position", "over");
		editorTemplate.setAttribute("position", def.getAttribute("position"));
		editorTemplate.setAttribute("ng-click", "grid.$$editor.focus()");
		//editorTemplate.setAttribute("ng-keydown", "$$editor.form.keyboardHandle($event)");
		if (def.getAttribute("position") !== "over" && def.hasAttribute("width")) {
			editorTemplate.setAttribute("width", def.getAttribute("width"));
			editorTemplate[0].style.width = def.getAttribute("width");
		}
		if (def.getAttribute("position") === "left") editorTemplate.addStyle("right: initial;border-right: 1px solid #b9c3c8");
		if (def.getAttribute("position") === "right") editorTemplate.addStyle("left:initial;border-left: 1px solid #b9c3c8");

		if (def.getAttribute("initial-state") === "visible" && def.getAttribute("position") !== "over") editorTemplate.css("display", "block");
		let formTitle = createElement("div", {class: "form-title", ngIf: "grid.$$editor.opened"});
		createElement("div", {ngBind: def.attr("editor-title") || "'Current DataItem'"}, "", formTitle);
		if (!template.$dataStore.isMobileDevice) {
			let position = createElement("div", {
				class: "editor-position",
				ngIf: "grid.$$editor.form.canChangeEditorPosition()"
			});
			createElement("button", {
				class: "btn icon fa fa-long-arrow-left",
				uibTooltip: "Change editor position to Left",
				ngDisabled: "grid.$$editor.position==='left'",
				ngClick: "grid.$$editor.changePosition('left')"
			}, "", position);
			createElement("button", {
				class: "btn icon fa fa-long-arrow-up",
				uibTooltip: "Change editor position to Over",
				ngDisabled: "grid.$$editor.position==='over'",
				ngClick: "grid.$$editor.changePosition('over')"
			}, "", position);
			createElement("button", {
				class: "btn icon fa fa-long-arrow-right",
				uibTooltip: "Change editor position to Right",
				ngDisabled: "grid.$$editor.position==='right'",
				ngClick: "grid.$$editor.changePosition('right')"
			}, "", position);
			formTitle.appendChild(position);
		}
		createElement("div", {
			class: "ngdialog-close",
			ngShow: "grid.$$editor.form.readOnly",
			ngClick: "grid.$$editor.close($event)"
		}, "", formTitle);
		editorContent.appendChild(formTitle);
		let form = createElement("ax-form", {
			config: "grid.$$editor.form",
			trapFocus: true,
			ngIf: "grid.$$table.controllerLoaded && grid.$$editor.opened",
			readOnly: "grid.$$editor.form.readOnly",
			datasource: "grid.$$editor.form.data",
			style: "position:absolute;left:0;right:0;overflow:auto;width:initial;height:initial;"
		});
		form.style.top = template.$dataStore.formTitleHeight() + 10 + "px";
		form.style.bottom = template.$dataStore.editorToolbarHeight() + 10 + "px";
		if (def.getAttribute("show-fields-errors-as") === "text") form.setAttribute("show-fields-errors-as-text", "");
		let table = createElement("ax-form-table", {}, "", form);
		if (def.hasAttribute("cols-width")) table.setAttribute("cols-width", def.getAttribute("cols-width"));
		let columnsNo = def.getAttribute("columns-no") || 1;
		for (let i = 0; i < columnsNo; i++) {
			createElement("ax-form-table-column", {ngCloak: "", columnIndex: i + 1}, "", table);
		}
		if (columnsNo > 1) form.setAttribute("tab-order-by-index", "");
		form.appendChild(table);
		createElement("ax-form-errors", {}, "", form);
		if (template.element.editorDef.attr("metadata-id")) form.setAttribute("metadata-id", template.element.editorDef.attr("metadata-id"));
		editorContent.appendChild(form);
		let toolbar = createElement("div", {
			role: "toolbar",
			axScroller1: "",
			ngIf: "grid.$$editor.opened ",
			class: "editor-toolbar",
			style: "position:absolute;bottom:0px;left:0;right:0;background-color:transparent;"
		});
		if (def.getAttribute("toolbar-ax-scroller") === "true") toolbar.setAttribute("ax-scroller", "");
		createElement("span", {
			ngShow: "grid.$$editor.form.canEdit()",
			ngDisabled: "!grid.$$editor.form.readOnly || !grid.$$editor.form.dataItem",
			uibTooltip: "Edit current item (F2)",
			ngClick: "grid.$$editor.form.readOnly && grid.$$editor.form.dataItem && grid.$$editor.form.edit()",
			class: "btn btn-primary btn-edit-popup"
		}, "<i class='fa fa-edit'></i>", toolbar);
		createElement("span", {
			ngShow: "grid.$$editor.form.canAdd()",
			uibTooltip: "Add new item (Ctrl+N)",
			ngDisabled: "!grid.$$editor.form.readOnly",
			ngClick: "grid.$$editor.form.readOnly && grid.$$editor.form.add()",
			class: "btn btn-primary btn-edit-popup"
		}, "<i class='fa fa-plus'></i>", toolbar);
		createElement("span", {
			ngDisabled: "grid.$$editor.form.readOnly",
			ngShow: "grid.$$editor.form.canEdit()",
			uibTooltip: "Save changes (Ctrl+S)",
			ngClick: "!grid.$$editor.form.readOnly && grid.$$editor.form.$ctrl.save(false)",
			class: "btn btn-primary btn-edit-popup"
		}, "<i class='fa fa-save'></i>", toolbar);
		createElement("span", {
			ngDisabled: "grid.$$editor.form.readOnly",
			ngShow: "grid.$$editor.form.canEdit()",
			uibTooltip: "Revert changes (Escape)",
			ngClick: "!grid.$$editor.form.readOnly && grid.$$editor.form.$ctrl.undo(false)",
			class: "btn btn-primary btn-edit-popup"
		}, "<i class='fa fa-undo'></i>", toolbar);
		if (!template.attributes["apply-changes-on-save"]) {

			let button = createElement("button", {
				class: "btn btn-primary",
				"ng-click": "grid.$$editor.$spinners.applyOrder.do()",
				"ng-disabled": "!grid.$$editor.table.hasChanges || !grid.$$editor.form.readOnly"
			});

			createElement('ax-i-spinner',
				{
					"i-class": "fa fa-check",
					"i-height": "16",
					'has-callback': true,
					style: "",
					config: "grid.$$editor.$spinners.applyOrder",
					action: "grid.$$editor.table.applyOrderToChanges(removeSpinner)"
				}, null, button);
			if (template.attributes['show-commands-tooltips']) button.setAttribute('uib-tooltip', template.getMessage('toolbar', 'apply'));
			toolbar.appendChild(button);

		}
		let deletePopup = createElement("div", {
			style: "padding:10px;width:250px"
		});
		createElement("button", {
			class: "btn btn-primary",
			style: "width:230px;margin-bottom:3px;",
			ngClick: "launcher.$parent.$parent.$parent.grid.$$editor.form.delete();launcher.close()",
		}, `<i class='fa fa-check'></i>Confirm delete record`, deletePopup);
		createElement("button", {
			class: "btn btn-primary",
			style: "width:230px",
			ngClick: "launcher.close($event)",
			autofocus: true
		}, `<i class='fa fa-ban'></i>Cancel`, deletePopup);
		createElement("ax-dropdown-popup", {
			ngShow: "grid.$$editor.form.canDelete()",
			ngDisabled: "!grid.$$editor.form.readOnly || !grid.$$editor.form.dataItem",
			uibTooltip: "Delete current item (Ctrl+D)",
			btnClass: "btn btn-primary",
			btnHtml: "<i class=\"fa fa-trash-o\" ></i>",
			popupDirection: "Up",
			caretClass: "fa ",
			popupRelativeLeft: "-115px",
			style: "margin-right:0;vertical-align:middle"
		}, deletePopup, toolbar);

		let printPopup = createElement("div", {style: "padding:0px;"});
		createElement("span", {
			ngClick: "launcher.$parent.grid.$$editor.form.print('print');launcher.close()",
			style: "",
			uibTooltip: "Export in new browser tab",
			class: "btn btn-primary btn-edit-popup"
		}, "<i class='fa fa-html5'></i>", printPopup);
		createElement("span", {
			ngClick: "launcher.$parent.grid.$$editor.form.print('xls');launcher.close()",
			style: "margin-left:3px;",
			uibTooltip: "Export as excel file",
			class: "btn btn-primary btn-edit-popup"
		}, "<i class='fa fa-file-excel-o'></i>", printPopup);

		createElement("ax-dropdown-popup", {
			ngShow: "grid.$$editor.form.canPrint()",
			ngDisabled: "!grid.$$editor.form.readOnly || !grid.$$editor.form.dataItem",
			btnClass: "btn btn-primary",
			btnHtml: "<i class=\"fa fa-print\" ></i>",
			popupDirection: "Up",
			caretClass: "fa ",
			closeOnMouseleave1: true,
			style: "margin-right:0;vertical-align:middle"
		}, printPopup, toolbar);

		let navigator = createElement("div", {
			class: "inline editor",
			toolbar: "right",
			role: "paginator",
		});
		createElement("span", {
			class: "fa fa-step-backward",
			role: "go-to-first-page",
			ngClick: "grid.$$editor.table.goToFirstRow()",
			ngDisabled: "!grid.$$editor.form.readOnly || !grid.$$table.$paginator || grid.$$table.totalRecords.filtered()===0 || grid.$$editor.table.inlineEditing || grid.$$editor.table.currentRowIndex === 0 ",
			uibTooltip: "First record, Shortcut: Ctrl+Home"
		}, "", navigator);
		createElement("span", {
			class: "fa fa-chevron-left",
			role: "go-to-previous-page",
			ngClick: "grid.$$editor.table.goToPreviousRow()",
			ngDisabled: "!grid.$$editor.form.readOnly || !grid.$$editor.table.$paginator || grid.$$table.totalRecords.filtered()===0 ||grid.$$editor.table.inlineEditing || grid.$$editor.table.currentRowIndex === 0 ",
			uibTooltip: "Previous record, Shortcut: Page Up"
		}, "", navigator);
		createElement("span", {
			class: "fa fa-chevron-right",
			role: "go-to-next-page",
			ngClick: "grid.$$editor.table.goToNextRow()",
			ngDisabled: "!grid.$$editor.form.readOnly || !grid.$$editor.table.$paginator || grid.$$table.totalRecords.filtered()===0 ||grid.$$editor.table.inlineEditing || grid.$$editor.table.currentRowIndex  === grid.$$editor.table.getCollection('visibleItems').length-1",
			uibTooltip: "Next record, Shortcut: Page Down"
		}, "", navigator);
		createElement("span", {
			class: "fa fa-step-forward",
			role: "go-to-last-page",
			ngClick: "grid.$$editor.table.goToLastRow()",
			ngDisabled: "!grid.$$editor.form.readOnly || !grid.$$editor.table.$paginator || grid.$$table.totalRecords.filtered()===0 ||grid.$$editor.table.inlineEditing || grid.$$editor.table.currentRowIndex === grid.$$editor.table.getCollection('visibleItems').length-1",
			uibTooltip: "Last record, Shortcut: Ctrl+End"
		}, "", navigator);
		toolbar.appendChild(navigator);
		editorContent.appendChild(toolbar);

		template.editorTemplate = editorTemplate;
		template.editorContent = $(editorContent);
		template.editorForm = template.editorContent.find(">ax-form");
		return editorContent;
	}

	static createControl(template, column) {
		let editorContent = template.editorContent;
		if ((column.hidden || ["Icons", "Actions", "Empty column"].includes(column.title)) && column.showInEditor !== true || column.showInEditor === false) return;
		let showFieldsErrorsAsText = editorContent.find(">ax-form").hasAttribute("show-fields-errors-as-text");
		let control = createElement("ax-form-field");
		let axEditor = $(column.def).find(">ax-column-editor");
		let axEdit = $(column.def).find(">ax-column-edit");
		let addToColumn = 1;
		if (column.def.hasAttribute("editor-column-index")) addToColumn = column.def.getAttribute("editor-column-index");
		if (axEditor.length > 0) {
			if (axEditor.hasAttribute("colspan")) control.setAttribute("colspan", axEditor.getAttribute("colspan"));
			if (axEditor.hasAttribute("editor-column-index")) addToColumn = axEditor.getAttribute("editor-column-index");
			axEditor.setAttribute("type", "custom");
			let input = createElement("ax-form-input", axEditor[0].attributes, axEditor.html());
			input.addStyle("width", (axEditor.getAttribute("width") || axEditor[0].style.width || (column.width + "px")) + " !important");
			input.removeAttribute("hidden-column");
			control.appendChild(input);
		} else if (axEdit.length > 0) {
			createElement("label", {}, column.header, control);
			if (axEdit.hasAttribute("editor-column-index")) addToColumn = axEdit.getAttribute("editor-column-index");
			let width = axEdit.getAttribute("width") || (column.width + "px");
			let input = createElement("ax-form-input", {
				type: "custom",
				bindTo: axEdit.getAttribute("bind-to") || column.bindTo,
				ngDisabled: true,
				style: "width:" + width + " !important;"
			});
			let html = column.templates.td.editHTML.split("$parent.$parent.dataItem").join("dataItem").split("$ctrlxx.").join("$ctrl.table.").replaceAll("\\bdataItem\\b", "$ctrl.datasource");
			let inputEl = angular.element(html);
			if (inputEl.hasAttribute("ng-model") || inputEl.hasAttribute("bind-to")) inputEl.setAttribute("ng-readonly", "$ctrl.readOnly");
			else $(inputEl).find("[ng-model], [bind-to]").each(function (i, element) {
				if (element.hasAttribute("ctrl") && element.getAttribute("ctrl").includes(".$dropdowns.fieldEdit")) return;
				element.setAttribute("ng-readonly", "$ctrl.readOnly");
			});
			inputEl.find(".grid-control").removeClass("grid-control").addClass("editor-control");
			if (showFieldsErrorsAsText) {
				inputEl.find("[error-for]").remove();
			} else input.setAttribute("show-fields-errors-as-icons", "");
			input.innerHTML = inputEl[0].outerHTML;
			input.removeAttribute("hidden-column");
			control.appendChild(input);
		} else {
			createElement("label", {}, column.header, control);
			let input = createElement("ax-form-input", {type: "custom", "ng-disabled": "true", style: "width:" + column.width + "px !important;"});
			if (column.bindTo) input.setAttribute("bind-to", column.bindTo);
			input.innerHTML = column.templates.td.viewHTML.split("$ctrlxx.").join("$ctrl.table.").replaceAll("\\bdataItem\\b", "$ctrl.datasource").replaceAll("::", "");

			control.appendChild(input);
		}
		$(control).find("[hidden-column]").each(function (i, element) {
			element.removeAttribute("hidden-column");
		});
		control.setAttribute("editor-column-index", addToColumn);
		//console.log("createControl", column);

		return control;
	}

	static createSection(template, column, header) {
		let form = template.editorForm;
		let def = template.element.editorDef;
		if (column.hidden && column.showInEditor !== true || column.showInEditor === false) return;
		let axFormField = createElement("ax-form-field", {colspan: 2});
		let section = createElement("ax-form-section", {sectionFor: column.title});
		let addToColumn = column.editorColumnIndex;
		if (def.hasAttribute("cols-width")) {
			let colsWidthItems = def.getAttribute("cols-width").split(",");
			let colsWidth = "";
			for (let i = 0; i < 2; i++) {
				colsWidth += (i === 0 ? "" : ",") + colsWidthItems[(addToColumn - 1) * 2 + i];
			}
			section.setAttribute("cols-width", colsWidth);
		}
		createElement("ax-form-section-header", {collapsible: "", collapsed: false, style: header.style.cssText}, column.headerTitle, section);
		createElement("ax-form-table-column", {}, "", section);
		axFormField.appendChild(section);
		$(axFormField).find("[hidden-column]").each(function (i, element) {
			element.removeAttribute("hidden-column");
		});

		form.find(">ax-form-table>ax-form-table-column[column-index=" + addToColumn + "]")[0].appendChild(axFormField);

		//console.log("createSection", column, form.outerHTML() );
		return form.find(">ax-form-table>ax-form-table-column>ax-form-field>ax-form-section[section-for='" + column.title + "']>ax-form-table-column");
	}
}