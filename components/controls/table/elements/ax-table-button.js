class axTableButton extends axElement {
	constructor(element, dataTableTemplate) {
		super();
		this.attributes = { 'icon-class': "" };
		return this.create(element, dataTableTemplate);
	}

	create(element, dataTableTemplate) {
		this.extractAttributesValues(element);
		var buttonType = this.source.getAttribute('button-type');
		// this.source.setAttribute('type', 'button');
		var button, icon, title, html, axSpinner;
		switch (buttonType) {
			case "check-all":
				button = createElement('button', {
					class: 'btn btn-primary',
					style: this.source.style.cssText,
					'ng-disabled': "$ctrl.totalRecords.filtered()===0",
					"uib-tooltip": dataTableTemplate.getMessage('toolbar', 'checkAll'),
					'ng-click': "$event.stopPropagation();$ctrl.$spinners.selectRows.check.do()"
				});
				createElement('ax-i-spinner',
					{
						"i-class": this.source.getAttribute("class") || "fa fa-check",
						"i-height": "16",
						config: "$ctrl.$spinners.selectRows.check",
						'has-callback': true,
						style: "margin:auto",
						action: "$ctrl.selectRows(true, removeSpinner)"
					}, null, button);
				if (this.source.hasAttribute("toolbar")) button.setAttribute("toolbar", this.source.getAttribute("toolbar"));
				if (this.source.innerHTML) button.innerHTML += this.source.innerHTML;
				break;
			case "uncheck-all":
				button = createElement('button', {
					class: 'btn btn-primary',
					style: this.source.style.cssText,
					'ng-disabled': "$ctrl.totalRecords.filtered()===0",
					"uib-tooltip": dataTableTemplate.getMessage('toolbar', 'uncheckAll'),
					'ng-click': "$event.stopPropagation();$ctrl.$spinners.selectRows.uncheck.do()"
				});
				createElement('ax-i-spinner',
					{
						"i-class": this.source.getAttribute("class") || "fa fa-eraser",
						"i-height": "16",
						config: "$ctrl.$spinners.selectRows.uncheck",
						'has-callback': true,
						style: "margin:auto",
						action: "$ctrl.selectRows(false, removeSpinner)"
					}, null, button);
				if (this.source.hasAttribute("toolbar")) button.setAttribute("toolbar", this.source.getAttribute("toolbar"));
				if (this.source.innerHTML) button.innerHTML += this.source.innerHTML;
				break;
			case "close-popup":
				button = createElement('button', {
					class: 'btn btn-primary ',
					style: this.source.style.cssText,
					"uib-tooltip": dataTableTemplate.getMessage('toolbar', 'closePopup'),
					'ng-click': "$ctrl.canClosePopup($event)"
				});
				button.style.padding = 0;
				createElement("i", { class: this.source.getAttribute('class') || "fa fa-times", style: "margin:auto" }, "", button);
				if (this.source.hasAttribute("toolbar")) button.setAttribute("toolbar", this.source.getAttribute("toolbar"));
				if (this.source.innerHTML) button.innerHTML += this.source.innerHTML;
				break;
			case "load-data":
			case "refresh":
				button = createElement("button", this.source.attributes);
				button.addClass('btn');
				button.addClass('btn-primary');
				button.style["margin-top"]="auto";
				button.style["margin-bottom"]="auto";
				var action = this.source.getAttribute('ng-click') || "$ctrl.loadData($ctrl, removeSpinner)";
				if (!dataTableTemplate.controller.$spinners) dataTableTemplate.controller.$spinners = {};
				if (!dataTableTemplate.controller.$spinners.loadData) dataTableTemplate.controller.$spinners.loadData = {};
				var cnt = Object.keys(dataTableTemplate.controller.$spinners.loadData).length;
				var newSpinner = "" + cnt;
				dataTableTemplate.controller.$spinners.loadData[newSpinner] = {};
				button.setAttribute("ng-click", "$ctrl.$spinners.loadData[" + newSpinner + "].do()");
				if (dataTableTemplate.attributes["edit-row"] === "inline")
					button.setAttribute("ng-disabled", "$ctrl.inlineEditing");
				if (dataTableTemplate.attributes["show-commands-tooltips"]) button.setAttribute("uib-tooltip", dataTableTemplate.getMessage('toolbar', 'loadDataTooltip'));
				axSpinner = createElement('ax-i-spinner',
					{
						"i-class": "fa fa-refresh",
						"i-height": "16",
						'has-callback': true,
						config: "$ctrl.$spinners.loadData[" + newSpinner + "]",
						style: "margin-right:3px;",
						action: action
					}, null, button);
				if (this.source.innerHTML.trim()) button.innerHTML += this.source.innerHTML;
				else button.innerHTML += dataTableTemplate.getMessage('toolbar', 'loadData');
				break;
			case "initial-select":
				button = createElement("button", this.source.attributes);
				button.addClass('btn');
				button.addClass('btn-primary');
				if (!this.source.hasAttribute('ng-click')) button.setAttribute("ng-click", "$ctrl.parent().loadInitialData()");
				if (dataTableTemplate.attributes["show-commands-tooltips"]) button.setAttribute("uib-tooltip", dataTableTemplate.getMessage('toolbar', 'initialSelectTooltip'));
				icon = createElement("i", { class: 'fa fa-question' });
				button.appendChild(icon);
				button.innerHTML += dataTableTemplate.getMessage('toolbar', 'initialSelect');
				break;
			case "groups-toggle":
				button = this.createDOMElement("ax-dropdown-popup",
					{
						style: "margin:auto 3px",
						tabindex: -1,
						class: "groups-toggle",
						"ng-if": "$ctrl.hasCollapsibleGroup",
						"btn-class": "btn btn-primary",
						"btn-text": "'" + dataTableTemplate.getMessage('toolbar', 'groupsToggle') + "'",
						"caret-class": "fa fa-caret-down",
						"close-on-mouseleave1": "true",
						"popup-class": "dropdown-popup-menu",
						"popup-width": "auto",
						"popup-relative-left": "0",
						"popup-relative-top": "2px",
						"ng-disabled": "$ctrl.inlineEditing",
						"template-url": "'components/controls/table/templates/ax-table-groups-toggle.html'",
						"open-params": "1",
						ctrl: "$ctrl.$dropdowns.groupsToggle"
					});
				if (this.source.hasAttribute("toolbar")) button.setAttribute("toolbar", this.source.getAttribute("toolbar"));
				if (this.source.hasAttribute("ng-show")) button.setAttribute("ng-show", this.source.getAttribute("ng-show"));
				if (this.source.hasAttribute("ng-hide")) button.setAttribute("ng-hide", this.source.getAttribute("ng-hide"));

				if (dataTableTemplate.attributes["show-commands-tooltips"]) button.setAttribute("uib-tooltip", dataTableTemplate.getMessage('toolbar', 'groupLevelToggle'));
				break;
			case "maximize":
				button = createElement("button", {
					class: "btn btn-primary table-toggle-maximize fa " + (this.source.classList || ""),
					"ng-class": "{'fa-window-restore': $ctrl.maximized, 'fa-window-maximize': !$ctrl.maximized}",
					toolbar: "right"
				});
				if (!this.source.hasAttribute('ng-click')) button.setAttribute("ng-click", "$ctrl.tableToggleMaximize()");
				if (dataTableTemplate.attributes["show-commands-tooltips"]) button.setAttribute("uib-tooltip", dataTableTemplate.getMessage('toolbar', 'maximize'));
				break;
			case "settings":
				button = this.createSettingsContainer(this.source.attributes, dataTableTemplate);
				break;
			case "global-search":
				button = this.createGlobalSearch(this.source, dataTableTemplate);
				if (this.source.getAttribute("has-config") !== "false")
					createElement("ax-dropdown-popup",
						{
							ctrl: "$ctrl.$dropdowns.globalSearch",
							role: "search-config",
							"btn-class": "btn icon filter-config",
							"btn-text": "",
							"caret-class": "fa fa-sliders",
							"close-on-blur": "true",
							"close-on-escape": "true",
							ngDisabled: "$ctrl.inlineEditing",
							"popup-width": "auto",
							"popup-relative-top": "2px",
							"popup-relative-left1": "-280px",
							"template-url": dataTableTemplate.attributes["global-search-config"] || "'components/controls/table/templates/ax-table-filter-global.html'",

						}, "", button);
				break;
			default:
				button = createElement("button", this.source.attributes);
				if (this.attributes['icon-class']) {
					var i = createElement("i", { class: this.attributes['icon-class'] });
					button.appendChild(i);
				}
				axElement.addChildren(button, this.source);

		}
		return button;
	}

	createGlobalSearch(source, dataTableTemplate) {
		var container = this.createDOMElement("div", {
			class: "toolbar-container global-search",
		});
		if (source.getAttribute("search-columns")) dataTableTemplate.controller.filters.config.globalSearch = { columns: source.getAttribute("search-columns").split(",") };
		container.addAttributes(source.attributes);
		createElement("div", { style: "white-space:nowrap;margin-right:5px" }, source.innerHTML, container);
		createElement("ax-text", {
			"ng-model": "$ctrl.filters.globalSearch",
			"ng-change": "$ctrl.filterApply()",
			ngDisabled: "$ctrl.inlineEditing",
			"has-input": true,
			autofocus: "",
			"ng-model-options": "{updateOn: 'default blur clear', debounce: {'default': 150, 'blur': 0, 'clear': 0 }}",
			"tabindex": 0,
			"style": "width:100%;"
		}, source.innerHTML, container);

		container.addStyle("padding-right", "0");
		return container;
	}

	createSettingsContainer(attributes, dataTableTemplate) {
		var container = this.createDOMElement("div", {
			class: "toolbar-container btn btn-primary",
			'toolbar': 'right'
		});
		container.addAttributes(attributes);
		if (container.getAttribute("show-title") !== "false")
			container.innerHTML = "<div class='container-label'>" + dataTableTemplate.getMessage('toolbar', 'settings') + ": </div>";
		if (dataTableTemplate.columnsNo > 2 && dataTableTemplate.attributes["customizable-config"] !== "false") {
			var config = this.createDOMElement("ax-dropdown-popup",
				{
					tabindex: -1,
					"btn-class": "btn icon settings settings-hide",
					"caret-class": "fa fa-cogs",
					"popup-max-height": '100%',
					"close-on-blur": "true",
					"close-on-escape": "true",
					"popup-width": "auto",
					"popup-relative-left": "-1001",
					"popup-relative-top": "2px",
					"ng-disabled": "$ctrl.inlineEditing",
					"template-url": dataTableTemplate.attributes["config-template"] || "'components/controls/table/templates/ax-table-config.html'",
					ctrl: "$ctrl.$dropdowns.config"
				});
			if (dataTableTemplate.attributes['show-commands-tooltips']) config.setAttribute('uib-tooltip', dataTableTemplate.getMessage('toolbar', 'config'));
			container.appendChild(config);
		}
		if (dataTableTemplate.columnsNo > 2 && dataTableTemplate.attributes["customizable-pivot-table"] !== "false") {
			var pivotTable = this.createDOMElement("ax-dropdown-popup",
				{
					tabindex: -1,
					"btn-class": "btn icon settings settings-hide",
					"caret-class": "fa fa-newspaper-o",
					"popup-max-height": '100%',
					"close-on-blur": "true",
					"close-on-escape": "true",
					"popup-width": "auto",
					"popup-relative-left": "-800",
					"popup-relative-top": "2px",
					'ng-disabled': "$ctrl.inlineEditing || $ctrl.totalRecords.filtered()===0",
					"template-url": dataTableTemplate.attributes["pivot-table-template"] || "'components/controls/table/templates/ax-table-pivot-table.html'",
					ctrl: "$ctrl.$dropdowns.pivotTable"
				});
			if (dataTableTemplate.attributes['show-commands-tooltips']) pivotTable.setAttribute('uib-tooltip', dataTableTemplate.getMessage('toolbar', 'pivotTable'));
			container.appendChild(pivotTable);
		}
		if (dataTableTemplate.hasFilters) {
			if (dataTableTemplate.attributes["hide-filters-row-enabled"] !== "false") {
				// var showFilters = createElement("button",
				// 		{
				// 			class: "btn icon fa fa-filter",
				// 			tabindex: -1,
				// 			"ng-click": "$ctrl.filtersToggleShow();"
				// 		});
				// if (dataTableTemplate.attributes['show-commands-tooltips']) showFilters.setAttribute('uib-tooltip', dataTableTemplate.getMessage('toolbar', 'toggleFilters'));
				// container.appendChild(showFilters);
			}
			var clearFilters = this.createDOMElement("ax-dropdown-popup",
				{
					tabindex: -1,
					"btn-class": "btn icon settings settings-filters",
					"caret-class": "fa fa-eraser",
					"close-on-mouseleave": "true",
					"close-on-escape": "true",
					"popup-width": "auto",
					"popup-relative-left": "-202px",
					"popup-relative-top": "2px",
					"ng-disabled": "$ctrl.inlineEditing",
					ctrl: "$ctrl.$dropdowns.clearFilters"
				});
			if (dataTableTemplate.attributes['show-commands-tooltips']) clearFilters.setAttribute('uib-tooltip', dataTableTemplate.getMessage('toolbar', 'clearFilters'));
			var popupTemplate = this.createDOMElement("div", { class: "inline", style: 'padding:5px' });
			var confirmBtnDef = this.createDOMElement("ax-button",
				{
					class: "btn btn-primary",
					"ng-click": "launcher.confirm()",
					tabindex: 0,
					"icon-class": "fa fa-check",
					style: 'margin-right:5px'
				});
			confirmBtnDef.innerHTML = dataTableTemplate.getMessage('toolbar', 'clearFilters');
			var confirmBtn = axElement.createViewElement(confirmBtnDef);
			popupTemplate.appendChild(confirmBtn);
			var cancelBtnDef = this.createDOMElement("ax-button", { class: "btn btn-primary", "ng-click": "popupClose()", tabindex: 0, "icon-class": "fa fa-ban" });
			cancelBtnDef.innerHTML = dataTableTemplate.getMessage('common', 'cancel');
			var cancelBtn = axElement.createViewElement(cancelBtnDef);
			popupTemplate.appendChild(cancelBtn);
			clearFilters.appendChild(popupTemplate);
			container.appendChild(clearFilters);
		}
		if (dataTableTemplate.attributes["columns-autofit-enabled"] !== "false") {
			var fitAll = createElement("button",
				{
					class: "btn icon",
					style:"height:100%",
					tabindex: -1,
					"ng-click": "$ctrl.$spinners.fitAll.do()"
				});
			if (dataTableTemplate.attributes['show-commands-tooltips']) fitAll.setAttribute('uib-tooltip', dataTableTemplate.getMessage('toolbar', 'allColumnsAutoFit'));
			var axI = createElement('ax-i-spinner',
				{
					"i-class": "fa fa-arrows-h",
					"i-height": "16",
					config: "$ctrl.$spinners.fitAll",
					action: "$ctrl.columnsAutoFitAll()"
				}, null, fitAll);
			container.appendChild(fitAll);
		}
		if (dataTableTemplate.attributes["export-disabled"] !== "true") {
			let button = this.createDOMElement("ax-dropdown-popup",
				{
					tabindex: -1,
					"btn-class": "btn icon fa fa-upload",
					"caret-class": "fa ",
					"close-on-mouseleave": "true",
					"close-on-escape": "true",
					"popup-class": "dropdown-popup-menu",
					"popup-width": "auto",
					"popup-relative-left": "-265px",
					"popup-relative-top": "2px",
					'ng-disabled': "$ctrl.totalRecords.filtered()===0",
					"template-url": "'components/controls/table/templates/ax-table-export.html'",
					"open-params": "1",
					ctrl: "$ctrl.$dropdowns.export"
				});
			if (dataTableTemplate.attributes["show-commands-tooltips"]) button.setAttribute("uib-tooltip", dataTableTemplate.getMessage('toolbar', 'dataExportTooltip'));
			container.appendChild(button);

		}
		if (dataTableTemplate.attributes["customizable-edit-mode"] !== "false") {
			let cfgEditMode = createElement("ax-dropdown-popup",
				{
					tabindex: -1,
					"btn-class": "btn icon fa fa-edit",
					"caret-class": "fa ",
					"close-on-mouseleave1": "true",
					"close-on-escape": "true",
					"popup-class": "dropdown-popup-menu",
					"popup-width": "auto",
					"popup-relative-left": "-325px",
					"popup-relative-top": "2px",
					"template-url": "'components/controls/table/templates/ax-table-config-edit-mode.html'",
					"open-params": "1",
					ngDisabled:"$ctrl.inlineEditing || $ctrl.canEdit",
					ctrl: "$ctrl.$dropdowns.configEditMode"
				});
			if (dataTableTemplate.attributes["show-commands-tooltips"]) cfgEditMode.setAttribute("uib-tooltip", "Config edit mode");
			container.appendChild(cfgEditMode);
		}
		if (["inline-cell"].includes(dataTableTemplate.attributes["edit-row"]) && !dataTableTemplate.attributes["parent-config"] && container.getAttribute("show-change-edit")!=="false") {
			let button = createElement("button", {
				class: "btn icon fa ",
				tabindex: -1,
				ngClass: "{'fa-unlock-alt':$ctrl.canEdit , 'fa-lock':!$ctrl.canEdit}",
				ngClick: "$ctrl.changeEdit()"
			});
			if (dataTableTemplate.attributes["show-commands-tooltips"]) button.setAttribute("uib-tooltip", dataTableTemplate.getMessage('toolbar', 'toggleEditMode'));
			container.appendChild(button);
		}
		if (["inline", "inline-cell"].includes(dataTableTemplate.attributes["edit-row"]) && dataTableTemplate.attributes["can-add"] !== "false") {
			let button = createElement("button", {
				class: "btn icon fa fa-plus",
				tabindex: -1,
				ngDisabled: "!$ctrl.canAdd() ",
				ngClick: "$ctrl.create()"
			});
			if (dataTableTemplate.attributes["edit-row"] === "inline")
				button.setAttribute("ng-disabled", "!$ctrl.canAdd() || $ctrl.inlineEditing");
			if (dataTableTemplate.attributes["show-commands-tooltips"]) button.setAttribute("uib-tooltip", dataTableTemplate.getMessage('toolbar', 'addRecordTooltip'));
			let tooltip = button.getAttribute("uib-tooltip");
			tooltip += (tooltip ? ", " : "") + " Shortcut: Ctrl+N";
			button.setAttribute("uib-tooltip", tooltip);
			container.appendChild(button);
		}
		if (["inline", "inline-cell"].includes(dataTableTemplate.attributes["edit-row"]) && !dataTableTemplate.attributes["apply-changes-on-save"]) {
			let button = createElement("button", {
				class: "btn icon",
				"ng-click": "$ctrl.$spinners.applyOrder.do()",
				"ng-disabled": "!$ctrl.hasChanges || $ctrl.inlineEditing",
				tabindex: -1
			});

			let axSpinner = createElement('ax-i-spinner',
				{
					"i-class": "fa fa-check",
					"i-height": "16",
					'has-callback': true,
					style: "margin-right:3px;",
					config: "$ctrl.$spinners.applyOrder",
					action: "$ctrl.applyOrderToChanges(removeSpinner)"
				}, null, button);
			//button.innerHTML += this.source.innerHTML || "Apply";
			if (dataTableTemplate.attributes['show-commands-tooltips']) button.setAttribute('uib-tooltip', dataTableTemplate.getMessage('toolbar', 'apply'));
			container.appendChild(button);
		}
		if (dataTableTemplate.attributes["edit-row"] === "editor") {
			let editPopup = createElement("button",
				{
					class: "btn icon fa fa-edit",
					tabindex: -1,
					ngDisabled: "$ctrl.$$grid.$$editor.opened",
					"ng-click": "$ctrl.$$grid.$$editor.open()"
				});
			if (dataTableTemplate.attributes["show-commands-tooltips"]) editPopup.setAttribute("uib-tooltip", "Show editor for add/change/delete records");
			container.appendChild(editPopup);
		}
		return container;
	}

}

