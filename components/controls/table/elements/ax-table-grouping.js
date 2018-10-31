class axTableGrouping extends axElement {
	/**
	 *
	 * @param {axTableTemplate} dataTableTemplate
	 */
	constructor(dataTableTemplate) {
		super();
		this.template = dataTableTemplate;
		//this.controller = this.template.controller; nu exista controller la momentul initializarii
		this.elements = {
			toggleShow: createElement("i",
				{
					class: "btn icon fa group-toggle-show",
					'ng-class': "{'fa-caret-down': !dataItem.collapsed, 'fa-caret-right':dataItem.collapsed}",
					'ng-click': "$ctrl.groupToggleShow(dataItem)"
				}),
			counter: createElement('div', {'ng-bind': "dataItem.groupRecords", class: "group-records-count"}),
			headerLabel: createElement('div', {'ng-bind': "dataItem.headerLabel", class: "group-label"}),
			footerLabel: createElement('div', {'ng-bind': "dataItem.footerLabel", class: "group-label"}),
			groupValue: createElement('div', {'ng-bind': "dataItem.value", class: "group-value"}),
			groupFilterCurrent: createElement('i', {
				ngClick: "$ctrl.filterByGroup(dataItem,$event)",
				class: "btn group-filter",
				uibTooltip: "{{!dataItem.filter ? 'Filter records by current group':'Remove filter by current group'}}",
				ngClass: "{'fa fa-filter': !dataItem.filter, 'fa fa-eraser': dataItem.filter}"
			}),
			groupFilter: createElement("ax-dropdown-popup",
				{
					tabindex: -1,
					style: "margin-left:5px",
					"btn-class": "btn icon group-filter",
					"caret-class": "fa fa-filter",
					"popup-max-height": '100%',
					"close-on-blur": "true",
					"close-on-escape": "true",
					"popup-width": "auto",
					"popup-relative-top": "1px",
					"ng-disabled": "$ctrl.inlineEditing",
					"open-params": "$parent.dataItem",
					"template-url": "'components/controls/table/templates/ax-table-groups-filter.html'",
					ctrl: "$ctrl.$dropdowns.groupsFilter"
				})
		};
	}

	getLevelZeroGroup() {
		var group = createElement("ax-group", {
			expression: "true",
			"label": "All records",
			collapsible: false,
			collapsed: false,
			allLevelsCalculations: true,
		});
		return group;
	}

	createAxGroupTemplate(groupDef, axGroups) {
		let axGroup = $(createElement('ax-group',
			{
				expression: groupDef.expression,
				order: groupDef.order,
				label: groupDef.label,
				collapsible: groupDef.collapsible,
				collapsed: groupDef.collapsed,
				showCalculationsOn: groupDef.showCalculationsOn,
				allLevelsCalculations: groupDef.allLevelsCalculations
			}));
		if (groupDef.groupValueExpression)
			axGroup.setAttribute('group-value-expression', groupDef.groupValueExpression);
		if (groupDef.dataItemGroupField)
			axGroup.setAttribute('dataitem-group-field', groupDef.dataItemGroupField);
		if (groupDef.dataItemIndexField)
			axGroup.setAttribute('dataitem-index-field', groupDef.dataItemIndexField);
		if (groupDef.draggable) axGroup.setAttribute('draggable', groupDef.draggable);
		if (groupDef.draggableIsDisabled)
			axGroup.setAttribute('draggable-is-disabled', groupDef.draggableIsDisabled);

		if (groupDef.showCalculationsOn) axGroup.setAttribute('show-calculations-on', groupDef.showCalculationsOn);
		if (groupDef.collapsed) axGroup.setAttribute('collapsed', groupDef.collapsed);
		if (groupDef.header.show) {
			let header = angular.element(createElement("ax-group-header", {
				backgroundColor: groupDef.header.backgroundColor,
				labelIndent: groupDef.header.labelIndent,
				label: groupDef.header.label,
				showLabel: groupDef.header.showLabel,
				showValue: groupDef.header.showValue,
				showCounter: groupDef.header.showCounter,
				showFilter: groupDef.header.showFilter,
				show: groupDef.header.show
			}));
			if (groupDef.header.displayType === "Full row width") {
				if (groupDef.header.customDisplay.length > 0) {
					let customDisplay = groupDef.header.customDisplay;
					customDisplay.setAttribute("showToggleCollapsed", groupDef.header.showToggleCollapsed);
					customDisplay.setAttribute("labelIndent", groupDef.header.labelIndent);
					customDisplay.setAttribute("showLabel", groupDef.header.showLabel);
					customDisplay.setAttribute("showCounter", groupDef.header.showCounter);
					customDisplay.setAttribute("showFilter", groupDef.header.showFilter);
					header.appendChild(customDisplay);
				}
			} else {
				let column = groupDef.header.def.find(">ax-group-column[show-value=true]");
				if (column.length === 0) groupDef.header.def.appendChild(createElement("ax-group-column", {
					columnFor: groupDef.header.displayColumn,
					showValue: true,
					showLabel: groupDef.header.showLabel,
					showCounter: groupDef.header.showCounter,
					showFilter: groupDef.header.showFilter,
				}));
				else {
					column.setAttribute("columnFor", groupDef.header.displayColumn);
					column.setAttribute("showLabel", groupDef.header.showLabel);
					column.setAttribute("showValue", true);
					column.setAttribute("showCounter", groupDef.header.showCounter);
					column.setAttribute("showFilter", groupDef.header.showFilter);
				}
				groupDef.header.def.find(">ax-group-column").each(function (i, column) {
					header.appendChild(column);
				});
			}
			axGroup.appendChild(header);
		}
		let footer = angular.element(createElement("ax-group-footer", {
			backgroundColor: groupDef.footer.backgroundColor,
			labelIndent: groupDef.footer.labelIndent,
			label: groupDef.footer.label,
			showLabel: groupDef.footer.showLabel,
			showValue: groupDef.footer.showValue,
			showCounter: groupDef.footer.showCounter,
		}));
		if (groupDef.footer.displayType === "Full row width") {
			if (groupDef.footer.customDisplay.length > 0) {
				let customDisplay = groupDef.footer.customDisplay;
				customDisplay.setAttribute("labelIndent", groupDef.footer.labelIndent);
				customDisplay.setAttribute("showLabel", groupDef.footer.showLabel);
				customDisplay.setAttribute("showValue", groupDef.footer.showValue);
				customDisplay.setAttribute("showCounter", groupDef.footer.showCounter);
				footer.appendChild(customDisplay);
			}
		} else {
			let column = groupDef.footer.def.find(">ax-group-column[show-value=true]");
			if (column.length === 0) {
				if (groupDef.footer.displayColumn) groupDef.footer.def.appendChild(createElement("ax-group-column", {
					columnFor: groupDef.footer.displayColumn,
					showValue: true,
					showLabel: groupDef.footer.showLabel,
					showCounter: groupDef.footer.showCounter,
				}));
			} else {
				column.setAttribute("columnFor", groupDef.footer.displayColumn);
				column.setAttribute("showLabel", groupDef.footer.showLabel);
				column.setAttribute("showValue", true);
				column.setAttribute("showCounter", groupDef.footer.showCounter);
			}
			groupDef.footer.def.find(">ax-group-column").each(function (i, column) {
				footer.appendChild(column);
			});
		}
		axGroup.appendChild(footer);

		axGroup.setAttribute("all-levels-calculations", groupDef.allLevelsCalculations);
		if (!groupDef.allLevelsCalculations) {
			for (let calculationName in groupDef.calculations) {
				let calculation = groupDef.calculations[calculationName];
				createElement("ax-calculation", {
					name: calculationName,
					"column": calculation.column,
					"show-on": calculation.showOn,
					"display-label": calculation.displayLabel,
					expression: calculation.expression,
					"initial-value": calculation.initialValue,
					"aggregate-type": calculation.type
				}, calculation.template, axGroup);
			}
		}
		axGroups.appendChild(axGroup[0]);
	}

	createAxGroupsTemplate($controller, grouping) {
		$controller.groups.defs = grouping.data;
		var element = $controller.element.initial;
		var axGroups = createElement("ax-groups");
		$controller.groups.defs.each(function (groupDef) {
			this.createAxGroupTemplate(groupDef, axGroups);
		}, this);
		element.appendChild(axGroups);
		let axAllLevelsCalculations = createElement('ax-all-levels-calculations', {showOn: grouping.showCalculationsOn});
		let itemsCnt = 0;
		let calculations = {children: []};
		for (let calcName in grouping.allLevelsCalculations) {
			let calculationDef = grouping.allLevelsCalculations[calcName];
			let calculation = createElement("ax-calculation", {
				name: calculationDef.name,
				"column": calculationDef.column,
				"display-label": calculationDef.displayLabel,
				expression: calculationDef.expression,
				"initial-value": calculationDef.initialValue,
				"aggregate-type": calculationDef.type
			}, calculationDef.template, axAllLevelsCalculations);
			itemsCnt++;
		}
		if (itemsCnt > 0) {
			axGroups.appendChild(axAllLevelsCalculations);
		}
		element.find(">ax-groups").remove();
		element[0].innerHTML += axGroups.outerHTML;
	}

	addAllRecordsColumn(data) {
		let column = {
			title: "All records",
			bindTo: "true",
			canView: true,
			hideable: false,
			hidden: false,
			index: -1
		};
		data.splice(0, 0, column);
		return data;
	}

	createGroupFromColumn(column, level) {
		let headerIndent = level > 0 && column.bindTo === "true" ? (level - 1) * 20 : level * 20;
		let expression = column.bindTo !== "true" ? "dataItem[\"" + column.bindTo + "\"]" : "true";
		return {
			collapsible: column.bindTo !== "true" ? true : false,
			collapsed: column.bindTo !== "true",
			expression: column.bindTo !== "true" ? "dataItem[\"" + column.bindTo + "\"]" : "true",
			order: column.bindTo !== "true" ? (column.invariantField || column.bindTo) : "",
			label: column.title,
			header: {
				show: column.bindTo !== "true",
				def: angular.element(createElement("ax-group-header", {
					backgroundColor: "rgb(239, 237, 237)",
					labelIndent: headerIndent,
				})),
				displayType: "Full row width",
				label: column.title,
				backgroundColor: "rgb(239, 237, 237)",
				labelIndent: headerIndent,
				showLabel: true,
				showValue: column.bindTo !== "true",
				showToggleCollapsed: column.bindTo !== "true",
				showCounter: false,
				showFilter: column.bindTo !== "true",
				customDisplay: [],
				columnsCalculations: [],
				columns: [],
				template: angular.element("xx")
			},
			footer: {
				show: false,
				displayType: "Full row width",
				label: column.title,
				backgroundColor: "rgb(255, 255, 255)",
				labelIndent: 200 + headerIndent,
				showLabel: true,
				showValue: column.bindTo !== "true",
				showCounter: false,
				customDisplay: [],
				columnsCalculations: [],
				columns: [],
				template: angular.element("xx")
			},
			showCalculationsOn: column.bindTo !== "true" ? "header" : "both",
			allLevelsCalculations: true,
			calculationType: "All levels",
			level: level,
		};
	}

	getGroupsDefs(template) {
		var controller = template ? template.controller : (this.controller = this.template.controller);
		template = template || this.template;
		var source = $(template.element.source);
		var self = this;
		var groups = this.getDirectChildrenOfType("ax-groups", source[0]);
		var level = 0;
		if (groups.length === 0) {
			groups = [];
			groups.push(createElement('ax-groups', {}));
		}
		if ($(groups).find('>ax-group').length === 0) groups[0].appendChild(this.getLevelZeroGroup());

		var allLevelsCalculations;
		groups[0].children.each(function (item) {
			if (item.tagName !== "AX-ALL-LEVELS-CALCULATIONS") return;
			allLevelsCalculations = item;
			return false;
		}, this);
		var ordersBy = [];
		controller.groups = {
			defs: [],
		};
		controller.groups.showCalculationsOn = "header";
		if (allLevelsCalculations) {
			controller.groups.showCalculationsOn = allLevelsCalculations.getAttribute("show-on") || "header";
			let group = {calculations: controller.groups.allLevelsCalculations = {}};
			allLevelsCalculations.children.each(function (calculation, index) {
				calculation.removeAttribute("show-on");
				self.readCalculation(index, calculation, source, group, null, allLevelsCalculations);
			}, this);
		}

		controller.hasCollapsibleGroup = false;
		var columns = source.find(">ax-column");
		let first = true;
		groups[0].children.each(function (item) {
			if (item.tagName !== "AX-GROUP") return;
			var expression = item.getAttribute('expression');
			if (expression === "true" && !first) console.error("All records group must be first group");
			if (expression !== "true" && first) first = false;
			let header = angular.element(item).find(">ax-group-header");
			let footer = angular.element(item).find(">ax-group-footer");
			let groupCalculations = angular.element(item).find(">ax-calculation");
			// console.log(item, groupCalculations);
			var group = {
				level: level,
				def: item,
				expression: item.getAttribute('expression'),
				collapsible: item.hasAttribute('collapsible') ? item.getAttribute('collapsible') !== "false" : (expression !== "true" ? true : false),
				collapsed: item.getAttribute('collapsed') === "true",
				order: item.getAttribute('order') || item.getAttribute('order-by') || "",
				draggable: item.getAttribute('draggable'),
				draggableIsDisabled: item.getAttribute('draggable-is-disabled'),
				label: expression === "true" ? "All records" : (item.getAttribute('label') || expression),
				header: {columnsCalculations: [], columns: [], template: header.find("xx")},
				footer: {columnsCalculations: [], columns: [], template: footer.find("xx"), customDisplay: footer.find("xx"), label: footer.attr('label') || item.getAttribute('label') || expression, labelIndent: 200},
				allLevelsCalculations: allLevelsCalculations && item.getAttribute('all-levels-calculations') !== "false" && groupCalculations.length===0 ,
				calculations: {},
			};
			group.calculationType = group.allLevelsCalculations ? "All levels" : "This level";
			if (header.length > 0) {
				group.header = {
					def: header,
					show: header[0].hasAttribute('show') ? header.attr('show') === "true" : (expression !== "true"),
					customDisplay: header.find(">ax-group-display"),
					columns: header.find(">ax-group-column"),
					label: header.attr('label') || item.getAttribute('label') || expression,
					labelIndent: parseInt(header.attr('label-indent') || 0),
					backgroundColor: header.attr('background-color') || "rgb(239, 237, 237)",
					showLabel: header.getAttribute("show-label") !== "false",
					showValue: header.getAttribute("show-value") !== "false",
					showToggleCollapsed: header.getAttribute("show-toggle-collapsed") !== "false" && group.collapsible,
					showCounter: header.getAttribute("show-counter") !== "false",
					showFilter: header.getAttribute("show-filter") !== "false",
					template: header.find("xx"),
					columnsCalculations: []
				};
				if (group.header.customDisplay.length > 0) {
					group.header.label = "Group header is defined as custom html by developer";
					group.header.labelIndent = parseInt(group.header.customDisplay.getAttribute("label-indent") || group.header.labelIndent);
					group.header.showLabel = false;
					group.header.showValue = group.header.customDisplay.getAttribute("show-value") !== "false";
					group.header.showToggleCollapsed = group.header.customDisplay.getAttribute("show-toggle-collapsed") === "true" && group.collapsible;
					group.header.showCounter = group.header.customDisplay.getAttribute("show-counter") === "true";
					group.header.showFilter = group.header.customDisplay.getAttribute("show-filter") === "true";
					if (group.header.columns.length > 0) console.error("You cannot have in same time ax-group-display (for 'Full row width' - group header) template and ax-group-column templates!");
				} else if (group.header.columns.length > 0) {
					let headerGroupValueColumn = "";
					group.header.columns.each(function (i, axGroupColumn) {
						let columnDef = $(axGroupColumn);
						let columnFor = columnDef.getAttribute("columnFor");
						if (!columnFor) console.error("ax-group-column must has column-for attribute ", axGroupColumn);

						let axColumn = source.find('>ax-column[header="' + columnFor + '"]');
						if (axColumn.length === 0) console.error("ax-group-column must has column-for attribute with an existing header", axGroupColumn);

						if (axColumn.hasAttribute("hidden-column")) {
							axColumn.removeAttribute("hidden-column");
							axColumn.setAttribute("hideable", false);
						}
						if (columnDef.getAttribute("showValue") !== "true") return true;
						if (!columnDef.hasAttribute("label-indent") && group.header.labelIndent) columnDef.setAttribute("label-indent", group.header.labelIndent);
						group.header.displayColumn = columnFor;
						group.header.showValue = columnDef.getAttribute("showValue") !== "false";
						group.header.showLabel = columnDef.getAttribute("showLabel") === "true";
						group.header.showToggleCollapsed = columnDef.getAttribute("showToggleCollapsed") === "true" && group.collapsible;
						group.header.showCounter = columnDef.getAttribute("showCounter") === "true";
						group.header.showFilter = columnDef.getAttribute("showFilter") === "true";

					});
				} else {
					let orderColumn = group.order.startsWith("-") ? group.order.substring(1) : group.order;
					if (["dataItem[\"" + orderColumn + "\"]", "dataItem." + orderColumn].includes(group.expression)) {
						let column = source.find('>ax-column[bind-to="' + orderColumn + '"]');
						if (column.length > 0) {
							if (column.find(">ax-column-view").length > 0) {
								if (column.find(">ax-column-view").hasAttribute("date-format")) {
									let template = createElement("ax-group-display", {showFilter: group.showFilter, showToggleCollapsed: group.showToggleCollapsed});
									createElement("div", {
										class: "group-value",
										ngBind: "::dataItem.value|date:'" + column.find(">ax-column-view")[0].getAttribute("date-format") + "'"
									}, "", template);
									group.header.customDisplay = $(template);
								}
							} else if (column.hasAttribute("date-format")) {
								let template = createElement("ax-group-display", {showFilter: group.showFilter, showToggleCollapsed: group.showToggleCollapsed});
								createElement("div", {
									class: "group-value",
									ngBind: "::dataItem.value|date:'" + column.getAttribute("date-format") + "'"
								}, "", template);
								group.header.customDisplay = $(template);
							}
						}
					}
				}
			}
			else {
				group.header = {
					show: expression !== "true",
					def: angular.element(createElement("ax-group-header", {
						backgroundColor: "rgb(239, 237, 237)",
						labelIndent: level * 20,
					})),
					label: item.getAttribute('label') || expression,
					showLabel: expression !== "true",
					showValue: expression !== "true",
					showToggleCollapsed: group.collapsible && expression !== "true",
					showCounter: expression !== "true",
					showFilter: expression !== "true",
					customDisplay: [],
					columnsCalculations: [],
					columns: [],
					template: header.find("xx")
				};
			}
			group.header.displayType = group.header.columns.length > 0 ? "Show on column:" : "Full row width";
			if (footer.length > 0) {
				group.footer = {
					show: false,
					def: footer,
					customDisplay: footer.find(">ax-group-display"),
					columns: footer.find(">ax-group-column"),
					label: footer.attr('label') || item.getAttribute('label') || expression,
					labelIndent: parseInt(footer.attr('label-indent') || 0),
					backgroundColor: footer.getAttribute('background-color') || "rgb(255, 255, 255)",
					showLabel: footer.getAttribute("show-label") !== "false",
					showValue: footer.getAttribute("show-value") !== "false" && expression !== "true",
					showCounter: footer.getAttribute("show-counter") !== "false",
					template: footer.find("xx"),
					columnsCalculations: []
				};
				if (group.footer.customDisplay.length > 0) {
					group.footer.label = "Group footer is defined as custom html by developer";
					group.footer.labelIndent = parseInt(group.footer.customDisplay.getAttribute("label-indent") || 200);
					group.footer.showLabel = false;
					group.footer.showValue = group.footer.customDisplay.getAttribute("show-value") !== "false" && expression !== "true";
					group.footer.showCounter = group.footer.customDisplay.getAttribute("show-counter") === "true";
					if (group.footer.columns.length > 0) console.error("You cannot have in same time ax-group-display (for 'Full row width' - group footer) template and ax-group-column footer templates!");
				} else if (group.footer.columns.length > 0) {
					group.footer.show = true;
					let footerGroupValueColumn = "";
					group.footer.columns.each(function (i, axGroupColumn) {
						let columnDef = $(axGroupColumn);
						let columnFor = columnDef.getAttribute("columnFor");
						if (!columnFor) console.error("ax-group-column must has column-for attribute ", axGroupColumn);
						let axColumn = source.find('>ax-column[header="' + columnFor + '"]');
						if (axColumn.length === 0) console.error("ax-group-column must has column-for attribute width an existing header", axGroupColumn);

						if (axColumn.hasAttribute("hidden-column")) {
							axColumn.removeAttribute("hidden-column");
							axColumn.setAttribute("hideable", false);
						}
						if (columnDef.getAttribute("showValue") !== "true") return true;
						if (!columnDef.hasAttribute("label-indent") && group.footer.labelIndent) columnDef.setAttribute("label-indent", group.footer.labelIndent);
						group.footer.displayColumn = columnFor;
						group.footer.showValue = columnDef.getAttribute("showValue") !== "false";
						group.footer.showLabel = columnDef.getAttribute("showLabel") === "true";
					});
				}
			} else {
				group.footer = {
					show: false,
					def: angular.element(createElement("ax-group-footer", {
						backgroundColor: "rgb(255, 255, 255)",
						labelIndent: 200 + level * 20,
					})),
					label: item.getAttribute('label') || expression,
					showLabel: true,
					showValue: expression !== "true",
					showCounter: expression !== "true",
					customDisplay: [],
					columnsCalculations: [],
					columns: [],
					template: header.find("xx")
				};
			}
			group.footer.displayType = group.footer.columns.length > 0 ? "Show on column:" : "Full row width";
			if (item.hasAttribute("show-calculations-on")) {
				group.showCalculationsOn = item.getAttribute("show-calculations-on");
				if (["header", "both"].includes(group.showCalculationsOn) && (group.allLevelsCalculations ? allLevelsCalculations : $(item).find("ax-calculation").length > 0))
					group.header.show = true;
				if (["footer", "both"].includes(group.showCalculationsOn)) group.footer.show = true;
			}
			else group.showCalculationsOn = controller.groups.showCalculationsOn || "header";
			if (item.hasAttribute("show-header-on-column")) {
				group.showHeaderOnColumn = item.getAttribute("show-header-on-column");
				let column = source.find(">ax-column[header='" + group.showHeaderOnColumn + "']");
				let columnIndex = column.length === 1 ? column[0].getAttribute("column-index") : -1;
				if (columnIndex === -1) console.error("You need to set a column with an existing header: " + group.showHeaderOnColumn + " for show-header-column group " + group.expression);
				group.showHeaderOnColumnIndex = parseInt(columnIndex);
			}

			if (group.collapsible) controller.hasCollapsibleGroup = true;
			var orders = group.order ? group.order.split(',') : [];
			for (let i in orders) {
				if (orders.hasOwnProperty(i)) {
					ordersBy.push(orders[i]);
					if (group.hideColumns === "true") {
						template.forEachColumn(function (column) {//jshint ignore:line
							if (column.getAttribute("bind-to") === orders[i]) column.setAttribute("hidden-column", "group-" + level);
							if (column.getAttribute("sortable") === orders[i]) column.setAttribute("hidden-column", "group-" + level);
						});
					}
				}
			}
			if (allLevelsCalculations && group.allLevelsCalculations) {
				angular.element(item).find("ax-calculations").remove();
				axElement.addChildren(item, allLevelsCalculations);
			}
			angular.element(item).find(">ax-calculation").each(function (index, calculation) {
				self.readCalculation(index, calculation, source, group, item, allLevelsCalculations);
			});
			if (group.footer.columnsCalculations.length > 0) group.footer.show = true;
			controller.groups.defs.push(group);
			level++;
		}, this);
		if (controller.groups.defs.length > 0) controller.groups.defs[controller.groups.defs.length - 1].lastLevel = true;
		let leftCalculationsColumn = template.columnsNo + 1;
		controller.groups.defs.each(function (group) {
			group.header.columnsCalculations.each(function (column) {
				leftCalculationsColumn = Math.min(leftCalculationsColumn, parseInt(column));
			}, this);
			group.footer.columnsCalculations.each(function (column) {
				leftCalculationsColumn = Math.min(leftCalculationsColumn, parseInt(column));
			}, this);
		}, this);
		controller.groups.leftCalculationsColumn = leftCalculationsColumn;
		let leftVisibleColumns = 0;
		columns.each(function (i, column) {
			//console.log(column, leftCalculationsColumn);
			if (parseInt(column.getAttribute("column-index")) >= leftCalculationsColumn) return false;
			leftVisibleColumns += column.hasAttribute("hidden-column") && column.getAttribute("hidden-column") !== "false" ? 0 : 1;
		});
		if (leftVisibleColumns === 0 && source.find(">ax-column[header=Grouping]").length > 0) {
			source.find(">ax-column[header=Grouping]").removeAttribute("hidden-column");
		}

		template.attributes['groups-order-by'] = ordersBy.join(',');
		controller.attrs.groupsOrderBy = ordersBy.join(',');
		var orders = template.attributes['order-by'].split(',');
		for (let i = 0; i < orders.length; i++) {
			if (ordersBy.indexOf(orders[i]) > -1) continue;

			ordersBy.push(orders[i]);
		}
		template.attributes['order-by'] = ordersBy.join(',');
		//if (template.attributes.debug === "true") console.log("controller get groups", controller.groups, template.attributes['order-by']);
	}

	readCalculation(index, calculation, source, group, item, allLevelsCalculations) {
		let columnHeader = calculation.getAttribute("column");
		if (!calculation.hasAttribute("show-on") && item !== null) {
			if (item.getAttribute("show-calculations-on")) calculation.setAttribute("show-on", item.getAttribute("show-calculations-on"));
			else if (allLevelsCalculations && allLevelsCalculations.getAttribute("show-on")) calculation.setAttribute("show-on", allLevelsCalculations.getAttribute("show-on"));
		}
		// if (!columnHeader) throw "Calculation must have column attribute with header column where is shown.";
		if (!calculation.hasAttribute("aggregate-type")) throw "calculation must have aggregate-type attribute with one of these values=sum!";
		let column = source.find(">ax-column[header=\"" + columnHeader + "\"]");
		let columnIndex = column.length === 1 ? column[0].getAttribute("column-index") : -1;
		if (columnIndex === -1 && (!calculation.hasAttribute("name") || calculation.getAttribute("show-on") !== "false")) {
			console.warn("You need to set a column with an existing header: " + columnHeader + " for calculation: " + calculation.outerHTML);
			return;
		}
		//daca nu generez calculatii pt. coloanele ascunse, atunci cand vor fi afisate din columnsLayout, nu vor avea totaluri;
		////if (calculation.getAttribute("show-on") !== "false" && column.hasAttribute("hidden-column") && column.getAttribute("hidden-column") !== "false") return;
		let id = calculation.getAttribute("name");
		if (!id) {
			id = column[0].getAttribute("bind-to") + "-" + columnIndex;
			calculation.setAttribute("name", id);
		}
		if (group.calculations[id]) throw "Already exist a calculation with name " + id;
		if (!calculation.hasAttribute("expression") && calculation.getAttribute("aggregate-type") !== "custom") calculation.setAttribute("expression", "dataItem[\"" + column[0].getAttribute("bind-to") + "\"]");
		if (!calculation.hasAttribute("initial-value") && calculation.getAttribute("aggregate-type") !== "custom") calculation.setAttribute("initial-value", "0");
		if (calculation.getAttribute("aggregate-type") === "custom" && !calculation.hasAttribute("aggregate-obj")) throw "For custom aggregate-type you must provide an aggregate-obj attribute with reference to a calculation object";
		group.calculations[id] = {
			name: id,
			column: columnHeader,
			columnIndex: parseInt(columnIndex),
			index: parseInt(columnIndex) * 100 + index,
			showOn: calculation.getAttribute("show-on"),
			displayLabel: calculation.getAttribute("display-label") === "false" ? "false" : (calculation.getAttribute("display-label") || calculation.getAttribute("aggregate-type")),
			expression: calculation.getAttribute("expression"),
			initialValue: calculation.getAttribute("initial-value"),
			type: calculation.getAttribute("aggregate-type")
		};
		if (angular.element(calculation).find(">ax-calculation-result").length > 0) group.calculations[id].template = angular.element(calculation).find(">ax-calculation-result")[0].outerHTML;
		if (calculation.hasAttribute("aggregate-obj")) group.calculations[id].aggregateDef = calculation.getAttribute("aggregate-obj");
		if (["header", "both"].indexOf(calculation.getAttribute("show-on")) > -1) group.header.columnsCalculations.push(columnIndex);

		if (["footer", "both"].indexOf(calculation.getAttribute("show-on")) > -1) group.footer.columnsCalculations.push(columnIndex);
		if (calculation.getAttribute("show-on") === "header" && group.header.show === "false") console.warn("If ax-group-header show attribute is set to false, calculations with show-on = header will not be shown!");

	}

	generateGroupingTemplates() {
		var groups = this.controller.groups.defs;
		for (let i = 0; i < groups.length; i++) {
			let group = groups[i];
			if (group.header.show) {
				if (group.header.columns.length > 0) this.createColumnsHeaderTemplate(group);
				else this.createFullRowHeaderTemplate(group);
			}
			if (group.footer.columns.length > 0) this.createColumnsFooterTemplate(group);
			else if (group.footer.columnsCalculations.length > 0) this.createFooterTemplate(group);
		}
	}

	getCalculationsForColumn(column, group) {
		var calcIds = Object.keys(group.calculations);
		var calculations = [];
		for (let i = 0; i < calcIds.length; i++) {
			let calculation = group.calculations[calcIds[i]];
			if (calculation.showOn !== "false" && calculation.column === column) calculations.push(calculation);
		}
		return calculations.length > 0 ? calculations : false;
	}

	getGroupColumnFor(location, columnHeader, group) {
		let column = false;
		group[location].columns.each(function (i, columnDef) {
			if (columnDef.getAttribute("column-for") !== columnHeader) return true;
			column = columnDef;
			return false;
		});
		return column;
	}

	getAggColumnTemplate(columnIndex, calculations, type) {
		let columnDef = this.controller.columns.defs[columnIndex];
		let bindTo = columnDef.getAttribute("bind-to");
		let name = bindTo + "-" + columnIndex;
		let columnTemplate = "";
		let attributes = {class: type + "-calculation"};
		for (let i = 0; i < calculations.length; i++) {
			let calculation = calculations[i];
			let label = calculation.displayLabel === "false" ? "" : calculation.displayLabel;
			let template = "";
			let calcClass = columnDef.getAttribute("header").urlAccepted() + "-" + label.urlAccepted();
			if (columnTemplate !== "") columnTemplate += "<div class='calculation-separator'></div>";
			if (calculation.template) {
				let element = angular.element(calculation.template);
				element.addClass(type + "-calculation");
				template = element[0].outerHTML;
			} else if (calculation.name1 === name && ["sum", "min", "max"].indexOf(calculation.type) > -1) {
				let columnView = angular.element(columnDef).find(">ax-column-view");
				template = new axTableColumnView(columnView[0], this.controller, columnDef);
				template.style["min-width"] = "";
				template.style.width = "100%";
				template.addClass(calcClass + " calculation-result");
				if (template.children.length > 0) template.children[0].style.padding = 0;
				template = (label ? `<div class="calculation-label">` + label + `</div>` : ``) +
					template.outerHTML
						.replaceAll("dataItem", "dataItem.calculations")
						.replaceAll("'" + bindTo + "'", "\"" + name + "\"")
						.replaceAll('"' + bindTo + '"', '"' + name + '"')
						.replaceAll("::", "");
			} else {
				template = (label ? `<div class="calculation-label">` + label + `</div>` : ``) +
					`<div class="calculation-result ` + calcClass + `">{{dataItem.calculations[\"` + calculation.name + `\"].toLocaleString(\"` + axNumberFormat.locale + `\")}}</div>`;
			}
			columnTemplate += template;

		}
		// console.log(columnTemplate);
		return createElement("ax-group-" + type + "-column", attributes, columnTemplate);
	}

	createColumnsHeaderTemplate(group) {
		let header = createElement("ax-group-header-template", {"auto": "true"});
		var columns = this.controller.columns.hideable;
		let columnsNo = this.template.columnsNo - (this.controller.hasEmptyColumn ? 1 : 0);
		let leftFreezedColumns = Math.min(this.controller.attrs.leftFreezedColumns, columnsNo);
		let rightFreezedColumns = this.controller.attrs.rightFreezedColumns;
		let rightFreezedIndex = rightFreezedColumns < columnsNo ? columnsNo - rightFreezedColumns : columnsNo;


		let groupColumn, lastFreezedColumn;
		for (let i = 0; i < columnsNo; i++) {
			let column = columns[i];
			let groupColumn = this.getGroupColumnFor("header", column.title, group);
			if (groupColumn) {
				let template = angular.element(groupColumn);
				let html = groupColumn.innerHTML;
				if (groupColumn.hasAttribute("ng-bind")) console.error("ngBind attribute is incompatible with adding default group header elements.Please use innerHTML for html content. Error for: " + groupColumn.outerHTML);
				if (group.collapsible && groupColumn.getAttribute("show-toggle-collapsed") !== "false") {
					html = this.elements.toggleShow.outerHTML + html;
				}
				if (template.getAttribute("show-label") === "true") html += this.elements.headerLabel.outerHTML;
				if (template.getAttribute("show-value") !== "false" && group.expression !== "true") html += this.elements.groupValue.outerHTML;
				if (template.hasNonFalseAttribute("show-counter")) html += this.elements.counter.outerHTML;
				if (template.hasNonFalseAttribute("show-filter")) html += this.elements.groupFilter.outerHTML;
				if (template.hasAttribute("label-indent")) groupColumn.style["padding-left"] = template.getAttribute("label-indent") + 'px';

				groupColumn = createElement("ax-group-header-column", groupColumn.attributes, html);
				groupColumn.setAttribute("column-index", i);
			} else if (group.header.columnsCalculations.indexOf(i.toString()) > -1) {
				let calculation = this.getCalculationsForColumn(column.title, group);
				groupColumn = this.getAggColumnTemplate(i, calculation, "header");
				groupColumn.setAttribute("column-index", i);
			}
			else {
				groupColumn = createElement("ax-group-header-column", {class: "group-header-column", columnIndex: i});
				createElement('div', {}, "", groupColumn);
			}
			if (i < leftFreezedColumns) groupColumn.setAttribute("left-freezed-column", "body");
			else if (i >= rightFreezedIndex) groupColumn.setAttribute("right-freezed-column", "body");
			if (i < leftFreezedColumns) lastFreezedColumn = groupColumn;
			groupColumn.addClass("group-column");
			header.appendChild(groupColumn);
		}
		if (lastFreezedColumn) lastFreezedColumn.addClass("last-column");

		if (this.controller.hasEmptyColumn) {
			groupColumn = createElement("ax-group-header-column", {class: "ax-group-header-column last-column empty-column", columnIndex: columnsNo});
			createElement('div', {}, "", groupColumn);
			header.appendChild(groupColumn);
		}
		group.header.template = angular.element(header);
	}

	createColumnsFooterTemplate(group) {
		let footer = createElement("ax-group-footer-template", {"auto": "true"});
		var columns = this.controller.columns.hideable;
		let columnsNo = this.template.columnsNo - (this.controller.hasEmptyColumn ? 1 : 0);
		let leftFreezedColumns = Math.min(this.controller.attrs.leftFreezedColumns, columnsNo);
		let rightFreezedColumns = this.controller.attrs.rightFreezedColumns;
		let rightFreezedIndex = rightFreezedColumns < columnsNo ? columnsNo - rightFreezedColumns : columnsNo;

		let groupColumn, lastFreezedColumn;
		for (let i = 0; i < columnsNo; i++) {
			let column = columns[i];
			let groupColumn = this.getGroupColumnFor("footer", column.title, group);
			if (groupColumn) {
				let template = angular.element(groupColumn);
				let html = groupColumn.innerHTML;
				if (groupColumn.hasAttribute("ng-bind")) console.error("ngBind attribute is incompatible with adding default group header elements.Please use innerHTML for html content. Error for: " + groupColumn.outerHTML);
				if (template.getAttribute("show-label") === "true") html += this.elements.footerLabel.outerHTML;
				if (template.getAttribute("show-value") !== "false" && group.expression !== "true") html += this.elements.groupValue.outerHTML;
				if (template.hasNonFalseAttribute("show-counter")) html += this.elements.counter.outerHTML;

				groupColumn = createElement("ax-group-footer-column", groupColumn.attributes, html);
				if (template.hasAttribute("label-indent")) groupColumn.style["padding-left"] = template.getAttribute("label-indent") + 'px';
				groupColumn.setAttribute("column-index", i);
			} else if (group.footer.columnsCalculations.indexOf(i.toString()) > -1) {
				let calculation = this.getCalculationsForColumn(column.title, group);
				groupColumn = this.getAggColumnTemplate(i, calculation, "footer");
				groupColumn.setAttribute("column-index", i);
			}
			else {
				groupColumn = createElement("ax-group-footer-column", {class: "group-footer-column", columnIndex: i});
				createElement('div', {}, "", groupColumn);
			}
			if (i < leftFreezedColumns) groupColumn.setAttribute("left-freezed-column", "body");
			else if (i >= rightFreezedIndex) groupColumn.setAttribute("right-freezed-column", "body");
			if (i < leftFreezedColumns) lastFreezedColumn = groupColumn;

			groupColumn.addClass("group-column");
			footer.appendChild(groupColumn);
		}
		if (lastFreezedColumn) lastFreezedColumn.addClass("last-column");
		if (this.controller.hasEmptyColumn) {
			groupColumn = createElement("ax-group-footer-column", {class: "ax-group-footer-column last-column empty-column", columnIndex: columnsNo});
			createElement('div', {}, "", groupColumn);
			footer.appendChild(groupColumn);
		}
		group.footer.template = angular.element(footer);
	}

	createFullRowHeaderTemplate(group) {
		if (group.showHeader === "false") return;
		var columns = this.controller.columns.hideable;
		var counter = createElement('div', {'ng-bind': "dataItem.groupRecords", class: "group-records-count"});
		var self = this;
		var paddingLeft = group.header.labelIndent;
		var createHeaderDisplay = function (group, header) {
			header.addClass("inline");
			let html = "";
			if (group.header.customDisplay.length > 0) {
				let template = group.header.customDisplay;
				header.addAttributes(template[0].attributes);
				if (group.header.showToggleCollapsed) html = self.elements.toggleShow.outerHTML;
				if (group.header.showLabel) html += self.elements.headerLabel.outerHTML;
				html += template.html();
				if (group.header.showCounter) html += self.elements.counter.outerHTML;
				if (group.header.showFilter) html += self.elements.groupFilter.outerHTML;
			} else {
				if (group.header.showToggleCollapsed) html = self.elements.toggleShow.outerHTML;
				if (group.header.showLabel) html += self.elements.headerLabel.outerHTML;
				if (group.header.showValue) html += self.elements.groupValue.outerHTML;
				if (group.header.showCounter) html += self.elements.counter.outerHTML;
				if (group.header.showFilter) html += self.elements.groupFilter.outerHTML;
			}
			header.innerHTML = html;
		};

		var createHeaderTitle = function (leftFreezedTitle, colSpan, group, header, columnIndex) {
			if (leftFreezedTitle && colSpan === 0) {
				let innerDiv = createElement("div", {});
				createHeaderDisplay(group, innerDiv);
				innerDiv.style["padding-left"] = paddingLeft + "px";
				leftFreezedTitle.appendChild(innerDiv);
				leftFreezedTitle.addClass("group-header");
				leftFreezedTitle.removeClass("empty-group-header");
				$(leftFreezedTitle).addClass("last-column");
				header.appendChild(leftFreezedTitle);
			} else if (colSpan > 0) {
				if (leftFreezedTitle) {
					$(leftFreezedTitle).addClass("last-column");
					header.appendChild(leftFreezedTitle);
				}
				let groupColumn = createElement("ax-group-header-column", {colspan: colSpan, class: "group-header"});
				let innerDiv = createElement("div", {});
				createHeaderDisplay(group, innerDiv);
				if (self.template.attributes["has-horizontal-virtual-scroll"] === "true") innerDiv.setAttribute('ng-style', "{'padding-left': ($ctrl.element.marginLeft + " + paddingLeft + ") +'px'}");
				else innerDiv.setAttribute('ng-style', "{'padding-left': ($ctrl.scrollLeft + " + paddingLeft + ") +'px'}");
				groupColumn.setAttribute("column-index", columnIndex);
				groupColumn.appendChild(innerDiv);
				header.appendChild(groupColumn);
			}
		};
		var header;

		header = createElement("ax-group-header", {"auto": "true"});
		let colSpan = 0;
		let groupTitle = true;
		let columnIndex = 0;
		let columnsNo = this.template.columnsNo - (this.controller.hasEmptyColumn ? 1 : 0);
		let leftCalculationsColumn = this.controller.groups.leftCalculationsColumn;
		let leftFreezedColumns = Math.min(this.controller.attrs.leftFreezedColumns, columnsNo);
		let rightFreezedColumns = this.controller.attrs.rightFreezedColumns;
		let rightFreezedIndex = rightFreezedColumns < columnsNo ? columnsNo - rightFreezedColumns : columnsNo;

		let leftEmptyTitle = true, lastLeftFreezedColumn;
		for (let i = 0; i < leftFreezedColumns && leftFreezedColumns > 0; i++) {
			let column = columns[i];
			colSpan++;
			if (colSpan === 1) columnIndex = i;
			if (column.hidden) continue;
			if (group.header.columnsCalculations.indexOf(i.toString()) === -1 && i < leftCalculationsColumn) continue;
			let calculation = this.getCalculationsForColumn(column.title, group);
			if (groupTitle) {
				groupTitle = false;

				let groupColumn = createElement("ax-group-header-column", {class: "group-header", "left-freezed-column": ""});
				groupColumn.setAttribute("column-index", columnIndex);
				if (colSpan > 2) groupColumn.setAttribute("colspan", colSpan - 1);
				let innerDiv = createElement("div", {});
				createHeaderDisplay(group, innerDiv);
				innerDiv.style["padding-left"] = paddingLeft + "px";
				groupColumn.appendChild(innerDiv);
				header.appendChild(groupColumn);
				columnIndex = columnIndex + colSpan - 1;
			} else if (colSpan > 1) {
				let groupColumn = createElement("ax-group-header-column", {"left-freezed-column": ""});
				if (colSpan > 2) groupColumn.setAttribute("colspan", colSpan - 1);
				groupColumn.setAttribute("column-index", columnIndex);
				let innerDiv = createElement("div", {});
				groupColumn.appendChild(innerDiv);
				header.appendChild(groupColumn);
				columnIndex = columnIndex + colSpan - 1;
			}
			leftEmptyTitle = false;
			let groupColumn = this.getAggColumnTemplate(i, calculation, "header");
			groupColumn.setAttribute("left-freezed-column", "");
			groupColumn.setAttribute("column-index", columnIndex);
			header.appendChild(groupColumn);
			colSpan = 0;
			lastLeftFreezedColumn = groupColumn;
		}
		var leftFreezedTitle;
		if (colSpan > 0) {
			leftFreezedTitle = createElement("ax-group-header-column", {"left-freezed-column": ""});
			leftFreezedTitle.setAttribute("column-index", columnIndex);
			if (colSpan > 1) leftFreezedTitle.setAttribute("colspan", colSpan);
			if (groupTitle) if (leftEmptyTitle) leftFreezedTitle.addClass("empty-group-header", "");
			else header.appendChild(leftFreezedTitle);
			colSpan = 0;
		} else if (lastLeftFreezedColumn) lastLeftFreezedColumn.addClass("last-column");
		let leftColumnIndex = columnIndex;
		let visible = 0;
		for (let i = leftFreezedColumns; i < rightFreezedIndex; i++) {
			let column = columns[i];
			colSpan++;
			if (colSpan === 1) columnIndex = i;
			if (column.hidden) continue;
			visible++;
			if (group.header.columnsCalculations.indexOf(i.toString()) === -1) continue;
			let calculation = this.getCalculationsForColumn(column.title, group);
			if (groupTitle) {
				groupTitle = false;
				createHeaderTitle(leftFreezedTitle, visible === 1 ? 0 : (colSpan - 1), group, header, visible === 1 ? leftColumnIndex : columnIndex);
				columnIndex = columnIndex + colSpan - 1;
			} else if (colSpan > 1) {
				let groupColumn = createElement("ax-group-header-column", {colspan: colSpan - 1});
				let innerDiv = createElement("div", {});
				groupColumn.setAttribute("column-index", columnIndex);
				groupColumn.appendChild(innerDiv);
				header.appendChild(groupColumn);
				columnIndex = columnIndex + colSpan - 1;
			}
			let groupColumn = this.getAggColumnTemplate(i, calculation, "header");
			groupColumn.setAttribute("column-index", columnIndex);
			header.appendChild(groupColumn);
			columnIndex = columnIndex + colSpan;
			colSpan = 0;
		}
		if (colSpan > 0) {
			if (groupTitle) {
				groupTitle = false;
				createHeaderTitle(leftFreezedTitle, colSpan, group, header, columnIndex);
				columnIndex = columnIndex + colSpan;
				if (!this.controller.hasEmptyColumn) header.children[header.children.length - 1].setAttribute("class", header.children[header.children.length - 1].getAttribute("class") + " last-column");
			} else {
				let groupColumn = createElement("ax-group-header-column", {colspan: colSpan, columnIndex: columnIndex});
				header.appendChild(groupColumn);
			}
			colSpan = 0;
		}
		if (this.controller.hasEmptyColumn) {
			let groupColumn = createElement("ax-group-header-column", {class: "last-column empty-column"});
			groupColumn.setAttribute("column-index", columnsNo);
			header.appendChild(groupColumn);
		}

		for (let i = rightFreezedIndex; i < columnsNo && rightFreezedColumns > 0; i++) {
			let column = columns[i];
			colSpan++;
			if (colSpan === 1) columnIndex = i;
			if (column.hidden) continue;
			if (group.header.columnsCalculations.indexOf(i.toString()) === -1) continue;
			let calculation = this.getCalculationsForColumn(column.title, group);
			if (colSpan > 1) {
				let groupColumn = createElement("ax-group-header-column", {"right-freezed-column": "body"});
				groupColumn.setAttribute("column-index", columnIndex);
				if (colSpan > 2) groupColumn.setAttribute("colspan", colSpan - 1);
				let innerDiv = createElement("div", {});
				groupColumn.appendChild(innerDiv);
				header.appendChild(groupColumn);
				columnIndex = columnIndex + colSpan - 1;
			}
			let groupColumn = this.getAggColumnTemplate(i, calculation, "header");
			groupColumn.setAttribute("column-index", columnIndex);
			groupColumn.setAttribute("right-freezed-column", "");
			header.appendChild(groupColumn);
			colSpan = 0;
		}
		if (colSpan > 0) {
			let groupColumn = createElement("ax-group-header-column");
			groupColumn.setAttribute("column-index", columnIndex);
			if (this.controller.attrs.rightFreezedColumns > 0) groupColumn.setAttribute("right-freezed-column", "body");
			if (colSpan > 1) groupColumn.setAttribute("colspan", colSpan);
			header.appendChild(groupColumn);
		}

		group.header.template = angular.element(header);
	}

	createFooterTemplate(group) {
		var columns = this.controller.columns.hideable;
		var paddingLeft = group.footer.labelIndent || 'dataItem.level*20';
		var self = this;
		var createFooterDisplay = function (group, footer) {
			let html = "";
			footer.addClass("inline");
			if (group.footer.customDisplay.length > 0) {
				let template = group.footer.customDisplay;
				footer.addAttributes(template[0].attributes);
				if (group.footer.showLabel) html += self.elements.footerLabel.outerHTML;
				html += template.html();
				if (group.footer.showCounter) html += self.elements.counter.outerHTML;
			} else {
				if (group.footer.showLabel) html += self.elements.footerLabel.outerHTML;
				if (group.footer.showValue) html += self.elements.groupValue.outerHTML;
				if (group.footer.showCounter) html += self.elements.counter.outerHTML;
			}
			footer.innerHTML = html;

		};
		var createFooterTitle = function (leftFreezedTitle, colSpan, group, footer, columnIndex) {
			if (leftFreezedTitle && colSpan === 0) {
				leftFreezedTitle.addClass("group-footer");
				let innerDiv = createElement("div", {});
				createFooterDisplay(group, innerDiv);
				innerDiv.style["padding-left"] = paddingLeft + "px";
				leftFreezedTitle.appendChild(innerDiv);
				leftFreezedTitle.addClass("last-column");
				footer.appendChild(leftFreezedTitle);
			} else if (colSpan > 0) {
				if (leftFreezedTitle) {
					leftFreezedTitle.addClass("last-column");
					footer.appendChild(leftFreezedTitle);
				}
				let groupColumn = createElement("ax-group-footer-column", {colspan: colSpan, class: "group-footer"});
				let innerDiv = createElement("div", {});
				createFooterDisplay(group, innerDiv);
				if (self.template.attributes["has-horizontal-virtual-scroll"] === "true") innerDiv.setAttribute('ng-style', "{'padding-left': ($ctrl.element.marginLeft + " + paddingLeft + ") +'px'}");
				else innerDiv.setAttribute('ng-style', "{'padding-left': ($ctrl.scrollLeft + " + paddingLeft + ") +'px'}");
				groupColumn.setAttribute("column-index", columnIndex);
				groupColumn.appendChild(innerDiv);
				footer.appendChild(groupColumn);
			}
		};
		let footer = createElement("ax-group-footer", {"auto": "true"}), lastLeftFreezedColumn;
		let colSpan = 0;
		let groupTitle = true;
		let columnIndex = 0;
		let columnsNo = this.template.columnsNo - (this.controller.hasEmptyColumn ? 1 : 0);
		let rightFreezedColumns = this.controller.attrs.rightFreezedColumns;
		let rightFreezedIndex = rightFreezedColumns < columnsNo ? columnsNo - rightFreezedColumns : columnsNo;

		for (let i = 0; i < this.controller.attrs.leftFreezedColumns && this.controller.attrs.leftFreezedColumns > 0; i++) {
			let column = columns[i];
			colSpan++;
			if (colSpan === 1) columnIndex = i;
			if (column.hidden) continue;
			if (group.footer.columnsCalculations.indexOf(i.toString()) === -1) continue;
			let calculation = this.getCalculationsForColumn(column.title, group);
			if (groupTitle) {
				groupTitle = false;
				let groupColumn = createElement("ax-group-footer-column", {class: "group-footer", "left-freezed-column": "body"});
				groupColumn.setAttribute("column-index", columnIndex);
				if (colSpan > 2) groupColumn.setAttribute("colspan", colSpan - 1);
				let innerDiv = createElement("div", {});
				createFooterDisplay(group, innerDiv);
				innerDiv.style["padding-left"] = paddingLeft + "px";
				groupColumn.appendChild(innerDiv);
				footer.appendChild(groupColumn);
				columnIndex = columnIndex + colSpan - 1;
			} else if (colSpan > 1) {
				let groupColumn = createElement("ax-group-footer-column", {"left-freezed-column": "body"});
				if (colSpan > 2) groupColumn.setAttribute("colspan", colSpan - 1);
				groupColumn.setAttribute("column-index", columnIndex);
				let innerDiv = createElement("div", {});
				groupColumn.appendChild(innerDiv);
				footer.appendChild(groupColumn);
				columnIndex = columnIndex + colSpan - 1;
			}
			let groupColumn = this.getAggColumnTemplate(i, calculation, "footer");
			groupColumn.setAttribute("left-freezed-column", "body");
			groupColumn.setAttribute("column-index", i);
			footer.appendChild(groupColumn);
			lastLeftFreezedColumn = groupColumn;
			colSpan = 0;
		}
		var leftFreezedTitle;
		if (colSpan > 0) {
			leftFreezedTitle = createElement("ax-group-footer-column", {"left-freezed-column": "body"});
			leftFreezedTitle.setAttribute("column-index", columnIndex);
			if (colSpan > 1) leftFreezedTitle.setAttribute("colspan", colSpan);
			if (!groupTitle) footer.appendChild(leftFreezedTitle);
			colSpan = 0;
		} else if (lastLeftFreezedColumn) lastLeftFreezedColumn.addClass("last-column");
		for (let i = this.controller.attrs.leftFreezedColumns; i < rightFreezedIndex; i++) {
			let column = columns[i];
			colSpan++;
			if (colSpan === 1) columnIndex = i;
			if (column.hidden) continue;
			if (group.footer.columnsCalculations.indexOf(i.toString()) === -1) continue;
			let calculation = this.getCalculationsForColumn(column.title, group);
			if (groupTitle) {
				groupTitle = false;
				createFooterTitle(leftFreezedTitle, colSpan - 1, group, footer, columnIndex);
				columnIndex = columnIndex + colSpan - 1;
			} else if (colSpan > 1) {
				let groupColumn = createElement("ax-group-footer-column", {colspan: colSpan - 1});
				let innerDiv = createElement("div", {});
				groupColumn.setAttribute("column-index", columnIndex);
				groupColumn.appendChild(innerDiv);
				footer.appendChild(groupColumn);
				columnIndex = columnIndex + colSpan - 1;
			}
			let groupColumn = this.getAggColumnTemplate(i, calculation, "footer");
			groupColumn.setAttribute("column-index", i);
			footer.appendChild(groupColumn);
			colSpan = 0;
		}
		if (colSpan > 0) {
			if (groupTitle) {
				createFooterTitle(leftFreezedTitle, colSpan, group, footer, columnIndex);
				columnIndex = columnIndex + colSpan;
				if (!this.controller.hasEmptyColumn) footer.children[footer.children.length - 1].setAttribute("class", footer.children[footer.children.length - 1].getAttribute("class") + " last-column");
			} else {
				let groupColumn = createElement("ax-group-footer-column", {colspan: colSpan, columnIndex: columnIndex});
				footer.appendChild(groupColumn);
			}
			colSpan = 0;
		}
		if (this.controller.hasEmptyColumn) {
			let groupColumn = createElement("ax-group-footer-column", {class: "last-column empty-column"});
			groupColumn.setAttribute("column-index", columnsNo);
			footer.appendChild(groupColumn);
		}

		for (let i = rightFreezedIndex; i < columnsNo && this.controller.attrs.rightFreezedColumns > 0; i++) {
			let column = columns[i];
			colSpan++;
			if (colSpan === 1) columnIndex = i;
			if (column.hidden) continue;
			if (group.footer.columnsCalculations.indexOf(i.toString()) === -1) continue;
			let calculation = this.getCalculationsForColumn(column.title, group);
			if (colSpan > 1) {
				let groupColumn = createElement("ax-group-footer-column", {"right-freezed-column": "body"});
				groupColumn.setAttribute("column-index", columnIndex);
				if (colSpan > 2) groupColumn.setAttribute("colspan", colSpan - 1);
				let innerDiv = createElement("div", {});
				groupColumn.appendChild(innerDiv);
				footer.appendChild(groupColumn);
				columnIndex = columnIndex + colSpan - 1;
			}
			let groupColumn = this.getAggColumnTemplate(i, calculation, "footer");
			groupColumn.setAttribute("column-index", columnIndex);
			groupColumn.setAttribute("right-freezed-column", "body");
			footer.appendChild(groupColumn);
			colSpan = 0;
		}
		if (colSpan > 0) {
			let groupColumn = createElement("ax-group-footer-column");
			groupColumn.setAttribute("column-index", columnIndex);
			if (this.controller.attrs.rightFreezedColumns > 0) groupColumn.setAttribute("right-freezed-column", "body");
			if (colSpan > 1) groupColumn.setAttribute("colspan", colSpan);
			footer.appendChild(groupColumn);
		}
		group.footer.template = angular.element(footer);
		// console.log(footer.innerHTML);
	}

	createHeaders(tBodyElement) {
		var template = this.template;
		/**
		 * @type {axTableController}
		 */
		this.controller = template.controller;

		for (let i = 0; i < this.controller.groups.defs.length; i++) {
			let groupDef = this.controller.groups.defs[i];
			let attrs = {
				"role": "group-header",
				"level": i,
				"tabindex": "0",
				"uid": "{{::dataItem.$$uid}}",
				"ng-attr-index": "{{(dataItem? $ctrl.dataItemGetIndex(dataItem, 'visibleItems'): 'null')}}",
				'ng-class': "{'collapsed': dataItem.collapsed, 'hasFocus':dataItem.$$uid === $ctrl.currentItem.$$uid }",
				"ng-click": "$ctrl.clickRow(dataItem, $event)",
				"ng-if": "dataItem.isGroupHeader && dataItem.level === " + i,
				"class": "group-header group-level" + i + (groupDef.lastLevel ? " last-level" : "")
			};

			let html, contentHtml = groupDef.header.template.html();
			if (!contentHtml) continue;
			if (contentHtml.trim() !== "") {
				groupDef.hasHeader = true;
				if (this.controller.attrs.leftFreezedColumns > 0 || this.controller.attrs.rightFreezedColumns > 0) {
					attrs["ng-mouseenter"] = '!$ctrl.detectMouseLeftButton($event) ? $ctrl.trHover($event):false';
					attrs['ng-mouseleave'] = '!$ctrl.detectMouseLeftButton($event) ? $ctrl.trBlur($event):false';
				}

				html = "";
				var self = this;
				html = "";
				var columnIndex = 0;
				groupDef.header.template.find('>ax-group-header-column').each(function (index, columnDef) {//jshint ignore:line
					var colspan = parseInt(columnDef.getAttribute("colspan")) || 1;
					var div = createElement("div", columnDef.attributes, columnDef.innerHTML);
					div.removeAttribute("left-freezed-column");
					div.removeAttribute("right-freezed-column");
					div.removeAttribute("column-index");
					div.removeAttribute("colspan");
					div.removeAttribute("class");
					div.setAttribute("class", "inline");
					div.style.width = "100%";

					columnIndex = columnDef.getAttribute("column-index");
					let column = self.controller.columns.hideable[columnIndex];
					if (columnDef.classList.contains("header-calculation")) div.style["text-align"] = "right";
					var td = createElement("td", {"column-index": columnDef.getAttribute("column-index"), tabindex: index}, div);
					if ((column.leftFreezedColumn || column.rightFreezedColumn) && !column.isScrollVisible) td.setAttribute("not-scroll-visible", "");
					if (columnDef.hasAttribute("class")) td.setAttribute("class", columnDef.getAttribute("class"));
					if (columnDef.hasAttribute("left-freezed-column")) td.setAttribute("left-freezed-column", "body");
					if (columnDef.hasAttribute("right-freezed-column")) td.setAttribute("right-freezed-column", "body");
					td.setAttribute("column-for", column.title);
					if (column.title === "Empty column") td.addClass("empty-column");
					if (self.controller.columns.hideable[columnIndex].hidden && (!colspan || colspan === 1)) td.setAttribute('hidden-column', '');
					self.template.setColumnColumnsRange(td, colspan, columnIndex, true);
					if (td.getAttribute("colspan") !== "0")
						html += td.outerHTML;
				});
			}
			let tr = createElement("tr", attrs, html);
			if (groupDef.header.backgroundColor) tr.style["background-color"] = groupDef.header.backgroundColor;
			groupDef.headerTr = tr.outerHTML;
			$(tr).find("[not-scroll-visible]").remove();
			tr.setAttribute("ng-keydown", "$ctrl.objectCellKeyDown(dataItem, $event)");
			tBodyElement.appendChild(tr);
		}
	}

	createFooters(tBodyElement) {
		var self = this;
		for (let i = this.controller.groups.defs.length - 1; i >= 0; i--) {
			let groupDef = this.controller.groups.defs[i];
			let footerHtml = groupDef.footer.template.html();
			groupDef.hasFooter = false;
			if (!footerHtml || footerHtml.trim() === "") continue;
			groupDef.hasFooter = true;
			var attrs = {
				"role": "group-footer",
				"level": i,
				"uid": "{{::dataItem.$$uid}}",
				"tabindex": "0",
				"ng-attr-index": "{{(dataItem? $ctrl.dataItemGetIndex(dataItem, 'visibleItems'): 'null')}}",
				"ng-click": "$ctrl.clickRow(dataItem, $event)",
				"class": "group-footer group-level" + i,
				'ng-class': "[{'collapsed':dataItem.headerDataItem.collapsed, 'hasFocus':dataItem.$$uid === $ctrl.currentItem.$$uid}]",
				"ng-if": "dataItem.isGroupFooter && dataItem.level=== " + i
			};
			var paddingLeft = groupDef.footerIndent;
			let html = "";
			groupDef.footerHeight = parseInt(this.template.attributes["row-data-height"]);

			if (this.controller.attrs.leftFreezedColumns > 0 || this.controller.attrs.rightFreezedColumns > 0) {
				attrs["ng-mouseenter"] = '!$ctrl.detectMouseLeftButton($event) ? $ctrl.trHover($event):false';
				attrs['ng-mouseleave'] = '!$ctrl.detectMouseLeftButton($event) ? $ctrl.trBlur($event):false';
			}
			//create footer tr.innerHTML
			html = "";
			var usedColumns = 0;
			var columnIndex = 0;
			groupDef.footer.template.find(">ax-group-footer-column").each(function (index, columnDef) {//jshint ignore:line
				var colspan = parseInt(columnDef.getAttribute("colspan")) || 1;
				var div = createElement("div", columnDef.attributes, columnDef.innerHTML);
				div.removeAttribute("left-freezed-column");
				div.removeAttribute("right-freezed-column");
				div.removeAttribute("column-index");
				div.removeAttribute("colspan");
				div.removeAttribute("class");
				div.setAttribute("class", "inline");
				div.style.width = "100%";

				if (columnDef.classList.contains("footer-calculation")) div.style["text-align"] = "right";

				columnIndex = columnDef.getAttribute("column-index");
				let column = self.controller.columns.hideable[columnIndex];

				var td = createElement("td", {"column-index": columnIndex, tabindex: columnIndex}, div);
				if ((column.leftFreezedColumn || column.rightFreezedColumn) && !column.isScrollVisible) td.setAttribute("not-scroll-visible", "");
				if (columnDef.hasAttribute("class")) td.setAttribute("class", columnDef.getAttribute("class"));
				if (columnDef.hasAttribute("left-freezed-column")) td.setAttribute("left-freezed-column", "body");
				if (columnDef.hasAttribute("right-freezed-column")) td.setAttribute("right-freezed-column", "body");
				if (column.title === "Empty column") td.addClass("empty-column");
				td.setAttribute("column-for", column.title);
				if (self.controller.columns.hideable[columnIndex].hidden && (colspan === 1)) td.setAttribute('hidden-column', '');
				usedColumns += colspan ? colspan : 1;
				if (self.template.setColumnColumnsRange(td, colspan, columnIndex, true) > 0) html += td.outerHTML;
			});
			//let tr = createElement("tr", attrs, html);
			//tr.setAttribute("ng-keydown", "$ctrl.objectCellKeyDown(dataItem, $event)");
			//groupDef.footerTr = tr.outerHTML;

			let tr = createElement("tr", attrs, html);
			if (groupDef.footer.backgroundColor) tr.style["background-color"] = groupDef.footer.backgroundColor;
			groupDef.footerTr = tr.outerHTML;
			$(tr).find("[not-scroll-visible]").remove();
			tr.setAttribute("ng-keydown", "$ctrl.objectCellKeyDown(dataItem, $event)");

			tBodyElement.appendChild(tr);

		}
	}

}