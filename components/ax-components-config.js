angular.module('ax.components', ["ngDialog", "ui.bootstrap", "ui.router", "as.sortable", "ngFileUpload", 'hmTouchEvents']);
/**
 * @returns {$axTableConfig}
 */
var $axTableConfig = function () {
	var separateLanguageFiles = false;
	var texts = {
		common: {
			cancel: {en: 'Cancel'},
			ok: {en: "Ok"},
			clear: {en: "Clear"},
			save: {en: "Save"},
			delete: {en: "Delete"},
			change: {en: "Change"},
			new: {en: "New"},
			view: {en: "View"},
			edit: {en: "Edit"},
			"deleteDone!": {en: "Delete done!"},
			confirmAction: {en: "Confirm action"},
			deleteCurrentItem: {en: "Delete current item?"},
			saveOperationNotFinished: {en: "Save operation not finished! Data is not valid! Please check marked fields!"},
			dataNotMeetingValidationCriteria: {en: "Data is not meeting the validation criteria. Save not finished. Please check the fields!"},
			saveSuccessful: {en: "Save successful!"},
			dataIsNotSaved: {en: "Data is not saved!"}
		},
		pagination: {
			totalRecords: {en: "Total records"},
			fromPage: {en: "From"},
			goToPage: {en: "Go to page"},
			toPage: {en: "to"},
			currentPage: {en: "Current page"},
			of: {en: "of"},
			previous: {en: "Previous page"},
			next: {en: "Next page"},
			firstPage: {en: "First page"},
			lastPage: {en: "Last page"},
			noRecords: {en: "No records to show!"},
			pageSizeSetting: {en: "Change records number on page"}
		},
		columnHeader: {
			openMenu: {en: "Click to open column menu!"}
		},
		toolbar: {
			apply: {en: 'Apply orders and filters to changed records'},
			btnLoad: {en: "Load"},
			btnLoading: {en: "Loading"},
			btnSave: {en: "Save"},
			btnSaving: {en: "Saving"},
			btnApply: {en: "Apply"},
			btnApplying: {en: "Applying"},
			btnApplySelected: {en: "Apply Selected"},
			btnClearAll: {en: "Clear All"},
			btnSaveProfile: {en: "Save profile"},
			btnRun: {en: "Run"},
			btnRunning: {en: "Running"},
			config: {en: "Data table configuration"},
			globalSearchTitle: {en: "Global search options"},
			toggleEditMode: {en: "Toggle edit/readonly mode for data table"},
			checkAll: {en: "Check All"},
			uncheckAll: {en: "Uncheck All"},
			closePopup: {en: "Close popup"},
			isReadonly: {en: "Edit Data"},
			isEditable: {en: "Lock editing"},
			settings: {en: "Settings"},
			groupsFilter: {en: "Filter records by groups expressions"},
			profiles: {en: "Profiles"},
			profileSave: {en: "Save current profile"},
			profileLoad: {en: "Load a profile"},
			profileDelete: {en: "Delete a profile"},
			arrangeRowOrders: {en: 'Set rows order by columns'},
			columnsToggleShow: {en: "Show/hide columns"},
			columnsFreezing: {en: "Set columns layout"},
			dataGrouping: {en: "Grouping data records"},
			dataGroupingEdit: {en: "Edit group properties"},
			dataGroupingAddCalculation: {en: "Add calculation"},
			allRecordsMustHaveFirstLevel: {en: "Group by 'All records' must be first on grouping list"},
			pivotTable: {en: "Pivot Table Design"},
			clearFilters: {en: "Clear all filters"},
			clearAll: {en: "Clear all"},
			allColumnsAutoFit: {en: "Auto fit all columns width to their visible content"},
			loadDataTooltip: {en: "Load/refresh data from server"},
			loadData: {en: "Load data"},
			initialSelect: {en: 'Initial Select'},
			initialSelectTooltip: {en: "Load initial parameters for report"},
			addRecord: {en: "Add"},
			addRecordTooltip: {en: "Add record (Ctrl+I)"},
			dataExport: {en: "Export"},
			toggleFilters: {en: "Show/hide filters row"},
			dataExportTooltip: {en: "Select data export type."},
			xlsExport: {en: "Export data as Excel file"},
			viewForPrint: {en: "View data for print"},
			maximize: {en: "Toggle maximize data-table"},
			confirmDeletion: {en: "Confirm delete item"},
			editField: {en: "Edit Field"},
			columnNotGroupable: {en: "Selected column is not groupable"},
			noSortableColumns: {en: "No sortable columns found!"},
			groupsToggle: {en: "Groups"},
			groupLevelToggle: {en: "Toggle groups levels"}
		}
	};
	var config = {
		sortableClasses: {
			sortASC: 'fa fa-long-arrow-up',
			sortDESC: 'fa fa-long-arrow-down',
			sortABLE: 'glyphicon glyphicon-sort'
		},
		language: "en",
		default: "en",
		languages: {en: "English", ro: "Romana"},
		texts: texts,
		defaultAttrs: {
			customizableDataGrouping: "true",
			customizablePivotTable: "false",
			customizableConfig: "true",
			freezeColumnsEnabled: "true",
			hideFiltersRowEnabled: "true",
			columnsAutofitEnabled: "true",
			customizableFreezedColumns: "true",
			rowDataHeight: "24",
			rowHeaderHeight: "28"
		},
		filters: {
			menu: function (element) {
				var type = element.getAttribute("data-type");
				var defaultMenu = this.menus[type];
				if (!defaultMenu) return element;
				else return defaultMenu(element);
			},
			multiselectDistinctValues(menu) {
				createElement("ax-column-filter", {
					type: "dropdown-list-distinctvalues",
					"selectable-rows": "multiple",
					"label": "Multiselect from distinct values"
				}, "", menu);
			},
			inputValue(menu, type, showInPopup, popupWidth) {
				createElement("ax-column-filter", {
					type: type,
					"show-config": "true",
					showInPopup: showInPopup ? "true" : "false",
					popupWidth: popupWidth ? popupWidth + "px" : "",
					"label": "Filter by input value"
				}, "", menu);
			},
			menus: {
				string: function (menu) {
					if (menu.innerHTML.trim() !== "") return menu;
					config.filters.multiselectDistinctValues(menu);
					config.filters.inputValue(menu, "text");
					return menu;
				},
				text: function (menu) {
					return config.filters.menus.string(menu);
				},
				boolean: function (menu) {
					if (menu.innerHTML.trim() !== "") return menu;
					if (!menu.hasAttribute("convert-type")) menu.setAttribute("convert-type", "boolean");
					config.filters.multiselectDistinctValues(menu);
					return menu;
				},
				number: function (menu) {
					if (menu.innerHTML.trim() !== "") return menu;
					config.filters.multiselectDistinctValues(menu);
					config.filters.inputValue(menu, "number", true, 280);
					return menu;
				},
				date: function (menu) {
					if (menu.innerHTML.trim() !== "") return menu;
					if (!menu.hasAttribute("convert-type")) menu.setAttribute("convert-type", "date");
					if (!menu.hasAttribute("convert-input-format")) menu.setAttribute("convert-input-format", "yyyy-MM-ddThh:mm:ss");
					if (!menu.hasAttribute("convert-display-format")) menu.setAttribute("convert-display-format", axDateFormat);
					config.filters.multiselectDistinctValues(menu);
					config.filters.inputValue(menu, "date", true);
					return menu;
				},
				datetime: function (menu) {
					if (menu.innerHTML.trim() !== "") return menu;
					if (!menu.hasAttribute("convert-type")) menu.setAttribute("convert-type", "datetime");
					if (!menu.hasAttribute("convert-input-format")) menu.setAttribute("convert-input-format", "yyyy-MM-ddThh:mm:ss");
					if (!menu.hasAttribute("convert-display-format")) menu.setAttribute("convert-display-format", axDateTimeFormat);
					config.filters.multiselectDistinctValues(menu);
					config.filters.inputValue(menu, "datetime", true);
					return menu;
				}
			}
		}

	};
	var privateConfig = new axTableConfig();
	//if (!privateConfig.texts) privateConfig.texts = {};
	//if (privateConfig.texts && privateConfig.texts.toolbar) privateConfig.texts.toolbar = angular.extend(config.texts.toolbar, privateConfig.texts.toolbar);
	//else privateConfig.texts.toolbar = config.texts.toolbar;
	//if (privateConfig.texts) privateConfig.texts = angular.extend(config.texts, privateConfig.texts);
	//else privateConfig.texts = config.texts;
	//privateConfig.defaultAttrs = angular.extend(config.defaultAttrs, privateConfig.defaultAttrs);
	axUtils.objectOverwrite(config, privateConfig, false, false, true);
	return config;
};
var focusableElements = '[has-input]:not([disabled]):not([readonly]):not(ax-dropdown-list):not(ax-dropdown-popup):not(ax-table),' +
	'button:not([disabled]):not([readonly]):not([tabindex="-1"])';
//var focusableElements = '[has-input]:not([disabled]):not([readonly]):not(ax-dropdown-list):not(ax-dropdown-popup):not(ax-table),' +
//	'.form-control:not([has-input]):not([disabled]):not([readonly]):not(ax-dropdown-list):not(ax-dropdown-popup):not(ax-table) [has-input],' +
//	'button:not([disabled]):not([readonly]):not([tabindex="-1"])';

var convertDataTypes = {
	date: function (itemValue) {
		var value;
		if (itemValue === null || itemValue === undefined) return undefined;
		else if (typeof itemValue === "string") {
			value = this.inputFormat ? moment(itemValue, this.inputFormat, true) : moment(itemValue);
			if (value && value.isValid && value.isValid()) value = value.toDate();
			else console.error("date convert error for", itemValue, this.inputFormat, value._f);
		}
		else if (typeof itemValue === "object" && itemValue.getTimezoneOffset) value = itemValue;
		else console.error("Date value must be string or date object");
		value.setMinutes(0);
		value.setSeconds(0);
		value.setMilliseconds(0);
		value.setHours(-value.getTimezoneOffset() / 60);
		// console.log(value.toLocaleDateString());
		return value;
	},
	boolean: function (itemValue) {
		if (itemValue === "true" || itemValue === "True" || itemValue === true || parseInt(itemValue) > 0) return true;
		else if (itemValue === "" || itemValue === null || itemValue === undefined) return null;
		else return false;
	},
	integer: function (itemValue) {
		if (itemValue === "" || itemValue === null || itemValue === undefined) return null;
		else return parseInt(itemValue);
	},
	float: function (itemValue) {
		let result;
		if (itemValue === "" || itemValue === null || itemValue === undefined) result = null;
		else result = parseFloat(itemValue);
		// console.log("convert ", itemValue, "to", result);
		return result;
	}
};
convertDataTypes["date-range"] = convertDataTypes.date;
convertDataTypes.datetime = convertDataTypes.date;
convertDataTypes["datetime-range"] = convertDataTypes.date;
