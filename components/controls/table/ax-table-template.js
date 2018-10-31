class axTableTemplate extends axElement {
	constructor($element, $attrs, linked, $dataStore, controllerConfig, $interpolate, scope) {
		super();
		let initial = angular.element($element[0].outerHTML);
		this.element = {
			source: $element,
			linked: linked,
			initial: initial,
			tag: $element[0].tagName,
			type: $element[0].tagName.substring(3).toLowerCase().replace("-", ""),
			editorDef: initial.find($attrs.hasGrid === "true" && $attrs.editRow === "editor" ? ">ax-grid-editor" : ">xxx"),
			$attrs: $attrs,
			attrs: {}
		};
		this.controllerConfig = controllerConfig;
		this.config = new $axTableConfig();
		this.$interpolate = $interpolate;
		this.$dataStore = $dataStore;
		this.scope = function () {
			return scope;
		};
		var attributes = this.element.source[0].attributes;
		var attrs = [];
		for (var i = 0, n = attributes.length; i < n; i++) {
			attrs[attributes[i].nodeName] = attributes[i].nodeValue;
		}
		this.element.attrs = attrs;
		attrs = new axTableAttrs();
		this.attributes = angular.copy(attrs.$attrs);

		this.currentPage = 1;
		this.hasEmptyColumn = false;
		/**
		 *@type {axTableController}
		 */
		this.controller = null;
		this.grouping = new axTableGrouping(this);
		this.scroller = new axTableScroller(this);
		this.header = new axTableHeader(this);
		this.html();
	}

	$destroy() {
		this.grouping = null;
		this.header = null;
		this.scroller = null;
		delete this.scroller;
		this.columns = null;
		this.groups = null;
		this.headerTable = null;
		this.tableScroller = null;
		this.toolbar = null;
		this.__proto__ = null; //jshint ignore:line
		if (this.controllerConfig) {
			this.controllerConfig.$ctrl = null;
			this.controllerConfig = null;
		}
		this.controller = null;
	}

	html() {
		this.timeStampLog = (this.attributes["pivot-table-mode"] === "true") ? this.controller.timeStamp.bind(this.controller) : angular.noop;
		this.timeStampLog(false, "pivot-create", "template starting");
		this.editorForm = undefined;
		this.element.editorHtml = "";
		this.checkTableTheme();
		this.setDefaultDataListAttributes(this.element.source[0]);
		this.extractAttributesValues(this.element.source[0], null, true);
		this.element.source.removeAttribute('role');
		this.createController();
		this.setElementStyle(this.element.source[0]);
		this.computeDefs();
		this.timeStampLog(false, "pivot-create", "template computeDefs finish");

		this.element.computed = angular.copy(this.element.source);
		this.element.cumputedHtml = this.element.computed.html();
		var element = angular.copy(this.element.source[0]);
		element.innerHTML = "";
		var toolbar = new axTableToolbar(this);
		if (toolbar.innerHTML) element.appendChild(toolbar);
		this.tableScroller = this.scroller.create(this);
		this.timeStampLog(false, "pivot-create", "template scroller create");

		if (this.headerTable && this.attributes["has-fixed-header"] === 'true') this.createFixedHeader(this.headerTable, element);
		if (this.attributes["has-horizontal-virtual-scroll"] === 'true') {
			var horizontalScroller = createElement('div', {
				role: "horizontal-scroller",
				style: "position:absolute;left:0;right:0;bottom:0;overflow-y:hidden;overflow:auto;height:auto;"
			}, `<div class="virtual-header" style="height:1px;width: ` + this.controller.element.tableWidth + `px" ></div>`);
			element.appendChild(horizontalScroller);
		}
		//panels must be load in this order :first=left, second=body, third=right for keyboard inline navigation
		if (this.controller.columns.lastLeftFreezedColumn) this.createLeftFreezedColumns(element);
		element.appendChild(this.tableScroller);
		if (this.controller.columns.firstRightFreezedColumn) this.createRightFreezedColumns(element);
		if (this.controller.columns.lastLeftFreezedColumn || this.controller.columns.firstRightFreezedColumn) {
			if (this.attributes["has-fixed-header"] !== 'true' && this.attributes["pivot-table-mode"] !== 'true') {
				if (this.attributes["no-header"] !== "true") {
					let header = this.createHeader(true);
					$(element).find("[role=table-scroller]>table>thead").html(header.innerHTML);
				}
				$(element).find("[role=table-scroller]>table [right-freezed-column].empty-column").removeAttr("right-freezed-column");
				$(element).find("[role=table-scroller]>table [left-freezed-column], [role=table-scroller]>table [right-freezed-column]").remove();
			}
		}
		this.createVerticalScroller(element);
		if (this.attributes['paginator-show'] === "true") {
			var paginator = new axTablePaginator(this);
			element.appendChild(paginator);
		}
		this.element.html = element.innerHTML;
		if (this.attributes["edit-row"] === "editor") {
			// this.element.linked.parent().find(">ax-table-editor").remove();
			// this.element.linked.parent()[0].appendChild(this.editorTemplate);
		}
		return element.innerHTML;
	}


	validate() {
		//this.validateAttribute("ctrl");
		//if (this.attributes["edit-row"] === "inline-cell") this.attributes["apply-changes-on-save"] = "false";
		if (this.attributes["has-grid"] !== "true") {
			this.attributes["customizable-pivot-table"] = "false";
			if (this.attributes["edit-row"] === "editor") {
				console.warn("ax-table can have edit-row only inline or inline-cell. For editor use ax-grid");
				this.attributes["edit-row"] = "";
			}
		}
		this.attributes["apply-changes-on-save"] = this.attributes["apply-changes-on-save"] === "true";
		//if (this.attributes["edit-row"] === "editor" && !this.attributes["edit-form-template"]) throw "You need to provide a edit-form-template url for edit-row = 'editor'";
		if (this.attributes["edit-form-template"]) this.attributes["edit-row"] = "editor";
		if (this.attributes.paginate === 'false') this.attributes['page-size'] = '';
		this.attributes['paginator-show'] = this.attributes.paginate === 'false' ? "false" : this.attributes['paginator-show'];
		this.attributes['refresh-item-on-edit'] = this.attributes['refresh-item-on-edit'] !== 'false';
		if (this.attributes['page-size']) this.attributes["page-size"] = this.attributes["page-size"].toUpperCase();
		if (this.attributes['selectable-rows'] !== "false" && !this.element.linked.hasClass("selectable")) this.element.linked.addClass('selectable');
		this.attributes['left-freezed-columns'] = this.attributes['freeze-columns-enabled'] !== "false" ? (parseInt(this.attributes["left-freezed-columns"]) || 0) : 0;
		this.attributes['right-freezed-columns'] = this.attributes['freeze-columns-enabled'] !== "false" ? (parseInt(this.attributes["right-freezed-columns"]) || 0) : 0;
		this.attributes["show-commands-tooltips"] = (this.attributes["show-commands-tooltips"] !== "false");
		this.attributes["show-pagination-tooltips"] = (this.attributes["show-pagination-tooltips"] !== "false");
		this.attributes["show-data-cells-tooltip"] = (this.attributes["show-data-cells-tooltip"] !== "false");
		if (this.attributes["left-freezed-columns"] !== "" && this.attributes["no-empty-column"] === "true") {
			console.warn("Cannot have no-empty-column=true when left-freezed-columns not empty!");
			this.attributes["no-empty-column"] = "false";
		}
		if (this.attributes.paginate === "false") this.attributes["columns-autofit-enabled"] = "false";
		if (this.attributes["row-data-height"] === "false" || this.attributes["row-data-height"] === "") this.attributes["has-variable-row-height"] = true;
		this.attributes["has-fixed-header"] = "false";
		if (this.element.type === "list") this.attributes["has-horizontal-virtual-scroll"] = "false";
		if (this.attributes["has-variable-row-height"] === "true") {
			this.attributes["has-variable-row-height"] = true;
			this.attributes["row-data-height"] = "";
			if (this.attributes["page-size"].toLowerCase() === "all") this.attributes["page-size"] = 30;
		}

	}

	hasClass(className) {
		return this.element.source.hasClass(className);
	}

	getMessage(category, id) {
		if (!angular.isDefined(this.config.texts[category])) console.error("Not defined messages for category: " + category);
		else if (!angular.isDefined(this.config.texts[category][id])) console.error("Not defined message for category: " + category + " and id: " + id);
		else if (!angular.isDefined(this.config.texts[category][id][this.config.language])) console.error("Not defined message for category: " + category + " and id: " + id);
		return this.config.texts[category][id][this.config.language];
	}

	createController() {
		this.controller = this.controller || {};
		this.controller.header = {};
		this.controller.export = {};
		this.controller.columns = {
			defs: [],
			ordered: [],
			orderBy: [],
			hideable: [],
			filters: {},
			no: 0
		};
		this.controller.hasEmptyColumn = false;
		this.controller.dataItemModel = [];
		this.controller.firstTime = true;
		this.controller.showBody = 1;
		this.controller.filters = this.filtersInit();
		this.controller.distinctValues = {};
		this.controller.convertData = {};
		this.controller.convertDataTypes = convertDataTypes;
		this.controller.element = this.element;
		if (this.element.source.attr('table-id')) this.controller.tableId = this.element.source.attr('table-id');
		else {
			this.controller.tableId = axUtils.Guid();
			this.attributes['table-id'] = this.controller.tableId;
		}
		this.controller.attrs = {};
		for (let attribute in this.attributes) {
			if (this.attributes.hasOwnProperty(attribute)) {

				let attributeCamelCaseName = axUtils.camelCase(attribute);
				this.controller.attrs[attributeCamelCaseName] = this.attributes[attribute];

			}
		}
		this.controller.isCustomizableFreezedColumns = this.isCustomizableFreezedColumns();
		var template = this;
		this.controller.hasClass = function (className) {
			return template.element.source.hasClass(className);
		};
		this.controller.$$id = this.controller.attrs.config + "-" + this.controller.attrs.datasource;
		return this.controller;
	}

	setDefaultDataListAttributes(element) {
		if (element.tagName !== 'AX-LIST') return;
		if (element.getAttribute('no-header') !== 'false' && element.getAttribute('show-search') !== 'true') element.setAttribute('no-header', 'true');
		if (element.getAttribute('paginate') !== 'false' && !element.hasAttribute('paginator-show')) element.setAttribute('paginator-show', 'false');

		if (!element.hasAttribute('table-overflow-x')) element.setAttribute('table-overflow-x', 'auto');
		//if (!element.hasAttribute('table-overflow-y')) element.setAttribute('table-overflow-y', 'auto');
		if (element.getAttribute('selectable-rows') === "false") {
			element.removeAttribute('selectable-rows');
			element.removeAttribute('selectable-rows-model');
			element.removeAttribute('selectable-rows-model-type');
		}
		if (!element.hasAttribute('selectable-rows') && element.hasAttribute('selectable-rows-model')) element.setAttribute('selectable-rows', 'single');
		if (element.children.length === 0 && !element.hasAttribute('item-display-field') && !element.hasAttribute('item-id-field')) {
			console.error("No item-display-field attribute or ax-column templates provided!");
			return;
		}
		element.setAttribute("apply-changes-on-save", "true");
		element.setAttribute("customizable-pivot-table", "false");
		var toolbar = angular.element(element).find('ax-toolbar');
		if (toolbar.length > 0) toolbar.attr("show-settings", false);

		var checkedClass = element.getAttribute('selectable-rows-checked-class') || (element.getAttribute('selectable-rows') === 'single' ? 'fa fa-check-circle-o' : 'fa fa-check-square-o');
		var uncheckedClass = element.getAttribute('selectable-rows-unchecked-class') || (element.getAttribute('selectable-rows') === 'single' ? 'fa fa-circle-o' : 'fa fa-square-o');
		if (element.hasAttribute('show-check-all') || element.hasAttribute('show-uncheck-all') || element.getAttribute('selectable-rows') === "multiple") {
			toolbar = createElement('ax-toolbar', {
				class: 'no-scroller',
				style: "background-color:white;padding:0!important"
			});
			if (element.hasAttribute('show-check-all') && element.getAttribute('show-check-all') !== "false") {

				var checkAll = createElement('ax-button', {"button-type": "check-all", style: "margin-top:0px;padding:0", class: checkedClass});
				toolbar.appendChild(checkAll);
			}
			if (element.hasAttribute('show-uncheck-all') && element.getAttribute('show-uncheck-all') !== "false") {
				var uncheckAll = createElement('ax-button', {"button-type": "uncheck-all", style: "margin-top:0px;padding:0"});
				toolbar.appendChild(uncheckAll);
			}
			if (element.getAttribute('selectable-rows') === "multiple" && element.getAttribute('show-close-popup') !== "false" && !element.hasAttribute("ng-mouseleave") && !this.element.linked[0].parentElement.hasAttribute("ng-mouseleave")) {
				var closeBtn = createElement('ax-button', {"button-type": "close-popup", style: "margin-top:0px", class: "fa fa-times"});
				toolbar.appendChild(closeBtn);
			}
			let cnt = toolbar.children.length;
			for (let i = 0; i < cnt; i++) {
				toolbar.children[i].style.width = 100 / cnt + "%";
			}
			if (toolbar.children.length > 0) element.appendChild(toolbar);
		}
		var bindTo = element.getAttribute('item-display-field') || element.getAttribute('item-id-field');
		var invariantField = element.getAttribute('item-invariant-field');
		if (!element.hasAttribute('item-display-field') && element.hasAttribute('item-id-field')) element.setAttribute('item-display-field', element.getAttribute('item-id-field'));
		if (element.hasAttribute('item-display-field')) {
			var columnExist = angular.element(element).find('>ax-column');
			if (columnExist.length === 0) {
				var columnView = createElement('ax-column-view', {type: 'custom'});
				if (element.getAttribute('item-show-check') !== "false" && element.hasAttribute('selectable-rows')) {
					var checkBoxes = createElement('i', {
						class: "select-item-icon",
						"ng-class": "{'" +
							checkedClass +
							"': $ctrl.isSelected(dataItem), '" +
							uncheckedClass +
							"': !$ctrl.isSelected(dataItem)}"
					});
					columnView.appendChild(checkBoxes);
					columnView.style.paddingLeft = 0;
					// columnView.style["text-align"]="center"
				}
				var span = createElement('span', {'ng-bind': '::dataItem["' + bindTo + '"]'});
				columnView.appendChild(span);
				let width = "100%";
				let column = createElement('ax-column', {
					'bind-to': bindTo,
					width: width
				}, columnView);
				if (element.hasAttribute('show-search') && element.getAttribute('show-search') !== "false") {
					var search = createElement('ax-column-filter', {type: 'text'});
					if (invariantField !== null && invariantField !== "") search.setAttribute('bind-to', invariantField);
					else search.setAttribute('bind-to', bindTo);
					column.appendChild(search);
				}

				element.innerHTML += column.outerHTML;
			}
			if (!element.hasAttribute('order-by')) element.setAttribute('order-by', invariantField !== null && invariantField !== "" ? invariantField : bindTo);
		}
	}

	checkTableTheme() {
		var hasThemeClass = false;
		for (let i = 0; i < this.element.linked[0].classList.length; i++) {
			if (this.element.linked[0].classList[i].contain('-theme')) {
				hasThemeClass = true;
				this.element.theme = this.element.linked[0].classList[i];
				break;
			}
		}
		if (!hasThemeClass) {
			this.element.theme = 'standard-theme';
			this.element.linked.addClass(this.element.theme);
		}
		if (!this.element.linked.hasClass("ax-table")) this.element.linked.addClass("ax-table");
	}

	setElementStyle(element) {

		element = this.element.source[0];
		element.style['max-width'] = "100%";
		element.style.overflow = 'hidden';
		if (element.hasAttribute("width")) element.style.width = element.getAttribute("width");
		if (element.hasAttribute("height")) element.style.height = element.getAttribute("height");
		if (!element.style.position) {
			this.element.source.addCssText("position:absolute !important");
			this.element.linked.addCssText("position:absolute !important");
		}
		if (element.style.position === 'absolute') {
			if (!element.style.height) {
				element.style.top = element.style.top || '0';
				element.style.bottom = element.style.bottom || '0';
			}
			if (!element.style.width) {
				element.style.right = element.style.right || '0';
				element.style.left = element.style.left || '0';
			}
		}
	}

	addDataItemModelField(field) {
		if (!this.controller.dataItemModel.includes(field) && field !== "$$uid") this.controller.dataItemModel.push(field);
	}

	computeDefs() {
		var controller = this.controller;

		var template = this;
		this.createLastColumn();
		var columnIndex = -1,
			sortableCnt = 0,
			hideableCnt = 0,
			tableWidth = 0;
		controller.columns.no = this.getDirectChildrenOfType("AX-COLUMN", this.element.source[0]).length;
		this.columnsNo = controller.columns.no;
		controller.columns.hideable = [];
		controller.columns.visible = [];
		controller.columns.sortable = [];
		controller.columns.headers = {};
		this.forEachColumn(function (item) {
			columnIndex++;
			item.setAttribute("column-index", columnIndex);
		});
		columnIndex = -1;
		$(controller.element.initial).find(">ax-column").each(function (i, item) {
			columnIndex++;
			item.setAttribute("column-index", columnIndex);
		});
		var editRowInCell = template.attributes["edit-row"] === "inline-cell";
		var editRowInEditor = template.attributes["edit-row"] === "editor";
		if (editRowInEditor) axTableEditor.createPopupForm(this);
		this.customizableFreezedColumns = template.isCustomizableFreezedColumns();
		controller.header.rows = {length: 0};
		this.hasFilters = this.element.source.find(">ax-column>ax-column-filter, >ax-column>ax-column-filter-menu, >ax-column[filter-menu]").length > 0;
		if (this.hasFilters && template.attributes['no-header'] === 'true') {
			this.hasFilters = false;
			console.warn("Filters will not be shown if ho-header attribute is set to true!");
		}
		let headers = this.element.source.find(">ax-column>ax-column-header");
		let hasExportBtn = this.element.source.find(">ax-toolbar>[button-type=export]").length > 0;
		headers.each(function (i, item) {
			let rowIndex = parseInt(item.getAttribute("row-index") || 1) + parseInt(item.getAttribute("rowspan") || 1) - 1;
			controller.header.rows.length = Math.max(controller.header.rows.length, rowIndex);
		});
		headers = this.element.source.find(">ax-column[header]:not([no-header-attr])");
		headers.each(function (i, item) {
			if (angular.element(item).find("ax-column-header").length > 0) return;
			controller.header.rows.length = Math.max(controller.header.rows.length, 1);
		});
		controller.header.rows.headerRows = controller.header.rows.length;

		if (this.hasFilters) controller.header.rows.length++;
		this.getExportDefs();
		axTableProfiles.getProfiles(this);
		this.grouping.getGroupsDefs();
		if (this.attributes["edit-row"] === "inline-cell")
			this.ngIf = {
				edit: "(($ctrl.canEdit===true?$ctrl.currentItem.$$uid===dataItem.$$uid:false) || $ctrl.dataItemGetAttr(dataItem,'status')==='dirty')" + (this.attributes["row-is-disabled"] ? " && !$ctrl.rowIsDisabled({ dataItem: dataItem })" : ""),
				view: "(($ctrl.canEdit===true?$ctrl.currentItem.$$uid!==dataItem.$$uid:true) && $ctrl.dataItemGetAttr(dataItem,'status')!=='dirty')" + (this.attributes["row-is-disabled"] ? " || $ctrl.rowIsDisabled({ dataItem: dataItem })" : "")
			};
		else if (this.attributes["edit-row"] === "inline")
			this.ngIf = {
				edit: "$ctrl.dataItemGetAttr(dataItem,'editing')",
				view: "!$ctrl.dataItemGetAttr(dataItem,'editing')"
			};
		let forbiddenColumns = this.controllerConfig.forbiddenColumns ? this.controllerConfig.forbiddenColumns() : [];
		controller.columns.hidden = 0;
		controller.hiddenColumns = [];
		let exportColumnIndex = -1;
		this.forEachColumn(function (item) {
			columnIndex = parseInt(item.getAttribute("column-index"));
			controller.columns.defs.push(item);
			// if (columnIndex + 1 + controller.attrs.rightFreezedColumns === template.columnsNo) item.classList.add("last-column");
			//console.log("column", item);
			var bindTo = item.getAttribute("bind-to");
			if (!item.hasAttribute("header")) {
				item.setAttribute("header", bindTo || columnIndex);
				item.setAttribute("no-header-attr", "");
			}
			if (template.element.type === "list" && !item.hasAttribute("show-header") && template.attributes["no-header"] !== "false") item.setAttribute("show-header", "false");
			var header = item.getAttribute("header");
			if (controller.columns.headers[header]) console.error("Column header attribute " + header + " it's already used to other column! Must be unique");
			controller.columns.headers[header] = item;
			var invariantField = item.hasAttribute("invariant-field") ? (item.getAttribute("invariant-field") || bindTo) : false;
			var sortable = item.hasAttribute("sortable") ? (item.getAttribute("sortable") || invariantField || bindTo) : false;
			if (!invariantField && sortable !== bindTo) invariantField = sortable;
			var hideable = item.getAttribute("hideable") !== 'false' && !item.classList.contains('empty-column');
			var th = axElement.createDOMElement("th");
			var columnClassList = item.classList.value || "";
			//console.log("column", header, hideable, item.getAttribute("hideable"));
			th.setAttribute("class", columnClassList);
			var canView = !forbiddenColumns.includes(header); //see controller.forbiddenColumns method
			let width = item.getAttribute("width") || "100px";
			var hideableColumn = {
				def: item,
				templates: {td: {}},
				bindTo: bindTo,
				invariantField: invariantField,
				sortable: sortable,
				title: header,
				hideable: hideable,
				canView: canView,
				index: columnIndex,
				hidden: !canView || item.hasAttribute("hidden-column"),
				isScrollVisible: true,
				width: (width.contain('px')) ? parseFloat(width) : 0
			};
			if (item.hasAttribute("show-in-editor")) hideableColumn.showInEditor = item.getAttribute("show-in-editor") === "true";
			if (columnIndex < controller.attrs.leftFreezedColumns) {
				hideableColumn.leftFreezedColumn = true;
				item.setAttribute('left-freezed-column', 'body');
			} else {
				let columnRightIndex = template.columnsNo - columnIndex - 1;
				if (controller.attrs.rightFreezedColumns > 0 && controller.attrs.rightFreezedColumns + (controller.hasEmptyColumn ? 1 : 0) > columnRightIndex && !(item.getAttribute("class") || "").contain("empty-column")) {
					hideableColumn.rightFreezedColumn = true;
					item.setAttribute('right-freezed-column', 'body');
				}

			}

			hideableColumn.exportable = (item.getAttribute("exportable") === "false") ? false : true;
			if (hasExportBtn && !template.hasEmptyColumn && item.getAttribute("width").toString().indexOf("%") > -1) throw "Column with percent width not allowed! " + item.outerHTML;
			if (item.getAttribute("width") === "100%" && columnClassList.split(" ").indexOf("W100") === -1) {
				columnClassList = (columnClassList ? columnClassList + " " : "") + "W100";
				if (hideable) {
					hideableColumn.hidden = false;
					hideableColumn.hideable = false;
					item.removeAttribute("hidden-column");
				}
			}
			if ((item.getAttribute("hidden-column") || "").startsWith("group-")) {
				hideableColumn.hiddenByGroup = item.getAttribute("hidden-column").replace("group-", "");
				hideableColumn.hideable = false;
			}
			if (!hideableColumn.hidden && !hideableColumn.leftFreezedColumn && !hideableColumn.rightFreezedColumn) tableWidth += hideableColumn.width;

			if (hideableColumn.hideable) hideableCnt++;
			if (hideableColumn.hidden) {
				controller.columns.hidden++;
				controller.hiddenColumns.push(header);
			}
			if (["gutter-icons", "crud-buttons"].includes(item.getAttribute("view-type"))) {
				item.setAttribute("hideable", "false");
				if (editRowInEditor) {
					item.setAttribute("hidden-column", "");
					hideableColumn.hidden = true;
				} else if (hideableColumn.hidden && ["inline", "inline-cell"].includes(template.attributes["edit-row"])) {
					item.removeAttribute("hidden-column");
					hideableColumn.hidden = false;
				}
				item.setAttribute("exportable", false);
				angular.element(item).find(">ax-column-header").attr("exportable", false);
				hideableColumn.exportable = false;
			}

			if (!hideableColumn.hidden && hideableColumn.exportable) exportColumnIndex++;
			if (hideableColumn.exportable) {hideableColumn.exportColumnIndex = exportColumnIndex; item.setAttribute('export-column-index', exportColumnIndex)}
			else item.removeAttribute('export-column-index');
			let sortableAdded = false;
			if (template.attributes["no-header"] !== "true") {
				var axHeaders = template.getDirectChildrenOfType("AX-COLUMN-HEADER", item);
				var addHeader = function (headerDef) {
					var rowIndex = parseInt(headerDef.getAttribute("row-index"));
					if (!rowIndex) console.error("ax-column-header must have a row-index attribute set! column:", item);
					if (headerDef.hasAttribute("class")) headerDef.setAttribute("class", headerDef.getAttribute("class").replace("last-column", ""));
					if (bindTo) headerDef.setAttribute("header-for", bindTo);
					if (hideableColumn.hidden && !headerDef.hasAttribute("hidden column")) headerDef.setAttribute("hidden-column", "");
					if (!headerDef.hasAttribute("header-title")) headerDef.setAttribute("header-title", headerDef.innerHTML.replace(/<[^>]*>/g, "").trim());
					if (header) headerDef.setAttribute("header", headerDef.getAttribute("header") || header);
					if (headerDef.innerHTML.trim() !== "" && headerDef.getAttribute("header-title").trim() === "") console.error("You need to provide a header-title attribute for header with row-index=" + rowIndex + " of column " + header);
					hideableColumn.header = headerDef.getAttribute("header-title");
					if ((item.getAttribute("header-menu") === "false" && !headerDef.hasAttribute("header-menu")) || template.element.type === "list") headerDef.setAttribute("header-menu", "false");
					// console.log("header", hideableColumn.header, item.getAttribute("header-menu"), item.getAttribute("header-menu") === "false" && !headerDef.hasAttribute("header-menu"));
					if (item.getAttribute("exportable") === "false") headerDef.setAttribute("exportable", "false");
					if (!sortableAdded && !headerDef.hasAttribute("sortable") && sortable) headerDef.setAttribute("sortable", sortable);
					if (!sortableAdded && headerDef.hasAttribute("sortable") && (parseInt(headerDef.getAttribute("colspan")) > 1) === false) {
						controller.columns.sortable.push({field: headerDef.getAttribute("sortable"), title: header, index: columnIndex});
						item.setAttribute("sortable", sortable);
						template.addDataItemModelField(sortable);
						hideableColumn.sortable = sortable;
						sortableAdded = true;
					}

					if (columnClassList) headerDef.setAttribute('class', columnClassList);
					if (headerDef.hasAttribute('sortable')) sortableCnt++;

					var hasColspan = parseInt(headerDef.getAttribute("colspan")) > 1;
					if (!hasColspan) {
						headerDef.setAttribute("can-view", canView);
					} else {
						headerDef.removeAttribute("bind-to");
						headerDef.removeAttribute("sortable");
					}
					if (hideableColumn.exportable) headerDef.setAttribute('export-column-index', exportColumnIndex);
					if (!angular.isDefined(controller.header.rows[rowIndex])) controller.header.rows[rowIndex] = [];
					controller.header.rows[rowIndex].push(headerDef);
				};
				hideableColumn.headers = [];
				if (axHeaders.length > 0) {
					let menuAdded = -1;
					for (let i = 0; i < axHeaders.length; i++) {
						let headerDef = axHeaders[i];
						headerDef.setAttribute("column-index", columnIndex);
						if (headerDef.hasAttribute("splitter-end")) continue;
						if (headerDef.hasAttribute("splitter-start")) {
							headerDef.setAttribute("colspan", headerDef.getAttribute("splitter-start"));
						}
						if (parseInt(headerDef.getAttribute("colspan")) > 1 === false && !headerDef.hasAttribute("header-menu")) {
							if (menuAdded > -1) headerDef.setAttribute("header-menu", false);
							else menuAdded = i;
						}
						addHeader(headerDef);
						hideableColumn.headers.push(headerDef);
					}
				} else if (controller.header.rows.headerRows) {
					let headerDef = template.transformHtmlToElement("<ax-column-header row-index='1'>" + header + "</ax-column-header>");
					if (item.getAttribute("show-header") === "false") headerDef.innerHTML = "";
					headerDef.setAttribute("column-index", columnIndex);
					if (item.hasAttribute("header-title")) headerDef.setAttribute("header-title", item.getAttribute("header-title"));
					else headerDef.setAttribute("header-title", header);
					item.appendChild(headerDef);
					addHeader(headerDef);
					hideableColumn.headers.push(headerDef);
				}
			}
			let axViews = angular.element(item).find(">ax-column-view");
			if (item.hasAttribute("column-type") && !item.hasAttribute("view-type") && axViews.length === 0) item.setAttribute("view-type", item.getAttribute("column-type"));
			if (item.hasAttribute("edit-type") && !item.hasAttribute("view-type") && axViews.length === 0) item.setAttribute("view-type", item.getAttribute("edit-type"));
			if (item.hasAttribute("view-type") && axViews.length === 0) {
				var axView = createElement("ax-column-view", {"type": item.getAttribute("view-type")});
				if (item.hasAttribute("double-binding")) axView.setAttribute("double-binding", item.getAttribute("double-binding"));
				if (item.hasAttribute("locale")) axView.setAttribute("locale", item.getAttribute("locale"));
				if (item.hasAttribute("decimals")) axView.setAttribute("decimals", item.getAttribute("decimals"));
				if (item.hasAttribute("date-format")) axView.setAttribute("date-format", item.getAttribute("date-format"));
				if (item.hasAttribute("datetime-format")) axView.setAttribute("datetime-format", item.getAttribute("datetime-format"));
				if (item.hasAttribute("crud-buttons")) axView.setAttribute("crud-buttons", item.getAttribute("crud-buttons"));
				if (item.hasAttribute("style")) axView.setAttribute("style", item.getAttribute("style"));
				if (item.hasAttribute("class")) axView.setAttribute("style", item.getAttribute("class"));
				item.appendChild(axView);
			}
			axViews = angular.element(item).find(">ax-column-view");
			if (axViews.length > 0) {
				if (bindTo && !axViews[0].hasAttribute("bind-to")) axViews[0].setAttribute("bind-to", bindTo);
				var viewBindTo = axViews[0].getAttribute("bind-to");
				if (viewBindTo && !angular.isDefined(controller.dataItemModel[viewBindTo])) template.addDataItemModelField(viewBindTo);
			} else {
				if (bindTo && !angular.isDefined(controller.dataItemModel[bindTo])) {
					let axView = template.createDOMElement("ax-column-view", item.attributes);
					axView.setAttribute("type", 'text');
					axView.setAttribute("bind-to", bindTo);
					axView.removeAttribute("width");
					template.addDataItemModelField(bindTo);
					item.appendChild(axView);
				} else {
					let attrs = item.attributes;
					var otherElements = angular.element(item).find('>ax-column-filter,>ax-column-header,>ax-column-edit,>ax-column-editor').remove();
					let axView = createElement("ax-column-view", attrs, item.innerHTML);
					axView.removeAttribute("width");
					item.innerHTML = otherElements.outerHTML();
					item.appendChild(axView);
				}
			}
			if (!item.hasAttribute("column-type")) {
				let columnType = angular.element(item).find(">ax-column-view").getAttribute("view-type");
				hideableColumn.columnType = columnType;
			} else hideableColumn.columnType = item.getAttribute("column-type");

			if (item.hasAttribute("edit-type")) {
				if (angular.element(item).find(">ax-column-edit").length === 0) {
					angular.element(item).find(">ax-column-edit").remove();
					let axEdit = createElement("ax-column-edit", {"type": item.getAttribute("edit-type")});
					if (item.hasAttribute("edit-tooltip")) axEdit.setAttribute("tooltip", item.getAttribute("edit-tooltip"));
					item.appendChild(axEdit);
				}
			}

			let axEdits = template.getDirectChildrenOfType("AX-COLUMN-EDIT", item);
			if (axEdits.length > 0) {
				if (bindTo && !axEdits[0].hasAttribute("bind-to")) axEdits[0].setAttribute("bind-to", bindTo);
				axEdits[0].style.width = item.style.width;
			}
			var axFilterMenu = template.getDirectChildrenOfType("AX-COLUMN-FILTER-MENU", item);
			if (item.hasAttribute("filter-menu") && axFilterMenu.length === 0) {
				createElement("ax-column-filter-menu", {"data-type": item.getAttribute("filter-menu")}, "", item);
				axFilterMenu = template.getDirectChildrenOfType("AX-COLUMN-FILTER-MENU", item);
			}

			if (axFilterMenu.length > 0) {
				template.removeChildrenOfType("AX-COLUMN-FILTER", item);
				if (axFilterMenu[0].hasAttribute('type')) {
					axFilterMenu[0].setAttribute('filter-type', axFilterMenu[0].getAttribute('type'));
					axFilterMenu[0].removeAttribute("type");
				}
				if (!axFilterMenu[0].hasAttribute("data-type")) throw "No data-type attribute set for ax-column-filter-menu " + bindTo;
				axFilterMenu[0].setAttribute("column-index", columnIndex);
				if ((bindTo) && !axFilterMenu[0].hasAttribute("bind-to")) axFilterMenu[0].setAttribute("bind-to", bindTo);
				if ((sortable && sortable !== bindTo) && !axFilterMenu[0].hasAttribute("invariant-field")) axFilterMenu[0].setAttribute("invariant-field", sortable);
				axFilterMenu[0] = template.config.filters.menu(axFilterMenu[0]);
				invariantField = axFilterMenu[0].getAttribute("invariant-field") ? axFilterMenu[0].getAttribute("invariant-field") : invariantField;
				var options = template.getDirectChildrenOfType("AX-COLUMN-FILTER", axFilterMenu[0]);
				if (item.hasAttribute("initial-filter-option") || axFilterMenu[0].hasAttribute("initial-filter-option")) {
					let initialOption = item.getAttribute("initial-filter-option") || axFilterMenu[0].getAttribute("initial-filter-option");
					let reordered = [];
					options.each(function (option) {
						if (option.getAttribute("label") !== initialOption) return true;
						reordered.push(option);
						return false;
					}, this);
					options.each(function (option) {
						if (option.getAttribute("label") === initialOption) return true;
						reordered.push(option);
					}, this);
					options = reordered;
				}
				for (let i = 0; i < options.length; i++) {
					let option = options[i];
					let bindTo = axFilterMenu[0].getAttribute("bind-to");
					option.setAttribute("column-index", columnIndex);
					if (option.hasAttribute('type')) {
						option.setAttribute('filter-type', option.getAttribute('type'));
						option.removeAttribute("type");
					}
					option.setAttribute('data-type', axFilterMenu[0].getAttribute('data-type'));
					if (axFilterMenu[0].hasAttribute("convert-type")) option.setAttribute("convert-type", axFilterMenu[0].getAttribute("convert-type"));
					if (axFilterMenu[0].hasAttribute("convert-format")) option.setAttribute("convert-format", axFilterMenu[0].getAttribute("convert-format"));
					if (!option.hasAttribute("label")) throw "Filter menu option " + options + " for " + bindTo + " column doesn't have label attribute";
					if (!option.hasAttribute("bind-to") && bindTo) option.setAttribute("bind-to", bindTo);
					if (!option.hasAttribute("invariant-field") && sortable !== bindTo) option.setAttribute("invariant-field", sortable);
					if (item.hasInfo) option.setAttribute("has-info", true);
					if (item.isEditable) option.setAttribute("editable", true);

					if (option.getAttribute("filter-type") === "dropdown-list-distinctvalues") {
						option.setAttribute("filter-type", "dropdown-list");
						if (option.getAttribute("data-type") === "boolean") {
							option.setAttribute("datasource", "$ctrl.booleanValues");
							option.setAttribute("order-by", "-value");
							option.setAttribute("item-id-field", "value");
							option.setAttribute("item-display-field", "text");
							option.setAttribute("show-check-all", "false");
							option.setAttribute("show-uncheck-all", "false");
							option.setAttribute("popup-height", "200px");
						} else {
							option.setAttribute("datasource", "$ctrl.distinctValues['" + bindTo + "'].data");
							option.setAttribute("order-by", invariantField ? "invariant" : "value");
							option.setAttribute("item-id-field", "id");
							option.setAttribute("show-search", "true");
							option.setAttribute("add-empty-row", "true");
							option.setAttribute("close-on-mouseleave", "true");
							// option.setAttribute("list-tds-resizable", "true");
							option.setAttribute("popup-height", "300px");
							option.setAttribute("show-uncheck-all", "true");
							if (invariantField) option.setAttribute("item-invariant-field", "invariant");
							if (axViews.length === 1) {
								let checkedClass = 'fa fa-check-square-o';
								let uncheckedClass = 'fa fa-square-o';
								var checkBoxes = createElement('i', {
									class: 'btn icon',
									style: "position:absolute;left:0",
									"ng-class": "{'" +
										checkedClass +
										"': $ctrl.isSelected(dataItem), '" +
										uncheckedClass +
										"': !$ctrl.isSelected(dataItem)}"
								});
								// var checkViewColumn = createElement("ax-column-view", {type: "custom", style: "padding:0;text-align:center"}, checkBoxes);
								// createElement("ax-column", {width: template.attributes["row-data-height"] + "px"}, checkViewColumn, option);
								var optionTemplate = angular.copy(axViews[0]);
								optionTemplate.appendChild(checkBoxes);
								optionTemplate.setAttribute('class', (optionTemplate.getAttribute('class') ? optionTemplate.getAttribute('class') + " " : "") + "record-selectable-view");
								optionTemplate.setAttribute("bind-to", "value");
								optionTemplate.style["min-width"] = "";
								let column = createElement("ax-column", {width: "100%", "bind-to": "value"}, optionTemplate);
								var search = createElement('ax-column-filter', {type: 'text'});
								if (invariantField) search.setAttribute('bind-to', "invariant");
								column.appendChild(search);
								option.appendChild(column);
							}
						}
						template.controller.hasDistinctValues = true;
						template.controller.distinctValues[bindTo] = {
							dataType: axFilterMenu[0].getAttribute("data-type"),
							convertType: axFilterMenu[0].getAttribute("convert-type"),
							inputFormat: axFilterMenu[0].getAttribute("convert-format"),
							invariantField: invariantField,
							data: []
						};
					}
				}
				if (options.length > 0) item.appendChild(angular.copy(options[0]));
			}
			var axFilters = template.getDirectChildrenOfType("AX-COLUMN-FILTER", item);
			if (axFilters.length > 0) {
				let option = axFilters[0];
				if (axFilters[0].hasAttribute('type')) axFilters[0].setAttribute('filter-type', axFilters[0].getAttribute('type'));
				axFilters[0].setAttribute("column-index", columnIndex);
				if (bindTo && !axFilters[0].hasAttribute("bind-to")) axFilters[0].setAttribute("bind-to", bindTo);
				if (sortable && !axFilters[0].hasAttribute("bind-to")) axFilters[0].setAttribute("bind-to", sortable);
				if (axFilters[0].getAttribute('filter-type') === "dropdown-list-distinctvalues") {
					option.setAttribute("filter-type", "dropdown-list");
					template.controller.hasDistinctValues = true;
					axFilters[0].setAttribute("datasource", "");
					template.controller.distinctValues[bindTo] = {
						dataType: option.getAttribute("data-type"),
						convertType: option.getAttribute("convert-type"),
						inputFormat: option.getAttribute("convert-format"),
						invariantField: invariantField,
						data: []
					};
					if (!option.hasAttribute("selectable-rows")) option.setAttribute("selectable-rows", "multiple");
					option.setAttribute("datasource", "$ctrl.distinctValues['" + bindTo + "'].data");
					option.setAttribute("order-by", invariantField ? "invariant" : "value");
					option.setAttribute("item-id-field", "id");
					option.setAttribute("show-search", "true");
					option.setAttribute("add-empty-row", "true");
					option.setAttribute("close-on-mouseleave", "true");
					// option.setAttribute("list-tds-resizable", "true");
					option.setAttribute("popup-height", "200px");
					option.setAttribute("show-uncheck-all", "true");
					if (invariantField) option.setAttribute("item-invariant-field", "invariant");
					if (axViews.length === 1) {
						let checkedClass = 'fa fa-check-square-o';
						let uncheckedClass = 'fa fa-square-o';
						let checkBoxes = createElement('i', {
							style: 'margin-right:3px;width:16px',
							"ng-class": "{'" +
								checkedClass +
								"': $ctrl.isSelected(dataItem), '" +
								uncheckedClass +
								"': !$ctrl.isSelected(dataItem)}"
						});
						let checkViewColumn = createElement("ax-column-view", {type: "custom", style: "padding:0"}, checkBoxes);
						createElement("ax-column", {width: "24px"}, checkViewColumn, option);

						let optionTemplate = angular.copy(axViews[0]);
						optionTemplate.setAttribute("bind-to", "value");
						optionTemplate.style["min-width"] = "";
						let column = createElement("ax-column", {width: "100%", "bind-to": "value"}, optionTemplate);
						let search = createElement('ax-column-filter', {type: 'text'});
						if (invariantField) search.setAttribute('bind-to', "invariant");
						column.appendChild(search);
						option.appendChild(column);
					}
				}
			}
			if (!hideableColumn.hidden) controller.columns.visible.push(hideableColumn);
			controller.columns.hideable.push(hideableColumn);
			let column = angular.copy(item);

			if (template.attributes['add-empty-row'] === 'true') {
				hideableColumn.templates.td.empty = new axTableColumn(column, template.controller, false);
			}
			hideableColumn.templates.td.view = new axTableColumn(column, template.controller, false);
			let tdEdit = new axTableColumn(column, template.controller, true);
			let editTemplate = tdEdit.children[0];

			if (editTemplate && template.attributes["edit-row"])
				if (!editRowInEditor) {
					editTemplate.setAttribute('ng-if', template.ngIf.edit);
					hideableColumn.templates.td.view.children[0].setAttribute('ng-if', template.ngIf.view);
					hideableColumn.templates.td.view.appendChild(editTemplate);
				} else hideableColumn.templates.td.editHTML = editTemplate.outerHTML;

			hideableColumn.templates.td.viewHTML = hideableColumn.templates.td.view.innerHTML;
			//if (editRowInEditor) axTableEditor.createControls(template, editorTemplate, hideableColumn);
			//console.log("templates", hideableColumn.templates.td);
		});
		this.timeStampLog(false, "pivot-create", "template columns parsing");
		controller.element.tableWidth = tableWidth;
		this.tableWidth = tableWidth;
		//if (this.attributes["has-horizontal-virtual-scroll"] === "auto") {
		//	this.attributes["has-horizontal-virtual-scroll"] = tableWidth > 2 * window.innerWidth ? "true" : "false";
		//	console.log("turn auto has-horizontal-virtual-scroll attribute to: ", this.attributes["has-horizontal-virtual-scroll"]);
		//}
		this.buildColumnsHeaderStructure();
		this.timeStampLog(false, "pivot-create", "template header structure build");
		let lastColumn;
		let lastLeftFreezedColumn;
		let firstRightFreezedColumn;
		controller.columns.hideable.each(function (column) {
			if (column.hidden) return;
			if (column.leftFreezedColumn) {
				lastLeftFreezedColumn = column;
			} else {
				if (column.rightFreezedColumn) {
					if (!firstRightFreezedColumn) firstRightFreezedColumn = column;
				} else lastColumn = column;
			}
			return;
		});
		if (lastColumn) {
			lastColumn.templates.td.view.setAttribute("class", (lastColumn.def.getAttribute("class") || "") + " last-column");
		}
		if (lastLeftFreezedColumn) lastLeftFreezedColumn.templates.td.view.setAttribute("class", (lastLeftFreezedColumn.def.getAttribute("class") || "") + " last-column");
		//console.log("last left", lastLeftFreezedColumn);
		controller.columns.lastLeftFreezedColumn = lastLeftFreezedColumn;
		controller.columns.firstRightFreezedColumn = firstRightFreezedColumn;
		let groupsOrderBy = this.controller.attrs.groupsOrderBy.split(",");
		for (let i = 0; i < groupsOrderBy.length && controller.element.type === "table"; i++) {
			let field = groupsOrderBy[i];
			if (field === "") continue;
			let column = controller.columns.sortable.findObject(field, "field");
			if (sortableCnt > 0 && !column) console.error("You must define an ax-column with sortable attribute = " + field);
		}

		this.grouping.generateGroupingTemplates();
		this.timeStampLog(false, "pivot-create", "template grouping template");
		this.sortableNo = sortableCnt;
		this.hideableNo = hideableCnt;
		controller.hideableNo = hideableCnt;
	}


	getExportDefs() {
		if (this.attributes["disable-export"] === "true") return;
		var exportDef = this.getDirectChildrenOfType('ax-export', this.element.source[0]);
		if (exportDef.length === 0) {
			exportDef = createElement('ax-export', {"file-name": "DataExport", "export-type": "client"});
			this.element.source.appendChild(exportDef);
		} else exportDef = exportDef[0];
		let def = {
			fileName: exportDef.getAttribute('file-name') || "DataExport",
			exportType: exportDef.getAttribute('export-type') || "client",
			apiController: exportDef.getAttribute('api-controller') || "axTable",
			dataValue: exportDef.getAttribute('data-value') || "view",
			viewTemplateLimit: exportDef.getAttribute('view-template-limit') || 10001,
			list: $(exportDef).find("ax-export-list").getAttributes(),
			item: $(exportDef).find("ax-export-item").getAttributes()
		};
		def.item.element = $(exportDef).find("ax-export-item");
		def.list.element = $(exportDef).find("ax-export-list");
		this.controller.export.def = def;
	}


	createVerticalScroller(container) {
		var scroller = createElement('div', {role: "vertical-scroller"});
		scroller.style.cssText = "position:absolute;right:0;top:0;bottom:0;overflow-x:hidden;overflow-y:scroll;width:auto";
		if (this.attributes['table-overflow-y']) scroller.style["overflow-y"] = this.attributes['table-overflow-y'];
		var table = createElement('div', {class: 'virtual-table', style: "height:1px;width:1px;visibility:hidden", ngIf: "!$ctrl.inlineEditing"}, "");
		scroller.appendChild(table);
		container.appendChild(scroller);

		var virtualContainer = createElement('div', {
			role: "virtual-container",
			"ng-if": "$ctrl.$$virtualTest",
			"bind-html-compile": "$ctrl.virtualHtml"
		});
		virtualContainer.style.cssText = "position:relative;visibility:hidden;z-index:-1;width:auto;height:auto;";
		container.appendChild(virtualContainer);
	}

	createLeftFreezedColumns(tableWrapper) {
		var originalTable = angular.element(this.table);
		originalTable[0].removeAttribute('width');
		originalTable[0].style.cssText = "table-layout:fixed;width:0 !important;";

		var wrapper = createElement('div', {role: 'table-left'});
		//padding-right:1px;border-right:1px solid sunt corelate cu linia din $layout:
		//leftPanelWidth = Math.min(tableWidth + 2, leftPanelWidth);
		wrapper.style.cssText = "position:absolute;left: 0;top: 0;bottom:0;max-width:40%;overflow-x:auto;padding-right:1px;border-right:1px solid;overflow-y:hidden";
		wrapper.addClass('left-freezed-columns');
		if (this.attributes["page-size"] !== 'ALLXX') {
			var leftSideHeaderTable = angular.copy(originalTable);
			leftSideHeaderTable.find('tbody, tfoot, th:not([left-freezed-column]), col:not([left-freezed-column])').remove();
			//leftSideHeaderTable.find('thead').css("visibility", "visible");
			leftSideHeaderTable.find("th[left-freezed-column], td[left-freezed-column], col[left-freezed-column]").attr("left-freezed-column", "").addClass("left-side").removeClass("body");
			leftSideHeaderTable.find("tr>th[left-freezed-column]:not([hidden-column]):last-child").addClass("last-column");
			leftSideHeaderTable.find("tr").addClass("left-side");
			leftSideHeaderTable[0].style.cssText += 'border-left:none;border-top:none;border-bottom:none;';
			leftSideHeaderTable.attr('role', 'header');
			wrapper.appendChild(leftSideHeaderTable[0]);

			let leftSideBodyTable = angular.copy(originalTable);
			leftSideBodyTable.find("thead, td:not([left-freezed-column]), col:not([left-freezed-column])").remove();
			leftSideBodyTable.css({"border-top": "none", "border-bottom": "none", "border-left": "none", 'margin-top': '0', "margin-right": "0"});
			leftSideBodyTable.find("th[left-freezed-column], td[left-freezed-column], col[left-freezed-column]").attr("left-freezed-column", "").addClass("left-side").removeClass("body");
			leftSideBodyTable.find("tr").addClass("left-side");


			var bodyWrapper = createElement('div', {role: 'body', style: "position:relative"});
			bodyWrapper.appendChild(leftSideBodyTable[0]);
			wrapper.appendChild(bodyWrapper);
		} else {
			let leftSideBodyTable = angular.copy(originalTable);
			leftSideBodyTable.find("th:not([left-freezed-column]), td:not([left-freezed-column]), col:not([left-freezed-column])").remove();
			leftSideBodyTable.css({"border-top": "none", "border-bottom": "none", "border-left": "none", 'margin-top': '0', "margin-right": "0"});
			leftSideBodyTable.find("th[left-freezed-column], td[left-freezed-column], col[left-freezed-column]").attr("left-freezed-column", "").addClass("left-side").removeClass("body");
			leftSideBodyTable.find("tr>th[left-freezed-column]:not([hidden-column]):last-child").addClass("last-column");
			leftSideBodyTable.find("tr").addClass("left-side");
			wrapper.appendChild(leftSideBodyTable[0]);
		}

		var fakeScrollbar = createElement("div", {
			role: "fake-scrollbar",
			left: '',
			style: "position:absolute;left:0;bottom:0;right:1px;height:0;"
		});
		wrapper.appendChild(fakeScrollbar);
		tableWrapper.appendChild(wrapper);
	}

	createRightFreezedColumns(tableWrapper) {
		var originalTable = angular.element(this.table);
		originalTable[0].removeAttribute('width');
		originalTable[0].style.cssText = "table-layout:fixed;width:0 !important;";
		originalTable.find("[role=table-scroller]>table [right-freezed-column].empty-column").removeAttr("right-freezed-column");

		var wrapper = createElement('div', {role: 'table-right'});
		wrapper.style.cssText = "position:absolute;right: 0;top: 0;bottom:0;;max-width:30%;overflow-x:auto;overflow-y:hidden;border-left:1px solid;padding-left:1px;";
		wrapper.addClass('right-freezed-columns');

		var rightSideHeaderTable = angular.copy(originalTable);
		rightSideHeaderTable.find('tbody, tfoot, th:not([right-freezed-column]), col:not([right-freezed-column]), .empty-column').remove();
		rightSideHeaderTable.find('thead').find("th.last-column").removeClass("last-column");
		rightSideHeaderTable[0].style.cssText += 'border:none';
		rightSideHeaderTable.attr('role', 'header');

		var rightSideBodyTable = angular.copy(originalTable);
		rightSideBodyTable.find("thead, td:not([right-freezed-column]), col:not([right-freezed-column])").remove();
		rightSideBodyTable.css({"border": "none", 'margin-top': '0'});
		rightSideBodyTable.find("td[right-freezed-column], col[right-freezed-column]").attr("right-freezed-column", "").addClass("right-side").removeClass("body").removeClass("last-column");
		rightSideBodyTable.find("tr").addClass("right-side");
		wrapper.appendChild(rightSideHeaderTable[0]);


		var bodyWrapper = createElement('div', {role: 'body', style: "position:relative"});
		bodyWrapper.appendChild(rightSideBodyTable[0]);
		wrapper.appendChild(bodyWrapper);
		var fakeScrollbar = createElement("div", {
			role: "fake-scrollbar",
			right: '',
			style: "position:absolute;right:0;bottom:0;height:0;left:0"
		});
		wrapper.appendChild(fakeScrollbar);
		tableWrapper.appendChild(wrapper);
	}

	hasToolbar() {
		var axToolbarDefs = this.getDirectChildrenOfType("AX-TOOLBAR", this.element.source[0]);
		return (axToolbarDefs.length > 0);
	}

	hasSettingsButton() {
		var axToolbarDefs = this.getDirectChildrenOfType("AX-TOOLBAR", this.element.source[0]);
		if (axToolbarDefs.length === 0) return false;
		else return true;
	}

	isCustomizableFreezedColumns() {
		if (this.attributes["freezed-columns-enabled"] === "false") return false;
		if (!this.hasToolbar() || this.attributes["customizable-freezed-columns"] === "false") {
			this.attributes["customizable-freezed-columns"] = "false";
			return false;
		} else {
			this.attributes["customizable-freezed-columns"] = "true";
			return true;
		}
	}

	createLastColumn() {
		if (this.element.type === "table") {
			let axColumn = this.createDOMElement('ax-column', {
				width: "300px",
				class: 'grouping-column',
				header: "Grouping",
				showHeader: "false",
				headerMenu: "false",
				headerTitle: "Grouping",
				exportable: "true",
				bindTo: "$$uid",
				hideable: "false",
				hiddenColumn: "true"
			});
			let $source = this.element.source;
			let columns = $source.find(">ax-column");
			$source.find(">ax-column").remove();
			createElement("ax-column-view", {type: "custom"}, "", axColumn);
			$source[0].appendChild(axColumn);
			this.controller.hasGroupingColumn = true;
			columns.each(function (i, column) {
				if (column.getAttribute("bind-to") === "$$uid") return;
				$source[0].appendChild(column);
			});
			if (this.controller.attrs.leftFreezedColumns === 0) {
				this.controller.attrs.leftFreezedColumns++;
				this.attributes["left-freezed-columns"] = this.controller.attrs.leftFreezedColumns;
			}

		}
		if (this.attributes["no-empty-column"] === "true") return;
		var columnsWithWidth100Percent = this.element.source.find('>ax-column[width="100%"]');
		if (columnsWithWidth100Percent.length > 0) {
			this.controller.hasEmptyColumn = columnsWithWidth100Percent.hasClass("empty-column");
			this.hasEmptyColumn = this.controller.hasEmptyColumn;
			return;
		}
		var width = this.element.source[0].style.width;
		if (width === "auto") return;

		let axColumn = this.createDOMElement('ax-column', {
			width: "100%",
			class: 'empty-column',
			header: "Empty column",
			showHeader: false,
			showInEditor: false,
			exportable: false,
			hideable: false
		});
		this.hasEmptyColumn = true;
		this.controller.hasEmptyColumn = true;
		this.element.source[0].appendChild(axColumn);
	}

	getColumnWidth(columnIndex, colSpan) {
		var columnWidth = this.controller.columns.defs[columnIndex].getAttribute("width");
		if (colSpan > 0) {
			columnWidth = 0;
			let childColumnIndex = columnIndex;
			for (let j = 0; j < colSpan; j++) {
				let column = this.controller.columns.defs[childColumnIndex];
				if (!column) console.error("incorect colspan for columnIndex: " + columnIndex, "colspan:", colSpan, this.controller.columns.defs[columnIndex].outerHTML);
				columnWidth += parseInt(column.getAttribute("width"));
				childColumnIndex++;
			}
			return columnWidth + 'px';
		} else return columnWidth;
	}

	forEachColumn(iterator) {
		this.forEachChildrenOfType("ax-column", iterator, this.element.source[0]);
	}

	createPaginatorWrapper() {
	}

	setColumnColumnsRange(element, colSpan, columnIndex, corectingColSpan) {
		var columnsRange = '';
		for (let j = 0; j < colSpan; j++) {
			columnsRange += (j > 0 ? "," : "") + columnIndex;
			columnIndex++;
		}
		element.setAttribute("columns-range", columnsRange);
		if (corectingColSpan) return this.setColumnColspan(element);
	}

	getCorrectColspan(startIndex, colspan) {
		let colSpan = 0;
		for (let i = 0; i < colspan; i++) {
			let columnIndex = startIndex + i;
			let column = this.controller.columns.hideable[columnIndex];
			colSpan += column.isScrollVisible ? 1 : 0;
		}
		return colSpan;
	}

	setColumnColspan(column) {
		var columnsRangeString = column.getAttribute('columns-range');
		if (!columnsRangeString) columnsRangeString = column.getAttribute("column-index");
		var columnsRange = columnsRangeString.split(",");
		let colSpan = 0;
		let exportColSpan = 0;

		for (let i = 0; i < columnsRange.length; i++) {
			let index = parseInt(columnsRange[i]);
			let original = this.controller.columns.hideable[index];
			if (!original) throw "Not found column with index: " + index;
			if ((original.leftFreezedColumn || column.rightFreezedColumn) ? !original.hidden : (original.isScrollVisible && !original.hidden)) colSpan++;
			if (!original.exportable || original.hidden) continue;
			if (exportColSpan === 0) column.setAttribute('export-column-index', original.exportColumnIndex);
			exportColSpan++;
		}
		if (colSpan === 0) column.style.display = '';
		column.setAttribute("colspan", colSpan);
		column.setAttribute("export-colspan", exportColSpan);
		return colSpan;
	}


	changeCurrentFilter(column, filter) {
		var template = angular.copy(filter.template);
		var fieldName = template.getAttribute("bind-to");
		var columnIndex = template.getAttribute("column-index");
		var label = template.getAttribute("label");
		let $controller = this.controller;
		$controller.clearFilterColumn(fieldName);
		$controller.showFilters = true;
		var element = new axTableColumnFilter(template, this);
		$controller.columns.filters[columnIndex] = {
			html: $controller.filterLeftBorder + element.outerHTML + $controller.filterRightBorder,
			name: label
		};
		let th = $controller.getDomElement("tr[role=filters]>th[column-index=" + columnIndex + "]");
		$($controller.element.initial).find(">ax-column[header='" + column.getAttribute("header") + "']").each(function (i, column) {
			column.setAttribute("initial-filter-option", label);
		});
		th.html($controller.filterLeftBorder + element.outerHTML + $controller.filterRightBorder);
		$controller.$compile(th)($controller.scope());
	}

	createDynamicColumns(controller, config, data) {
		if (!angular.isObject(config)) config = {datasource: config};
		var datasource = config.datasource;
		var axTableDef = angular.copy(controller.$template.element.initial[0]);
		angular.element(axTableDef).find('> ax-column').remove();
		angular.element(axTableDef).find('> ax-groups').remove();
		var $element = controller.$template.element.linked.parent();
		$element.attr('datasource', datasource);
		$element.attr('columns-autofit', 'true');
		$element.attr('order-by', '');
		if (!data) throw "No datasource exist for " + datasource;
		var columns = [];
		if (config.columnsList) columns = config.columnsList;
		else {
			var firstItem = data[0];
			for (let column in firstItem) {
				if (firstItem.hasOwnProperty(column)) {
					columns.push(column);
				}
			}
		}
		for (var l = 0; l < columns.length; l++) {
			let columnName = columns[l];
			let column;
			if (columnName === "$index") {
				column = createElement('ax-column', {
					'header': "Index",
					'width': '100px'
				});
				let axView = createElement('ax-column-view', {"ng-bind": "(dataItem? $ctrl.dataItemGetIndex(dataItem, 'filtered')+1: 'null')"});
				column.appendChild(axView);
			} else {
				column = createElement('ax-column', {
					"bind-to": columnName,
					"sortable": columnName,
					'header': columnName,
					'width': '100px'
				});
				let axFilter = createElement('ax-column-filter', {type: 'text'});
				column.appendChild(axFilter);
			}
			axTableDef.appendChild(column);
		}
		if (config.groups) {
			let groups = createElement("ax-groups");
			for (let i = 0; i < config.groups.length; i++) {
				let group = config.groups[i];
				let innerHtml = "";
				if (group.header) innerHtml += group.header.outerHTML;
				else {
					let header = createElement('ax-group-header', {class: "inline allWidth"});
					header.appendChild(createElement('div', {style: "margin-right:5px"}, group.bindTo + ":"));
					header.appendChild(createElement('div', {style: "font-weight:bold", 'ng-bind': "dataItem.value"}));
					header.appendChild(createElement('div', {style: "font-weight:normal;margin-left:5px", 'ng-bind': "'('+dataItem.groupRecords+')'"}));
					innerHtml += header.outerHTML;
				}
				if (group.footer) innerHtml += group.footer.outerHTML;
				if (group.calculations) {
					for (let calculationName in group.calculations) {
						let calculationDef = group.calculations[calculationName];
						innerHtml += createElement("ax-calculation", {
							expression: calculationDef.expression,
							column: calculationDef.column,
							displayLabel: calculationDef.displayLabel || false,
							name: calculationName,
							"initial-value": calculationDef.initialValue || "0",
							"aggregate-type": calculationDef.type
						}).outerHTML;
						$(axTableDef).find(">ax-column[bind-to='" + calculationDef.column + "']").attr("view-type", "number");

					}
				}
				createElement("ax-group", {
					expression: "dataItem['" + group.bindTo + "']",
					collapsible: true,
					showCalculationsOn: group.calculations ? group.showCalculationsOn : "false",
					collapsed: i === config.groups.length - 1,
					order: group.order || group.bindTo,
					hideEmptyGroup: true,
					"label": group.bindTo,
				}, innerHtml, groups);
			}
			axTableDef.appendChild(groups);
		}
		controller.$template.element.updated = angular.element(axTableDef);
		controller.dataReload = true;
		controller.filters = this.filtersInit();
		controller.changePagination = true;
		controller.render();
	}

	filtersInit() {
		return {config: {globalSearch: {}}, globalSearch: undefined, range: {}, arrayValues: {}, values: {}};
	}

	setAttribute(attrName, attrValue) {
		this.attributes[attrName] = attrValue;
		let attributeCamelCaseName = axUtils.camelCase(attrName);
		this.controller.attrs[attributeCamelCaseName] = attrValue;
		if (attrName === "paginate" && attrValue === "false") this.setAttribute("page-size", 0);
		if (attrName === "page-size" && attrValue === "all") this.setAttribute("paginate", "client");
	}
}