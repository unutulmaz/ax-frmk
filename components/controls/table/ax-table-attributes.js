class axTableAttrs {
	constructor() {
		/**
		 * Name for variable witch will be injected in view controller.
		 * This can be already create by developer in View controller
		 * with some attributes to overwrite default ax-table behaviour.
		 * */
		this.debug = "false";
		this.hasGrid = "false";
		this.config = "";
		this.childName = "";
		this.parentConfig = "";
		this.hideable = "false";
		this.exportFormats = "All,Aggregations,Data";
		/**
		 *@description DataItem Field name with primary key
		 */
		this.itemIdField = "";
		/**
		 * DataItem Field name for display on list column
		 * Default = itemIdField
		 * */
		this.itemDisplayField = "";
		/**
		 * DataItem Field name for invariant column (no diacritics, etc)
		 * */
		this.itemInvariantField = "";
		/**
		 * If true, no header will be shown
		 * */
		this.noHeader = "false";
		/**
		 * controller name for connect to backend
		 * */
		this.apiController = "";
		/**
		 * Action name which get data for ax-table. Default = 'getListAction'
		 * */
		this.apiLoadDataAction = "getListAction";
		/**
		 * Url for edit item html template
		 * */
		this.editFormTemplate = "";
		/**
		 * If true, on edit item, ax-dt make a request to server to retrieve item,
		 * else will return to edit the item from ax-Table Datasource
		 * */
		this.refreshItemOnEdit = "";
		this.refreshItemOnSave = "false";
		/**
		 * Method to open editFormTemplate.
		 * Values: ["ng-dialog"]
		 * */
		this.loadFormType = "ng-dialog";
		/**
		 * How user will edit row.
		 * Values:
		 * - popup, in this case you need to use editRowTemplate for edit item
		 * - inline, user can edit item: In actions columns shown Save and Undo button
		 * - inline-cell, user can edit excel like. Data will be saved on blur cell event
		 * */
		this.editRow = "";
		this.canAdd = true;
		/**
		 * You can insert in server response an extra property with other data you need.
		 * loadDataResponse can map server properties to scope controller variables
		 * Multiple values are separated by ';'
		 * Examples:
		 * load-data-responses='extra.periods=>periods;data.test=>form1.test'
		 * */
		this.loadDataResponses = "";
		/**
		 * variable name for holding data for ax-table
		 * */
		this.datasource = "";

		this.distinctValuesDatasource = "";
		/**
		 * If ax-table will retrieve data at element initialization, or not.
		 * autoLoadData=false - data will not be retried from server at initialization
		 * You can use command table.$ctrl.loadData() to get data
		 * when you want (table is config variable name)
		 * Default = true
		 * */
		this.autoLoadData = "true";
		this.showLoader = "false";
		/**
		 * If true, at initialization, axTable will get UI focus
		 * Default = false
		 * */
		this.autoFocus = "false";
		/**
		 * overflow-x style attribute for table.
		 * Default = auto
		 * */
		this.tableOverflowX = "auto";
		/**
		 * overflow-y style attribute for table.
		 * Default=scroll
		 * */
		this.tableOverflowY = "scroll";
		/**
		 * Multiple attributes can set for table element created
		 * inside ax-DataTable component
		 * */
		this.tableAttributes = "";
		/**
		 * Multiple attributes can set for tbody table element created
		 * inside ax-DataTable component
		 * */
		this.tbodyAttributes = "";
		/**
		 * Attributes for tbody tr elements
		 * */
		this.tbodyTrAttributes = "";
		/**
		 * Function which will be evaluated for each rows.
		 * Can affect performance
		 * Function must return string with classes for rows separated by space
		 * */
		this.rowCssClasses = "";
		/**
		 * Order by fields list, separated by ','
		 * and using sign minus for descending order
		 * Example: Name,-Age
		 * */
		this.orderBy = "";
		this.tdsResizable = "false";
		/**
		 * If false, on CRUD operations in popup datasource
		 * will not by reordered and filtered, without command
		 * table.$ctrl.applyOrderToChanges()
		 * Variable table.$ctrl.hasChanges - indicate
		 * when datasource has changes without order && filter apply
		 * Default=true
		 * */
		this.applyChangesOnSave = "false";
		/**
		 * Do not use this for groups order.
		 * */
		this.groupsOrderBy = "";
		/**
		 * If true, on top of list ax-table will insert a blank record
		 * Default = false
		 * */
		this.addEmptyRow = "false";
		/**
		 * If rows are selectable
		 * Values: [""; "single"; "multiple"]
		 * Default = ""
		 * */
		this.selectableRows = "";
		/**
		 * If selectableRows != '', selectableRowsModel is the holder for rows/row selected
		 * */
		this.selectableRowsModel = "";
		/**
		 * What to store in selectableRowsModel? Id's or objects?
		 * Values: 'id-field' or  'object'
		 * */
		this.selectableRowsModelType = "";
		/**
		 * If row will be selected on row click event
		 * */
		this.selectOnClickRow = "true";
		/**
		 * A condition (function) to disable a row in ax-table
		 * */
		this.rowIsDisabled = "";
		/**
		 * How to paginate data.
		 * Values: 'client', 'false', 'server' - not available
		 * */
		this.paginate = "client";
		/**
		 * If false, paginator will not be shown
		 * Default=true
		 * */
		this.paginatorShow = "true";
		this.showChangePagination = "false";

		/**
		 * How many records has a page:10,20,100,all.
		 * Not recommended page size> 100. axTable will be affected.
		 * pageSize = ALL - virtual pagination - row height must be fixed (row-data-height)
		 * */
		this.pageSize = "ALL";
		/**
		 * For paginate=client and pageSize != all, can define a pageSizes list, which user can select
		 * Default=10,30,50,all
		 * */
		this.pageSizes = "10,20,30,40,50";
		/**
		 * Height in pixels for Data Row, or auto
		 * Default=24
		 * */
		this.rowDataHeight = "24"; // pixels or auto
		/**
		 * Height in pixels for Group Header Row, or auto
		 * Default=26
		 * */
		this.rowGroupHeaderHeight = "24"; // pixels or auto
		/**
		 * Height in pixels for Group Footer Row, or auto
		 * Default=26
		 * */
		this.rowGroupFooterHeight = "24"; // pixels or auto
		/**
		 * Height in pixels for Header Rows, or auto
		 * Default=28
		 * */
		this.rowHeaderHeight = "28"; // pixels or auto
		/**
		 * Is just for internal use
		 * */
		this.hasVariableRowHeight = "false";
		/**
		 * If rows will be draggable
		 * Default false
		 * Draggable use directive ng-sortable
		 * */
		this.draggable = "false";
		/**
		 * Condition for disable drag
		 * */
		this.draggableIsDisabled = "false";
		/**
		 * If true, no empty column will be added after last defined column
		 * Default=false
		 * */
		this.noEmptyColumn = "false";
		/**
		 * If Pivot table can be changed by user
		 * */
		this.customizablePivotTable = "true";
		/**
		 * If data grouping can be changed by user
		 * */
		this.customizableDataGrouping = "true";
		/**
		 * If freezed column is enabled
		 * */
		this.freezeColumnsEnabled = "true";
		/**
		 * If freezed columns can be change by user
		 * */
		this.customizableFreezedColumns = "true";
		/**
		 * How many column are freezed on left
		 * */
		this.leftFreezedColumns = '0';
		/**
		 * How many column are freezed on right
		 * */
		this.rightFreezedColumns = '0';
		/**
		 * If filter wor can by hidden by user
		 * */
		this.hideFiltersRowEnabled = "false";
		/**
		 * If after load data axTable execute command to calculate columns width
		 * */
		this.columnsAutofitEnabled = "true";
		/**
		 * Not used
		 * */
		this.loaderClass = "fa";

		/**
		 * If show tooltips for toolbar buttons
		 * */
		this.showCommandsTooltips = "true";
		/**
		 * If show tooltips for pagination
		 * */
		this.showPaginationTooltips = "true";
		/**
		 * If show tooltips for data cells
		 * */
		this.showDataCellsTooltip = "true";
		/**
		 * If show check boxes for selecting ros, or not.
		 * Values: [""; "false"]
		 * */
		this.itemShowCheck = "";
		this.hasHorizontalVirtualScroll = "false";
		this.dontClosePopup = "false";// used for list with selectable-rows=single and included in a popup
		this.hasDynamicTemplate = "false";
		this.pivotTableClass = "pivot-table";
		this.pivotTableAppendTo = undefined; //that mean is over source ax-table;
		this.customizablePivotTable = "false";
		this.customizableEditMode = "true";
		this.pivotTableShowTemplate = '/components/controls/table/templates/ax-table-pivot-table-show.html';
		this.pivotTableMode = "false"; //pivotTable mode
		this.customizableConfig = "true";
		this.syncHeadersRowsHeight = "false";
		this.exportDisabled = "false";
		var attributes = Object.keys(this);
		var $attrs = {};
		for (let i = 0; i < attributes.length; i++) {
			let camelCase = attributes[i];
			let reversedCamelCase = camelCase.reverseCamelCase();
			$attrs[reversedCamelCase] = this[camelCase];
			// console.log(reversedCamelCase);
		}
		this.$attrs = $attrs;
	}
}
