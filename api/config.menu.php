<?php


$roles = array("guest");


function addMenu($roleId)
{
	$items = array();
	$demoApp = new MenuItem("Presentation");
	$demoApp->appendChild("Framework features", "ax-frmk/features", "app-modules/docs/ax-frmk/features.html");
	$gridDemo = $demoApp->appendChild("Data Grid Samples");
	$gridDemo->appendChild("Unique features", "datagrid-samples/unique-features", "app-modules/datagrid-samples/unique-features/unique-features.html");
	$editing = $gridDemo->appendChild("Data Editing");
	$editing->appendChild("In editor","datagrid-samples/editor-editing", "app-modules/datagrid-samples/editing/editor-editing.html" );
	$editing->appendChild("Inline","datagrid-samples/inline-editing", "app-modules/datagrid-samples/editing/inline-editing.html" );
	$editing->appendChild("Excel like","datagrid-samples/excel-like-editing", "app-modules/datagrid-samples/editing/excel-like-editing.html");
	$editing->appendChild("Switching edit mode","datagrid-samples/switch-editing", "app-modules/datagrid-samples/editing/switch-editing.html");
	$grouping = $gridDemo->appendChild("Data Grouping");
	$grouping->appendChild("By date type field","datagrid-samples/grouping-by-date-field", "app-modules/datagrid-samples/grouping/by-date-field.html");
//	$grouping->appendChild("Full row group header");
//	$grouping->appendChild("Group header on grouping column");
//	$grouping->appendChild("Group header on selected column");
//	$gridDemo->appendChild("Pivot table (100k records)");

	$showCase = $demoApp->appendChild("Show case", "");
	$showCase->appendChild("Countries", "show-case/countries", "app-modules/show-case/catalogs/countries.html");
	$showCase->appendChild("Cities", "show-case/cities", "app-modules/show-case/catalogs/cities.html");
	$showCase->appendChild("Customers", "show-case/customers", "app-modules/show-case/catalogs/customers.html");
	$showCase->appendChild("Products Categories", "show-case/products-categories", "app-modules/show-case/products/products-categories.html");
	$showCase->appendChild("Products", "show-case/products", "app-modules/show-case/products/products.html");
	$showCase->appendChild("Invoices", "show-case/invoices", "app-modules/show-case/invoices/invoices.html");
	if ($roleId !== 'docs') $items[] = $demoApp;
	$docs = new MenuItem("Documentation");
	$docs->showItems = true;
	$frmkDocs = $docs->appendChild("Framework", "");
//	$frmkDocs->appendChild("Get started", "");
//	$frmkDocs->appendChild("Tasks automation", "");

	$controls = $docs->appendChild("Controls", "");
	$axDt = $controls->appendChild("Data Table", "");
	$axDt->showItems = true;
	$axDt->appendChild("Element Attributes", "ax-table/attributes", "app-modules/docs/ax-table/attributes/attributes.html");
	$axDt->appendChild("Position and size", "ax-table/position", "app-modules/docs/ax-table/position/position-tabs.html");
	$axDt->appendChild("Toolbar template", "ax-table/toolbar-template", "app-modules/docs/ax-table/toolbar-template/toolbar-template.html");
	$column = $axDt->appendChild("Column template", "ax-table/column", "app-modules/docs/ax-table/column/column.html");
	$column->appendChild("Header template", "ax-table/column-header", "app-modules/docs/ax-table/column-header/column-header.html");
	$column->appendChild("View template", "ax-table/column-view", "app-modules/docs/ax-table/column-view/column-view.html");
	$column->appendChild("Edit template", "ax-table/column-edit", "app-modules/docs/ax-table/column-edit/column-edit.html");
	$column->appendChild("Editor template", "ax-table/column-editor", "app-modules/docs/ax-table/column-editor/column-editor.html");
	$column->appendChild("Filter template", "ax-table/column-filter", "app-modules/docs/ax-table/column-filter/column-filter.html");
	$column->appendChild("Filter menu template", "ax-table/column-filter-menu", "app-modules/docs/ax-table/column-filter-menu/column-filter-menu.html");
	$axDt->appendChild("Freezing and hiding columns", "ax-table/freezing-columns", "app-modules/docs/ax-table/freezing-columns/freezing-columns.html");
	$axDt->appendChild("Column resize & auto fit", "ax-table/column-resize", "app-modules/docs/ax-table/column-resize/column-resize.html");
	$axDt->appendChild("Records ordering", "ax-table/records-ordering", "app-modules/docs/ax-table/records-ordering/records-ordering.html");
	$axDt->appendChild("Records filtering", "ax-table/records-filtering", "app-modules/docs/ax-table/records-filtering/records-filtering.html");
	$axDt->appendChild("Invariant data column", "ax-table/invariant-column", "app-modules/docs/ax-table/invariant-column/invariant-column.html");
	$axDt->appendChild("Records grouping", "ax-table/records-grouping", "app-modules/docs/ax-table/records-grouping/records-grouping.html");
	$axDt->appendChild("Records editing", "ax-table/records-editing", "app-modules/docs/ax-table/records-editing/records-editing.html");
	$axDt->appendChild("Records selecting", "ax-table/records-selecting", "app-modules/docs/ax-table/records-selecting/records-selecting.html");
	$axDt->appendChild("Records drag & drop", "ax-table/drag-and-drop", "app-modules/docs/ax-table/drag-and-drop/drag-and-drop-tabs.html");
	$axDt->appendChild("Exporting data", "ax-table/export", "app-modules/docs/ax-table/exporting-data/exporting-data.html");
//	$axDt->appendChild("*Records pagination");
//	$axDt->appendChild("*Pivot table");
//	$axDt->appendChild("*Configuration profiles");
//	$axDt->appendChild("*Master-details");
//	$axDt->appendChild("*Connect to backend");
//	$axDt->appendChild("*Keyboard navigation and shortcuts");
//	$axDt->appendChild("*Javascript template generation");
//	$axDt->appendChild("*Cross-browsers support");
//	$axDt->appendChild("*Touch support");
//	$axDt->appendChild("*Internationalization");
//	$axDt->appendChild("*Themes");
//	$axDt->appendChild("*Templates customizations");
//	$axDt->appendChild("*Controller methods");
//	$axDt->appendChild("*Controller properties");
//	$axDt->appendChild("*Dependencies");

	$controls->appendChild("Data List", "ax-list/docs", "app-modules/docs/ax-list/docs.html");
	$controls->appendChild("Dropdown Popup", "ax-dropdown-popup/docs", "app-modules/docs/ax-dropdown-popup/docs.html");
//	$controls->appendChild("Dropdown Data List");
//	$controls->appendChild("Autocomplete");
//	$controls->appendChild("Form");
//	$controls->appendChild("Text");
//	$controls->appendChild("Datetime");
//	$controls->appendChild("Checkbox");
//	$controls->appendChild("RadioOptions");
//	$controls->appendChild("File");
//	$controls->appendChild("FilterPane");
//	$controls->appendChild("ISpinner - work progress");
//	$controls->appendChild("Json Tree View");
//	$controls->appendChild("Tree View");
//	$controls->appendChild("Scroller");
//	$controls->appendChild("Tabs");
//	$controls->appendChild("Api - service for backend connections");
//	$controls->appendChild("AuthService -auth service");
//	$controls->appendChild("DataStore - app factory");
//	$controls->appendChild("DataSet - data factory");

	$devTools = $docs->appendChild("Dev tools", "");
	$devTools->appendChild("Api test", "dev/api-test", "app-modules/dev/api/test.html");
//	$devTools->appendChild("DataTable viewer");


//	$axTest = $docs->appendChild("Test cases");
//	$axTest->appendChild("Test", "test", "app-modules/docs/test/test.html");
//	$axTest->appendChild("Test 1: AxDt Freeze columns, Headers Structure", "test1", "app-modules/docs/test/test1.html");
//	$axTest->showItems = false;
	if ($roleId == 'docs') $items[] = $docs;
	return $items;
}
