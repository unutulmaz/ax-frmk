<?php

define("ROUTE_PARAM", "_route_");

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


function routeAuthorizing($route)
{
	if (true) return true;
	header('HTTP/1.1 401 Not Authorized', true, 401);
	exit('Not authorized');
	return false;
}