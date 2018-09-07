<?php
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/vendor/Db.php";
define("DIR_DATABASE", $_SERVER["DOCUMENT_ROOT"] . "/api/vendor/database/");
define("ROUTE_PARAM", "_route_");
define("API_ROOT", "/api/module");

$dbConfig = array(
	"dbName" => "etr",
	"user" => "etr",
	"password" => "AdsafSdf=3*?|",
	"driver" => "Mysqli",
	"host" => "localhost");
define("DB_DATABASE", $dbConfig["dbName"]);
$dbConnection = new Db($dbConfig["driver"], $dbConfig["host"], $dbConfig["user"], $dbConfig["password"], $dbConfig["dbName"]);

$roles = array("admin", "user", "organizator");
$email = array(
	"Username" => "ascentix.uat",
	"Password" => "MyFancyPass58~",
	"SetFrom" => ["email" => "ascentix.uat@gmail.com", "name" => "ETR app"],
	"AddReplyTo" => ["email" => "bogdanim.work@gmail.com", "name" => "Bogdan Ionescu"],
	"Host" => "smtp.gmail.com",
	"Port" => 587,
	"SMTPSecure" => "ssl",
	'Type' => "POP3",
);

define("APP_VERSION", "1.0.0");
define("CARUSEL_FILES", "carusel-files");
$routes = array(
	array("uri" => "account/logoff", "file" => "Account.php"),
	array("uri" => "account/getUserInfo", "file" => "Account.php", "authorized" => false),
	array("uri" => "account/login", "file" => "Account.php", "authorized" => false),
	array("uri" => "account/resetPassword", "file" => "Account.php", "authorized" => false),
	array("uri" => "account/savePassword", "file" => "Account.php", "authorized" => false)
);
$routes[] = array("uri" => "users/*", "file" => "User.php", "class" => "User", "authorized" => true);
$routes[] = array("uri" => "cities/*", "file" => "City.php");
$routes[] = array("uri" => "zones/*", "file" => "Zone.php");
$routes[] = array("uri" => "locations/*", "file" => "Location.php");
$routes[] = array("uri" => "locations/getPublicItem", "file" => "Location.php", "authorized" => false);
$routes[] = array("uri" => "locations-carusel/*", "file" => "LocationCarusel.php");
$routes[] = array("uri" => "locations-carusel/upload", "file" => "LocationCarusel.php");
$routes[] = array("uri" => "camere/*", "file" => "Camera.php");

include_once $_SERVER["DOCUMENT_ROOT"] . "/api/module/User.php";

function routeAuthorizing($route, $dbConnection)
{
	if (isset($_COOKIE["etr-user"])) {
		$userClass = new User($dbConnection, null);
		$user = $userClass->getItemAction(array("email" => $_COOKIE["etr-user"]));
		if ($user["status"] && $user["data"]["esteActiv"] === "1") return true;
		return true;
	}
	header('HTTP/1.1 401 Not Authorized', true, 401);
	exit('Not authorized');
	return false;
}

function addMenu($roleId)
{
	$items = array();
	if ($roleId === "admin") {
		$items[] = new MenuItem("Utilizatori", "utilizatori", "app-modules/etr/users/index.html");
		$items[] = new MenuItem("Orase", "orase", "app-modules/etr/cities/index.html");
		$items[] = new MenuItem("Zone", "zone", "app-modules/etr/zones/index.html");
		$items[] = new MenuItem("Locatii", "locatii", "app-modules/etr/locations/index.html");
	} else    $items[] = new MenuItem("Locatii", "locatii", "app-modules/etr/locations/index.html");

	return $items;
}
