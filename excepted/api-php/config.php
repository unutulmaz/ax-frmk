<?php
define("DIR_DATABASE", $_SERVER["DOCUMENT_ROOT"] . "/api/vendor/database/");
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/vendor/Db.php";

$dbConfig = array(
	"dbName" => "axcompdemo",
	"user" => "axcompdemo",
	"password" => "",
	"driver" => "Mysqli",
	"host" => "localhost");
define("DB_DATABASE", $dbConfig["dbName"]);
$dbConnection = new Db($dbConfig["driver"], $dbConfig["host"], $dbConfig["user"], $dbConfig["password"], $dbConfig["dbName"]);


$roles = array("guest");
$email = array(
	"Username" => "",
	"Password" => "",
	"SetFrom" => ["email" => "", "name" => "Docs app"],
	"AddReplyTo" => ["email" => "", "name" => "Bogdan Ionescu"],
	"Host" => "smtp.gmail.com",
	"Port" => 587,
	"SMTPSecure" => "tls",
	'Type' => "POP3",
);

define("ROUTE_PARAM", "_route_");
define("API_ROOT", "/api/module");
define("APP_VERSION", "1.0.0");

$routes = array(
	array("uri" => "account/getUserInfo", "file" => "Account.php", "authorized" => false),
	array("uri" => "countries/*", "file" => "Country.php", "class" => "Country"),
	array("uri" => "cities/*", "file" => "City.php"),
	array("uri" => "customers/*", "file" => "Customer.php"),
	array("uri" => "customers/getItemDetails", "file" => "Customer.php"),
	array("uri" => "customers-accounts/*", "file" => "CustomerAccount.php"),
	array("uri" => "customers-addresses/*", "file" => "CustomerAddress.php"),
	array("uri" => "customers-emails/*", "file" => "CustomerEmail.php"),
	array("uri" => "customers-phones/*", "file" => "CustomerPhone.php"),
	array("uri" => "products-categories/*", "file" => "ProductCategory.php"),
	array("uri" => "products/*", "file" => "Product.php"),
	array("uri" => "invoices/*", "file" => "Invoice.php"),
	array("uri" => "invoices/update2", "file" => "Invoice.php"),
	array("uri" => "invoices-details/*", "file" => "InvoiceDetail.php"),
);

function addMenu($roleId)
{
	$items = array();
	$demoApp = new MenuItem("Presentation");
//      $demoApp->appendChild("Test3", "test3", "app-modules/docs/test/test3.html");
	$demoApp->appendChild("Framework features", "ax-frmk/features", "app-modules/docs/ax-frmk/features.html");
	$demoApp->appendChild("Data Grid demo", "docs/overview", "app-modules/demo-app/overview/demo.html");
	$miniApp = $demoApp->appendChild("Show case", "");
	$miniApp->appendChild("Countries", "docs/countries", "app-modules/demo-app/catalogs/countries.html");
	$miniApp->appendChild("Cities", "docs/cities", "app-modules/demo-app/catalogs/cities.html");
	$miniApp->appendChild("Customers", "docs/customers", "app-modules/demo-app/catalogs/customers.html");
	$miniApp->appendChild("Products Categories", "docs/products-categories", "app-modules/demo-app/products/products-categories.html");
	$miniApp->appendChild("Products", "docs/products", "app-modules/demo-app/products/products.html");
	$miniApp->appendChild("Invoices", "docs/invoices", "app-modules/demo-app/invoices/invoices.html");

	$items[] = $demoApp;
	$docs = new MenuItem("Documentation");
	$docs ->showItems = false;
	$frmkDocs = $docs->appendChild("Framework", "");
//	$frmkDocs->appendChild("Get started", "");
//	$frmkDocs->appendChild("Tasks automation", "");

	$controls = $docs->appendChild("Controls", "");
	$axDt = $controls->appendChild("Data Table", "");
	$axDt->showItems = false;
	$axDt->appendChild("Element Attributes","ax-table/attributes", "app-modules/docs/ax-table/attributes/attributes.html");
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
	$items[] = $docs;
	return $items;
}


function routeAuthorizing($route)
{
	if (true) return true;
	header('HTTP/1.1 401 Not Authorized', true, 401);
	exit('Not authorized');
	return false;
}