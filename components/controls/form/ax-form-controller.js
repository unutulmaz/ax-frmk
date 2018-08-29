class axFormController {
	constructor(scope, dataStore) {
		if (arguments.length === 0) return;
		scope.$ctrl = angular.extend(this, scope.$ctrl);
		/**
		 *@type {axTableController}
		 * */
		this.table = null;
		// console.log("form create scope", scope);
		var parentScope = scope.$ctrl.$parent;
		if (this.attributes["metadata-id"]) {
			var columns = dataStore.metadata[this.attributes["metadata-id"]] ? dataStore.metadata[this.attributes["metadata-id"]].columns : {};
			this.columns = columns;
		}

		var params = parentScope.$parent.hasOwnProperty("params") ? parentScope.$parent.params : null;
		if (!params) params = parentScope.hasOwnProperty("params") ? parentScope.params : null;

		if (!this.datasource) this.datasource = {};
		this.errors = {};
		if (params) {
			angular.extend(this, params);
			if (params.dataItem) {
				this.datasource = angular.copy(params.dataItem);
				this.initialValues = angular.copy(params.dataItem);
				delete this.dataItem;
			}
			if (params.table && params.table.columns.metadata)
				this.columns = params.table.columns.metadata;
		}
		if (parentScope.$parent.hasOwnProperty("popupClose")) this.popupClose = parentScope.$parent.popupClose;
		else if (parentScope.$parent.hasOwnProperty("closeThisDialog")) this.popupClose = parentScope.$parent.closeThisDialog;
		this.loaded = true;
	}

	update(editorCallback) {
		if ((this.attributes["refresh-item-on-edit"] === "true" || this.table.attrs.refreshItemOnEdit) && this.$api) {
			let dataItem = this.datasource;
			let $controller = this;
			let callback = function (response) {
				if (!response) return;
				if (response.data) {
					response.data.$$uid = dataItem.$$uid;
					angular.extend(dataItem, response.data);
					if ($controller.config.dataAdapter) dataItem = $controller.config.dataAdapter.parseItem(dataItem);
					if (editorCallback) editorCallback();
				}
				response.loader.remove();
			};
			var dataItemId = dataItem[this.$api.config.idField];
			let apiArgs = {};
			if (this.config.editApiArgs) angular.extend(apiArgs, this.config.editApiArgs());
			else if (this.config.editExtendApiArgs) angular.extend(apiArgs, this.config.editExtendApiArgs());
			this.$api.editAction(dataItemId, apiArgs, "no").then(callback);
		}
	}

	/**
	 * Clear errors messages. Must be called before form validation and data saving
	 */
	clearAllErrors(dataItem) {
		this.errors = {};
		if (this.table && dataItem) this.table.clearErrors(dataItem);
	}

	/**
	 * After data is loaded: error messages are parsed and separated into global and fields errors
	 * @param {boolean} closeDialog true - for closing popup if form is loaded into a popup
	 */
	save(closeDialog, successCallback) {
		if (this.config.save) return this.config.save(closeDialog, successCallback);
		var dataItem = this.datasource;
		var uid = dataItem.$$uid;
		var apiArgs = {};
		this.clearAllErrors(dataItem);

		if (!this.$validateForm()) return false;
		let savedCallback = function (dataItem) {
			this.dataTableUpdate(dataItem, dataItem.$$uid ? 0 : 1);
			if (successCallback) successCallback(response);
			if (this.config.editorAfterSuccessSave) this.config.editorAfterSuccessSave();
			else if (this.config.afterSuccessSave) this.config.afterSuccessSave();
			if (this.table) this.table.hasChanges = true;
			return true;

		};
		if (!this.$api) return savedCallback.call(this, dataItem);

		var formController = this;
		apiArgs.$$permitted_params = this.permitted_params || [];
		if (this.table) apiArgs.children = this.table.childrenGetDatasources();
		if (angular.isFunction(this.config.saveExtendApiArgs)) apiArgs = angular.extend(apiArgs, this.config.saveExtendApiArgs(dataItem));
		var isNewRecord = this.$api.isNewRecord(dataItem);
		this.$api.saveAction(dataItem, apiArgs)
			.then(function (response) {
				if (response && response.status) {
					formController.datasource = response.data;
					formController.datasource.$$uid = uid;
					savedCallback.call(formController, formController.datasource);
				} else if (response && response.errors) {
					formController.extractErrors(response.errors, formController.datasource);
				} else if (response && response.message) {
					formController.$notify.error(response.message);
				}
				if (formController.table) formController.table.hasChanges = true;
				if (response.loader) response.loader.remove();
			});
	}

	$validateForm() {

		if (!this.validateEachField(this.datasource)) {
			let msg = this.getMessage("common", "saveOperationNotFinished");
			this.addGlobalError("Not saved", msg);
			return false;
		}
		if (angular.isFunction(this.config.validate) && !this.config.validate(this.datasource)) {
			let msg = this.getMessage("common", "saveOperationNotFinished");
			this.addGlobalError("Not saved", msg);
			return false;
		}

		var errorExist = this.errors.fields || this.errors.global;
		return !errorExist;
	}


	validateEachField(dataItem) {
		var hasError = false;
		for (var fieldName in this.fieldsWithErrorMsg) {
			if (fieldName.startsWith("$")) continue;
			if (!this.$validateField(fieldName, dataItem)) hasError = true;
		}
		return !hasError;
	}

	$validateField(fieldName, dataItem) {
		if (this.readOnly) return false;
		this.clearFieldError(fieldName);
		let error = this.currentFocusObject ? this.currentFocusObject.closest("[role=input-holder]").find("[error-for]") : [];
		if (error.length > 0) {
			this.$timeout(function () {
				error.trigger("mouseleave");
			});
		}
		dataItem = dataItem || this.datasource;
		if (this.columns && this.columns[fieldName]) {
			var attribs = this.columns[fieldName].attribs || [];
			if ("Required" in attribs && (dataItem[fieldName] === null || dataItem[fieldName] === "" || (angular.isArray(dataItem[fieldName]) && dataItem[fieldName].length > 0))
			) this.addFieldError(fieldName, " The " + fieldName + " field is required.");
			if ("MaxLength" in attribs && dataItem[fieldName] && dataItem[fieldName].length > attribs.MaxLength)
				this.addFieldError(fieldName,
					" The " + fieldName + " field must have a maximum length of '" + attribs.MaxLength + "'.");
			if ("MinLength" in attribs && dataItem[fieldName] && dataItem[fieldName].length < attribs.MinLength)
				this.addFieldError(fieldName,
					" The " + fieldName + " field must have a minimum length of '" + attribs.MinLength + "'.");
		}
		if (!this.config) return true;
		var returnValue = true;
		if (angular.isFunction(this.config.validateField)) returnValue = this.config.validateField(fieldName, dataItem);
		if (this.config.dataAdapter && returnValue) this.config.dataAdapter.parseItem(dataItem);
		return returnValue;
	}

	getErrorFor(dataItem, fieldName) {
		var errors = this.errors;
		var msg = "";
		if (!errors) return msg;
		if (!fieldName) {
			if (errors.global) return this.getGlobalErrorMessages(errors.global);
			else return "";
		} else {
			errors = errors.fields;
			if (!errors[fieldName]) return msg;
			for (var i = 0; i < errors[fieldName].length; i++) {
				msg += errors[fieldName][i] + "<br>";
			}
			return msg;
		}
	}

	dataTableUpdate(dataItem, op) {
		if (!this.table) return;
		this.table.datasourceUpdate(dataItem, op);
	}

	undo() {
		let self = this;
		dropdownsStack.closePopupsFor(this.element.$source, function () {
			var initial = angular.copy(self.initialValues);
			self.datasource = angular.extend(self.datasource, initial);
			self.errors = {};
			if (self.config.undoCallback) self.config.undoCallback();
		});
	}

	hasData(fieldName) {
		if (this.datasource[fieldName]) return true;
		this.addFieldError(fieldName, "Please fill value for field");
		return false;
	}

	focusToControl(fieldName) {
		var input = this.element.$source.find("[role=input-holder][form-uid=" + this.attributes.uid + "][bind-to=\"" + fieldName + "\"]");
		var control = input.find("[has-input]");
		if (control.length > 0) control[0].focus();
		let error = input.find("[error-for]");
		if (error.length > 0) {
			this.$timeout(function () {
				error.trigger("mouseenter");
			});
		}
	}

	focusToGlobalError() {
		var errors = this.element.$source.find(".errors");
		errors[0].focus();
	}

	focusToForm() {
		let self = this;
		this.$timeout(function () {
			if (this.trapFocus) this.trapFocus.autoFocus();
			else {
				var control = this.element.$source.find("[role=input-holder][form-uid=" + self.attributes.uid + "]:not([disabled]):not([readonly])").find("[has-input]");
				if (control.length > 0) control[0].focus();
			}
		});
	}

	focusToFirstControl() {
		let self = this;
		this.$timeout(function () {
			var control = this.element.$source.find("[role=input-holder][form-uid=" + this.attributes.uid + "]:not([disabled]):not([readonly])").find("[has-input]");
			if (control.length > 0) control[0].focus();
		});
	}

	objectHasFocus(event, dataItem, fieldName) {
		if (!event) return;
		let currentTd = angular.element(event.target).closest("td");
		this.currentField = fieldName;
		this.currentFocusObject = angular.element(event.target).closest(".form-control");
		let error = currentTd.find("[error-for]");
		if (error.length > 0) {
			this.$timeout(function () {
				error.trigger("mouseenter");
			});
		}
	}

	addFieldError(fieldName, message) {
		if (fieldName in this.fieldsWithErrorMsg) {
			if (!this.errors.fields) this.errors.fields = {};
			if (!this.errors.fields[fieldName]) this.errors.fields[fieldName] = [];
			if (!this.errors.fields[fieldName].includes(message)) this.errors.fields[fieldName].push(message);
			if (!this.errors.hasFocus) {
				this.errors.hasFocus = true;
				let self = this;
				this.$timeout(function () {
					self.focusToControl(fieldName);
				});
			}
		} else {
			this.addGlobalError(message, fieldName);

		}
		return false;
	}

	clearFieldError(fieldName) {
		if (!this.errors.fields) return;
		if (this.errors.fields[fieldName]) delete this.errors.fields[fieldName];
	}

	addGlobalError(label, message) {
		if (!this.errors.global) this.errors.global = [];
		this.errors.global.push({label: label || "", messages: [message]});
		this.$timeout(function () {
			this.focusToGlobalError();
		});
	}

	extractErrors(errors) {
		for (var fieldId in errors) {
			if (errors.hasOwnProperty(fieldId)) {
				var fieldName = fieldId.replace('item.', '');
				if (fieldName === "children") continue;
				if (!(fieldName in this.fieldsWithErrorMsg) || fieldName === "") {
					errors[fieldId].each(function (message) {//jshint ignore:line
						this.addGlobalError(fieldName, message);
					}, this);
					delete errors[fieldId];
				} else {
					errors[fieldId].each(function (message) {//jshint ignore:line
						this.addFieldError(fieldName, message);
					}, this);
				}
			}
		}
		if (errors.children) {
			for (let child in errors.children) {
				let childErrors = errors.children[child];
				let childCtrl = this.table.children[child];
				if (!childCtrl) console.error("Not fond controller for child:", child);
				childCtrl.trsWithError = [];
				childErrors.each(function (errors, i) {//jshint ignore:line
					childCtrl.goToRow(i, false, false, function () {
						let childError = childCtrl.extractErrors(errors, childCtrl.currentItem);
						if (childError) childCtrl.trsWithError.push(childCtrl.currentTr);
					});
				}, this);
				console.log("error", childCtrl.trsWithError);
				childCtrl.goTop();
			}
		}
	}

	isNewRecord() {
		if (!this.$api) return;
		var id = this.datasource[this.$api.config.idField];
		return this.$api.isNewRecord(id);
	}

	clearData() {
		this.datasource = {};
		this.initialValues = {};
		this.errors = {};
	}

	delete() {
		if (!this.$api) {
			console.error("No axApi service found on form object!");
			return false;
		}
		this.errors = {};
		var formScope = this;
		var apiArgs = angular.copy(this.datasource);
		this.$api.deleteAction(apiArgs[this.$api.config.idField], apiArgs)
			.then(function (response) {
				if (response) {
					formScope.dataTableUpdate(apiArgs, -1);
					formScope.popupClose();
					response.loader.remove();
				}
			});
	}

	sectionToggle(event) {
		var currentTarget = event.currentTarget;
		var iElement = angular.element(currentTarget).closest("ax-form-section-header").find('button');
		if (iElement.hasClass("fa-caret-down")) iElement.removeClass("fa-caret-down").addClass("fa-caret-right");
		else iElement.removeClass("fa-caret-right").addClass("fa-caret-down");
		var collapsed = iElement.hasClass("fa-caret-right");
		var body = angular.element(currentTarget).closest("ax-form-section").find(".form-section-body");
		if (collapsed) body.slideHide("top", 500);
		else body.slideShow("top", 500);
		this.$timeout(axUtils.triggerWindowResize, 510);
	}
}
