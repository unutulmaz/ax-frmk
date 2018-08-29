class axTableExport {
	/**
	 *
	 * @param {axTableController} controller
	 */
	constructor(controller) {
		this.template = controller.$template;
		this.controller = controller;
		var $export = this;
		this.controller.getExportFileName = function getExportFileName() {
			return this.export.def.fileName;
		};
		Object.defineProperty(controller, "testReadOnlyMethod", {
			writeable: false,
			value: function (par) { console.log(par); }
		});
		this.controller.createExportApi = function createExportApi($axApi) {
			this.$toolsApi = new $axApi({ controller: this.export.def.apiController, actions: {} });
			var api = this.$toolsApi;
			this.$toolsApi.xlsExport = function (params, removeSpinner) {
				return this.$http.post(
					this.getCustomActionUrl('xlsExport'),
					params,
					{
						headers: {
							'Content-type': 'application/json',
							'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
						},
						responseType: 'arraybuffer'
					}
				).then(function (response) {
					var responseThen = {
						headers: response.headers,
						data: response.data,
					};
					return responseThen;
				}).catch(function (response) {
					api.serviceFailed(response);
					if (removeSpinner) removeSpinner();
				});
			};
			this.$toolsApi.htmlExport = function (params, removeSpinner) {
				return this.$http.post(
					this.getCustomActionUrl('htmlExport'),
					params,
					{
						headers: {
							'Content-type': 'application/json',
							'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
						},
						responseType: 'arraybuffer'
					}
				).then(function (response) {
					var responseThen = {
						headers: response.headers,
						data: response.data,
					};
					return responseThen;
				}).catch(function (response) {
					api.serviceFailed(response);
					if (removeSpinner) removeSpinner();
				});
			};

		};
		this.controller.exportData = function exportData(params) {
			var type = params.type;
			var removeSpinner = params.removeSpinner;
			if (this.export.def.exportType === 'server') this.serverSideExport(type, removeSpinner);
			else this.clientSideExport(type, removeSpinner);
		};
		this.controller.getColumnsForExport = function getColumnsForExport(options) {
			var columns = [];
			angular.forEach(this.columns.hideable,
				function (columnDef) {
					if (columnDef.canView === false || !columnDef.bindTo || !columnDef.exportable) return true;
					if (options.includes("justdata") && columnDef.bindTo === "$$uid") return true;
					let column = { fieldName: columnDef.bindTo, header: columnDef.title, colSpan: columnDef.colSpan, width: columnDef.width, hidden: columnDef.hidden };
					if (column.hidden) return true;
					columns.push(column);
					return false;
				});
			return columns;
		};
		this.controller.prepareDataForExport = function prepareDataForExport() {
			var $controller = this;
			var getAllArgs = angular.isFunction($controller.loadDataApiArgs) ? $controller.loadDataApiArgs() : $controller.loadDataApiArgs;
			return {
				extraArgs: {
					RoleId: this.$dataStore.currentRole.RoleId,
					OuId: this.$dataStore.currentRole.OuId,
					EvaluationId: this.$dataStore.currentEvaluation.Id
				},
				getAllArgs: getAllArgs,
				export: {
					columns: this.getColumnsForExport(["justdata"]),
					data: this.getCollection("filtered"),
					reportName: this.getExportFileName()
				}
			};
		};
		this.controller.serverSideExport = function serverSideExport(type, removeSpinner) {
			var $controller = this;
			if (type === 'xls')
				this.$toolsApi.xlsExport(this.prepareDataForExport()).then(function (response) {
					if (response) {
						var fileName = $controller.getExportFileName() + '.xlsx';
						var fileContent = new Blob([response.data], { type: response.headers('Content-Type') });
						window.saveAs(fileContent, fileName);
					}
					if (removeSpinner) removeSpinner();
				});

			else if (type === 'view' || type === 'print') {
				this.$toolsApi.htmlExport(this.prepareDataForExport()).then(function (response) {
					if (response) {
						var fileName = $controller.getExportFileName() + '.html';
						var fileContent = new Blob([response.data], { type: response.headers('Content-Type') });
						window.saveAs(fileContent, fileName);
					}
					if (removeSpinner) removeSpinner();
				});
			}
		};
		this.controller.clientSideExport = function clientSideExport(type, removeSpinner) {
			var $controller = this;

			var yesResponse = function () {
				let reportTitle = $controller.getExportFileName();
				$controller.$timeout(function () {
					var table = $controller.clientSidePrepareData(type);
					if (!table) return removeSpinner();
					if (type === 'xls' || type === 'xls-justagg') {
						let leftFreezedColumns = $controller.attrs.leftFreezedColumns;
						for (let i = 0; i < $controller.attrs.leftFreezedColumns; i++) {
							let column = $controller.columns.hideable[i];
							if (column.hidden || !column.exportable) leftFreezedColumns--;
						}
						let html = axTableExport.htmlXlsTemplate({
							WorksheetName: reportTitle,
							rowsFreezed: $controller.header.rows.headerRows, leftFreezed: leftFreezedColumns
						});
						html += table.outerHTML;
						window.saveAsXls(html, reportTitle);
					} else if (type === 'view') {
						$controller.formatTable(table);
						$controller.openReport("Report", table.outerHTML);
					} else if (type.startsWith('print')) {
						$controller.formatTable(table);
						let html = '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">';
						html += '<html><head><title>' + reportTitle + '</title></head>';
						html += '<body style="overflow:auto"></body></html>';
						var newWindow = window.open();
						if (newWindow) {
							newWindow.document.title = reportTitle + " - generating";
							newWindow.document.write(html);
							$(newWindow.document.body).html(table.outerHTML);
							newWindow.document.title = reportTitle;
							newWindow.document.close();
						} else {
							$controller.$notify.error("You must allow popups to be opened in browser!");
						}
					}
					removeSpinner();
				}, 100);
			};
			let dataItems = $controller.getCollection('items');
			if (dataItems.length > 10000 && type.indexOf("justdata") === -1) {
				this.openConfirm("Confirm export", "You have " + dataItems.length + " records to export, which can take a long time. Continue?", yesResponse, removeSpinner, this.getDomElement());
			} else yesResponse();
		};
		this.controller.xlsJustDataExport = function (options) {
			let reportTitle = this.getExportFileName(), rowsFreezed = 1, leftFreezed = 0;
			let exportColumns = this.getColumnsForExport(options);
			let rowData = this.getCollection("filtered");
			var wb = XLSX.utils.book_new();
			var arrayData = new Array(rowData.length + 1);
			var xlsOptions = { bookSST: true, bookType: "xlsx", type: "array" };
			let topCell = XLSX.utils.encode_cell({ r: rowsFreezed, c: leftFreezed });
			let wsFreeze = { xSplit: leftFreezed, ySplit: rowsFreezed, topLeftCell: topCell, activePane: "bottomRight", state: "frozen" };
			let wsCols = [];
			let row = new Array(exportColumns.length);
			exportColumns.each(function (column, i) {
				row[i] = column.header;
				wsCols.push({ wpx: column.width });
			});
			arrayData[0] = row;
			rowData.each(function (row, i) {
				let dataRow = new Array(exportColumns.length);
				exportColumns.each(function (column, i) {
					dataRow[i] = row[column.fieldName];
				});
				arrayData[i + 1] = dataRow;
			});
			let ws = XLSX.utils.aoa_to_sheet(arrayData);
			ws['!cols'] = wsCols;
			ws["!freeze"] = wsFreeze;
			XLSX.utils.book_append_sheet(wb, ws, reportTitle);
			var wbout = XLSX.write(wb, xlsOptions);
			window.saveAs(new Blob([wbout], { type: 'application/octet-stream' }), reportTitle + ".xlsx");
		};
		this.controller.htmlJustDataExport = function (options) {
			// let reportTitle = this.getExportFileName(), rowsFreezed = 1, leftFreezed = 0;
			let exportColumns = this.getColumnsForExport(options);
			let rowData = this.getCollection("filtered");
			var table = axElement.createDOMElement('table', { border: 1 });
			table.style.font = "12px/1.5 Arial, sans-serif";
			createElement("style", {}, `td{vertical-align:top;}`, table);
			let colgroups = createElement("colgroups");
			let thead = createElement("thead");
			let theadTr = createElement("tr");
			theadTr.style.height = "24px";

			exportColumns.each(function (column, i) {
				createElement("th", { style: "text-align:center;font-weight:bold;vertical-align:middle;border-top:1px solid black;border-bottom:1px solid black;border-left:1px solid black;background-color:lightgrey" }, column.header, theadTr);
				createElement("col", { style: "width:" + column.width }, false, colgroups);
			});
			thead.appendChild(theadTr);
			table.appendChild(thead);
			table.appendChild(colgroups);
			let tbody = createElement("thead");
			rowData.each(function (row, i) {
				let tr = createElement("tr");
				exportColumns.each(function (column, i) {
					let value = row[column.fieldName];
					let innerHtml = value === null || value === undefined ? "" : value.toString();
					createElement("td", { style: "border-left: 1px solid lightgray; padding: 1px;padding:0 5px;" }, innerHtml, tr);
				});
				tbody.appendChild(tr);
			});
			table.appendChild(tbody);
			return table;
		};
		this.controller.readyToPrintExport = function (exportOptions) {
			var table = axElement.createDOMElement('table', { border: 1 });
			table.style.font = "12px/1.5 Arial, sans-serif";
			createElement("style", {}, `td{vertical-align:top;}`, table);
			let thead = this.$template.createHeaderTitleRows(true);
			var $controller = this;
			let scope = $controller.scope();
			let columns = angular.copy($controller.columns.defs);
			let theadSource = $controller.$compile(thead)(scope);
			theadSource.find(".empty-column, th[hidden-column], th[export-colspan=0], th[exportable=false]").remove();
			let rowsCnt = theadSource.find("tr").length - 1;
			theadSource.find("tr").each(function (rowIndex, trSource) {
				trSource.style.height = "24px";
				for (let i = 0; i < trSource.cells.length; i++) {
					let tdSource = angular.element(trSource.cells[i]);
					tdSource.find(".sortable-index").remove();
					tdSource.find("[ng-bind]").each(function (i, element) {
						let ngBind = element.getAttribute("ng-bind");
						element.removeAttribute("ng-bind");
						element.innerHTML = "{{::(" + ngBind.replace("::", "") + ")}}";
					});
					let source = $controller.$interpolate(tdSource[0].innerHTML)(scope);
					if (!source) continue;
					let dummyDiv = createElement("div", {}, source);
					tdSource[0].innerHTML = axUtils.htmlToPlainText(dummyDiv);
					tdSource[0].style.cssText = "text-align:center;font-weight:bold;vertical-align:middle;background-color:lightgrey";
					let colspan = tdSource[0].getAttribute("export-colspan") || 1;
					if (tdSource[0].hasAttribute("export-colspan")) tdSource[0].setAttribute("colspan", colspan);
					if (exportOptions[0] !== "xls") tdSource[0].style.cssText += "border-top:1px solid black;border-left:1px solid black";
					let lastRowIndex = rowIndex + parseInt((tdSource[0].getAttribute("rowspan") || 1) - 1);
					if (rowIndex === rowsCnt || lastRowIndex === rowsCnt) tdSource[0].style.cssText += "border-bottom:1px solid black;";
				}
			}, this);
			if (exportOptions[0] === "xls") theadSource.find("tr th[hidden-column]").remove();
			table.appendChild(thead);
			let levelsCnt = $controller.groups.defs.length;
			var tbody = axElement.createDOMElement('tbody');
			var colgroup = createElement("colgroup");
			for (let i = 0; i < $controller.columns.defs.length; i++) {
				let columnDef = $controller.columns.defs[i];
				let col = createElement("col");
				col.style.width = parseInt(columnDef.getAttribute("width")) + (i === 0 ? levelsCnt * 20 : 0) + 'px';
				if (columnDef.hasAttribute("hidden-column") || columnDef.getAttribute("exportable") === "false") {
					continue;
				}
				if (angular.element(columnDef).hasClass("empty-column")) continue;
				colgroup.appendChild(col);
			}
			tbody.appendChild(colgroup);
			let dataItems = $controller.getCollection('items');
			let fillCells = dataItems.length < this.export.def.viewTemplateLimit ? this.export.def.dataValue : "bind-to";
			angular.forEach(dataItems,
				function (dataItem, index) {
					let tr;
					scope.dataItem = angular.copy(dataItem);
					// si items-urile filtrate sunt tot hidden
					if (exportOptions.includes("justagg") && this.dataItemGetAttr(dataItem, "hidden") || this.dataItemGetAttr(dataItem, "filtered")) return true;
					tr = axElement.createDOMElement('tr');
					if (dataItem.isGroupHeader) {
						if (!dataItem.hasHeader) return;
						let groupDef = angular.copy($controller.groups.defs[dataItem.level]);
						let levelBackground = groupDef.header.backgroundColor ? groupDef.header.backgroundColor : "lightgray";
						tr.setAttribute("style", "mso-outline-level:" + (dataItem.level));
						tr.addClass("group-header");
						tr.setAttribute("group-level", dataItem.level);
						let trTemplate = angular.element(groupDef.headerTr)[0];
						trTemplate.removeAttribute("ng-if");
						let groupHeader = $controller.$compile(trTemplate.outerHTML)(scope);
						groupHeader.find('td').each(function (i, source) {
							var td = axElement.createDOMElement('td', source.attributes);
							if (td.hasClass("group-header")) {
								let leftFreezedTd = groupHeader.find("td.empty-group-header");
								if (leftFreezedTd.length > 0) {
									td.setAttribute("columns-range", leftFreezedTd[0].getAttribute("columns-range") + "," + td.getAttribute("columns-range"));
									td.setAttribute("export-colspan", parseInt(leftFreezedTd[0].getAttribute("export-colspan") || "1") + parseInt(td.getAttribute("export-colspan") || 1));
								}
							}
							if (td.hasClass("empty-column")) return;
							let sourceEl = angular.element(source);
							sourceEl.find(".group-toggle-show").remove();
							sourceEl.find("[ng-bind]").each(function (i, element) {
								let ngBind = element.getAttribute("ng-bind");
								element.removeAttribute("ng-bind");
								element.innerHTML = "{{::(" + ngBind.replace("::", "") + ")}}";
							});
							sourceEl[0].innerHTML = $controller.$interpolate(sourceEl.html())(scope);
							sourceEl.find(".inline").each(function (i, element) {
								element.style.width = "100%";
								for (let i = 0; i < element.children.length; i++) {
									element.children[i].setAttribute("style", "mso-data-placement:same-cell;display:inline-block;width:initial;vertical-align:top;margin-right:5px");
									if (element.children[i].classList.contains("calculation-separator")) {
										element.children[i].style.cssText += "width:10px;text-align:center;";
										element.children[i].innerHTML = "|";
									}
									if (element.children[i].classList.contains("calculation-label")) {
										element.children[i].innerHTML += ":";
									}
								}
								element.innerHTML = axUtils.htmlToPlainText(element);

								// element.innerHTML = element.innerText;
							});
							td.style.cssText = "border-left: 1px solid lightgray; padding: 1px;background-color:" + levelBackground;
							if (td.hasAttribute("hidden-column")) td.style.cssText += "display:none";
							let innerHtml = sourceEl.html();
							if (td.hasClass("empty-group-header")) return;
							td.innerHTML = innerHtml;
							// td.innerHTML = sourceEl[0].innerText;
							if (td.hasClass("group-header")) {
								td.style["padding-left"] = dataItem.level * 20 + 'px';
								if (td.children && td.children.length > 0) td.children[0].style["padding-left"] = 0;
							} else if (td.hasClass("header-calculation")) {
								td.style["text-align"] = "right";
								td.style["padding-right"] = '5px';
							}
							let colspan = td.getAttribute("export-colspan") || 1;
							if (colspan === "0") return;
							if (td.hasAttribute("export-colspan")) td.setAttribute("colspan", td.getAttribute("export-colspan"));
							td.removeAttribute("left-freezed-column");
							td.removeAttribute("columns-range");
							td.removeAttribute("export-colspan");
							td.removeAttribute("tabindex");
							td.removeAttribute("column-index");
							td.removeAttribute("group-level");

							tr.appendChild(td);
						});

					} else if (dataItem.isGroupFooter) {
						scope.dataItem.calculations = dataItem.calculations;
						scope.dataItem.headerDataItem = dataItem.headerDataItem;
						scope.dataItem.getGroup = dataItem.getGroup;
						let groupDef = angular.copy($controller.groups.defs[dataItem.level]);
						let levelBackground = groupDef.footerBackground ? groupDef.footerBackground : "";
						tr.addClass("group-footer");
						tr.setAttribute("style", "background-color:" + levelBackground + ";mso-outline-level:" + (dataItem.level));

						let trTemplate = angular.element(groupDef.footerTr)[0];
						trTemplate.removeAttribute("ng-if");
						let groupHeader = $controller.$compile(trTemplate.outerHTML)(scope);
						groupHeader.find('td').each(function (i, source) {
							var td = axElement.createDOMElement('td', source.attributes);
							if (td.hasClass("empty-column")) return;
							let sourceEl = angular.element(source);
							sourceEl.find("[ng-bind]").each(function (i, element) {
								let ngBind = element.getAttribute("ng-bind");
								element.removeAttribute("ng-bind");
								element.innerHTML = "{{::(" + ngBind.replace("::", "") + ")}}";
							});
							let sourceHtml = sourceEl.html();
							sourceEl[0].innerHTML = $controller.$interpolate(sourceHtml)(scope);
							sourceEl.find(".inline").each(function (i, element) {
								element.style.width = "100%";
								for (let i = 0; i < element.children.length; i++) {
									element.children[i].setAttribute("style", "mso-data-placement:same-cell;display:inline-block;width:initial;vertical-align:top;margin-right:5px");
									if (element.children[i].classList.contains("calculation-separator")) {
										element.children[i].style.cssText += "width:10px;text-align:center;";
										element.children[i].innerHTML = "|";
									}
									if (element.children[i].classList.contains("calculation-label")) {
										element.children[i].innerHTML += ":";
									}
								}
								element.innerHTML = axUtils.htmlToPlainText(element);
							});
							td.style.cssText = "border-left: 1px solid lightgray; padding: 1px;";
							if (td.hasAttribute("hidden-column")) td.style.cssText += "display:none";
							td.innerHTML = sourceEl.html();
							if (td.hasClass("group-footer")) {
								td.style["padding-left"] = dataItem.footerIndent + 'px';
								if (td.children.length > 0) td.children[0].style["padding-left"] = 0;
							}
							let colspan = td.getAttribute("export-colspan") || 1;
							if (colspan === "0") return;
							if (td.hasAttribute("export-colspan")) td.setAttribute("colspan", td.getAttribute("export-colspan"));
							td.removeAttribute("left-freezed-column");
							td.removeAttribute("columns-range");
							td.removeAttribute("export-colspan");
							td.removeAttribute("tabindex");
							td.removeAttribute("column-index");
							td.removeAttribute("group-level");

							tr.appendChild(td);
						});
					} else if (!exportOptions.includes("justagg")) {
						tr.setAttribute("style", "mso-outline-level:" + (levelsCnt));

						for (let i = 0; i < columns.length; i++) {
							let column = columns[i];
							if (column.hasAttribute("hidden-column")) continue;
							if (column.getAttribute("exportable") == "false") continue;
							var view = angular.element(column).find('ax-column-view')[0];
							var td = axElement.createDOMElement('td');
							td.style.cssText = "border-left: 1px solid lightgray; padding: 1px 2px 1px 6px;";
							if (levelsCnt && i === 0 && levelsCnt > 1) td.style["padding-left"] = levelsCnt * 20 + 'px';
							if (column.getAttribute("header") === "Empty column") continue;
							else if (fillCells === "bind-to") {
								let bindTo = view.getAttribute("bind-to");
								if (bindTo && bindTo !== "$$uid") {
									var expression = 'dataItem["' + bindTo + '"]';
									if (view.style["text-align"]) td.style["text-align"] = view.style["text-align"];
									if (view.style["padding-right"]) td.style["padding-right"] = view.style["padding-right"];
									td.innerHTML = scope.$eval(expression);
								}
							} else {
								var axView = new axTableColumnView(view, $controller, column);
								if (column.getAttribute("bind-to") === "DiffText") {
									//console.log(axView.outerHTML);
								}
								//let axViewHtml = $controller.$compile(axView.outerHTML)(scope)[0].outerHTML;
								let axViewHtml = axView.outerHTML;
								var dummyDiv = createElement("div", {}, axViewHtml);
								angular.element(dummyDiv).find("[ng-bind]").each(function (i, element) {
									let ngBind = element.getAttribute("ng-bind");
									element.removeAttribute("ng-bind");
									element.innerHTML = "{{::(" + ngBind.replace("::", "") + ")}}";
								});
								let htmlContent = $controller.$interpolate(dummyDiv.innerHTML)(scope);
								if (axView.getAttribute("view-type") === "number") td.style["text-align"] = "right";
								if (axView.style["text-align"]) td.style["text-align"] = axView.style["text-align"];
								if (axView.style["padding-right"]) td.style["padding-right"] = axView.style["padding-right"];
								td.innerHTML = axUtils.htmlToPlainText(htmlContent);
							}
							td.style.cssText += "width:" + column.getAttribute("width");
							tr.appendChild(td);
						}
					}
					if (tr.children.length > 0) tbody.appendChild(tr);
				}, this);
			table.appendChild(tbody);
			delete scope.dataItem;
			return table;
		};
		this.controller.clientSidePrepareData = function clientSidePrepareData(exportName) {
			let exportOptions = exportName.split("-");
			if (exportOptions.includes("justdata")) {
				if (exportOptions.includes("print")) return this.htmlJustDataExport(exportOptions);
				if (exportOptions.includes("xls")) return this.xlsJustDataExport(exportOptions);
			}
			else return this.readyToPrintExport(exportOptions);
		};
		this.controller.formatTable = function formatTable(table) {
			table.removeAttribute('border');
			table.style["border-collapse"] = "collapse";
			let element = angular.element(table);
			element.find('th').css({ 'border1': '1px solid black', 'padding': '0 3px', 'height': '28px' });
			//angular.element(table).find('td').css({ 'border-left': '1px solid lightgray', 'padding': '1px 2px 1px 6px' });
			element.find('tr >th:not(.child-export-table):last-child').css({ 'border-right': '1px solid black', 'padding': '0 3px;' });
			element.find('tr >td:not(.child-export-table):last-child').css({ 'border-right': '1px solid black', 'padding': '0 3px;' });
			element.find('tr >td:not(.child-export-table):first-child').css({ 'border-left': '1px solid black', 'padding': '0 3px;' });
			element.find('tbody tr:not(.group-header):nth-child(even)').css('background', '#F8F9FC');
			let trs = angular.element(table).find('tbody>tr');
			if (trs.length > 0) trs[0].style['border-top'] = '1px solid black';
		};
		this.controller.openReport = function openReport(title, template, yesCallback, noCallback) {
			var self = this;
			var scope = {
				$confirm: {
					template: template,
					title: title,
					buttons: []
				}
			};
			this.$ngDialog.openConfirm({
				template: "/components/dependencies/ng-dialog/dialog-report.html",
				plain: false,
				className: 'ngdialog-theme-plain',
				appendTo: "#right-pane",
				scope: scope
			}).then(function () {
				yesCallback();
			},
				function () {
					if (noCallback) noCallback();
				});
		};
		this.controller.exportGetDetails = function (type) {
			let html = "";
			let $controller = this;
			let detailsOutput = $controller.config.exportCfg && $controller.config.exportCfg.item && $controller.config.exportCfg.item.detailsOutput ? true : false;
			this.export.def.item.element.find("ax-export-details").each(function (i, detail) {
				let detailName = detail.getAttribute("name");
				let detailTitle = detail.getAttribute("show-title") === "true" ? detail.getAttribute("title") : "&nbsp;";
				let detailsCtrl = $controller.getChild(detailName);
				let table = detailsCtrl.readyToPrintExport(["print"]);
				if (type !== "xls") table.removeAttribute("border");
				if (detail.hasAttribute("class")) table.addClass(detail.getAttribute("class"));
				$(table).find("td").each(function (i, td) {
					td.innerHTML = td.innerText;
					td.style["vertical-align"] = "top";
					if (td.classList.contains("group-footer") || td.classList.contains("group-header")) td.style["font-weight"] = "bold";
					if (td.classList.contains("group-footer") && td.hasAttribute("colspan")) {
						$(td).closest("tr").css({ height: "26px", "line-height": "26px", "font-size": "16px" });
						td.style["text-align"] = "right";
						td.style["padding-right"] = "10px";
					}
					if (td.classList.contains("footer-calculation")) {
						td.style["text-align"] = "right";
						td.style["font-weight"] = "bold";
					}
				});
				if (type === "xls") {
					$(table).find("th").each(function (i, th) {
						th.style.border = "initial";
					});
				}
				if (detail.getAttribute("show-title") === "true" || type === "xls")
					createElement("caption", { style: "height:25px;font-weight:bold;text-align:left;font-size:16px;padding-left:10px;" }, detailTitle, table);
				if (detailsOutput) $controller.config.exportCfg.item.detailsOutput(type, $(table), detailName);
				html += table.outerHTML;
			});
			return html;
		};
		this.controller.getExportFooter = function (type, dataItem) {
			let def = this.export.def.item.element.find("ax-export-footer, ax-export-footer-" + type);
			if (def.length !== 1) return "";
			let html = def.html(), result = html;
			if (def.attr("datasource")) {
				let scope = this.scope().$new();
				scope.dataItem = dataItem;
				let datasource = scope.$eval(def.attr("datasource"));
				if (datasource === undefined) console.error("Datasource ", def.attr("datasource"), "doesn't exist on master controller");
				scope.datasource = datasource;
				result = this.$interpolate(html)(scope);
			}
			return result;
		};
		this.controller.getExportHeader = function (type, dataItem) {
			let def = this.export.def.item.element.find("ax-export-header, ax-export-header-" + type);
			if (def.length !== 1) return "";
			let html = def.html(), result = html;
			if (def.attr("datasource")) {
				let scope = this.scope().$new();
				scope.dataItem = dataItem;
				let datasource = scope.$eval(def.attr("datasource"));
				if (datasource === undefined) console.error("Datasource ", def.attr("datasource"), "doesn't exist on master controller");
				scope.datasource = datasource;
				result = this.$interpolate(html)(scope);
			}
			return result;
		};
		this.controller.getExportAxTabs = function (type, popup, originalPopup) {
			let axTabs = popup.find("ax-tabs");
			if (axTabs.length === 0) return;
			let html = "";
			axTabs.each(function (i, axTab) {
				$(axTab).find("ax-table").each(function (i, axDt) {
					let config = axDt.getAttribute("config");
					let scope = originalPopup.find("ax-table[config='" + config + "']").scope();
					if (!scope) return;
					let ctrlScope = scope.$eval(config);
					if (!ctrlScope) return;
					let table = ctrlScope.$ctrl.readyToPrintExport(["print"]);
					let viewTitle = $(axDt).closest("ax-tab-view").getAttribute("tab-title");
					let title = $(originalPopup).find(".tabs-header>.tab[tab-title='" + viewTitle + "']")[0].innerText;
					html += "<div style='font-weight:bold;height:28px;line-height:28px'>" + title + "</div>";
					table.style.cssText = "border-spacing:0";
					html += table.outerHTML;
				});
			});
			axTabs.html(html);
		};
		this.controller.exportCurrentItem = function (dataItem, type) {
			let originalPopup = this.getDomElement().parent().find("ax-table-editor>ax-editor-content");
			let popup = angular.copy(originalPopup);
			popup.find("ax-form, .form-title").each(function(i, element){element.removeAttribute("ng-if");});
			popup.find("div[role=toolbar], button,ax-dropdown-list,ax-dropdown-popup, [ng-model],.ngdialog-close, .fa-caret-down, [ng-if], [ng-show]").remove();
			popup.find(".printable").css("display", "block");
			popup.find(".form-title").css({ "font-size": "18px", "font-weight": "bold", colspan: 7 }).removeAttr("ng-bind");
			popup.find("ax-form-section-header").each(function (i, header) {
				let td = $(header).closest("td");
				header.style.height = "30px";
				td.css({ "font-weight": "bold" });
				td.find("td").each(function (i, td) {
					$(td).css({ "font-weight": "initial" });
				});
			});
			popup.find("td").each(function (i, td) {
				//td.innerHTML = td.innerText;
				td.style["vertical-align"] = "top";
				if (td.getAttribute("role") === "input") td.style["font-weight"] = "bold";
			});
			this.getExportAxTabs(type, popup, originalPopup);
			if (this.config.exportCfg && this.config.exportCfg.item && this.config.exportCfg.item.formOutput) this.config.exportCfg.item.formOutput(type, popup, dataItem);
			let html = this.getExportHeader(type, dataItem);
			html += popup[0].outerHTML.replaceAll("!important", "");
			html += this.exportGetDetails(type);
			html += this.getExportFooter(type, dataItem);
			let $controller = this;
			let reportTitle = this.getExportFileName();
			this.$timeout(function () {
				var table = html;
				if (!table) return removeSpinner();
				if (type === 'xls') {
					let newDocument = new axDocument($controller.export.def.item.element, type);
					newDocument.body.innerHTML = table;
					html = newDocument.getHtml();
					window.saveAsXls(html, reportTitle);
				} else if (type === 'view') {
					$controller.openReport("Report", table.outerHTML);
				} else if (type.startsWith('print')) {
					let newDocument = new axDocument($controller.export.def.item.element, type);
					createElement("title", {}, reportTitle, newDocument.head);
					newDocument.body.style.cssText = "overflow:auto";
					let html = newDocument.getHtml();
					var newWindow = window.open();
					if (newWindow) {
						newWindow.document.title = reportTitle + " - generating";
						newWindow.document.write(html);
						$(newWindow.document.body).html(table);
						newWindow.document.title = reportTitle;
						newWindow.document.close();
						//newWindow.print();
					} else {
						$controller.$notify.error("You must allow popups to be opened in browser!");
					}
				}
				//removeSpinner();
			}, 100);

		};

	}//end constructor
	static htmlXlsTemplate(properties) {
		let html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:x="urn:schemas-microsoft-com:office:excel"
xmlns="http://www.w3.org/TR/REC-html40">

<head>
<meta http-equiv=Content-Type content="text/html; charset=windows-1252">
<meta name="ProgId" content="Excel.Sheet">
<meta name="Generator" content="Microsoft Excel 11">

<!--[if gte mso 9]>
<xml>
 <x:ExcelWorkbook>
  <x:ExcelWorksheets>
   <x:ExcelWorksheet>
    <x:Name></x:Name>
    <x:WorksheetOptions>
     <x:Selected/>
     <x:FreezePanes/>
     <x:FrozenNoSplit/>
     <x:SplitHorizontal>0</x:SplitHorizontal>
     <x:TopRowBottomPane>0</x:TopRowBottomPane>
     <x:SplitVertical>0</x:SplitVertical>
     <x:LeftColumnRightPane>0</x:LeftColumnRightPane>
     <x:ActivePane>0</x:ActivePane>
     <x:Panes>
      <x:Pane>
       <x:Number>3</x:Number>
      </x:Pane>
      <x:Pane>
       <x:Number>1</x:Number>
      </x:Pane>
      <x:Pane>
       <x:Number>2</x:Number>
      </x:Pane>
      <x:Pane>
       <x:Number>0</x:Number>
      </x:Pane>
     </x:Panes>
     <x:ProtectContents>False</x:ProtectContents>
     <x:ProtectObjects>False</x:ProtectObjects>
     <x:ProtectScenarios>False</x:ProtectScenarios>
    </x:WorksheetOptions>
   </x:ExcelWorksheet>
  </x:ExcelWorksheets>
  <x:ProtectStructure>False</x:ProtectStructure>
  <x:ProtectWindows>False</x:ProtectWindows>
 </x:ExcelWorkbook>
</xml>
<![endif]-->
</head>
`;
		if (properties.WorksheetName) html = html.replaceAll("<x:Name></x:Name>", "<x:Name>" + properties.WorksheetName + "</x:Name>");
		if (properties.rowsFreezed) {
			html = html.replaceAll("<x:SplitHorizontal>0</x:SplitHorizontal>", "<x:SplitHorizontal>" + (properties.rowsFreezed) + "</x:SplitHorizontal>");
			html = html.replaceAll("<x:TopRowBottomPane>0</x:TopRowBottomPane>", "<x:TopRowBottomPane>" + (properties.rowsFreezed) + "</x:TopRowBottomPane>");
		}
		if (properties.leftFreezed) {
			//html = html.replaceAll("<x:SplitVertical>0</x:SplitVertical>", "<x:SplitVertical>" + (properties.leftFreezed) + "</x:SplitVertical>");
			//html = html.replaceAll("<x:LeftColumnRightPane>0</x:LeftColumnRightPane>", "<x:LeftColumnRightPane>" + (properties.leftFreezed) + "</x:LeftColumnRightPane>");
		}
		return html;
	}


}