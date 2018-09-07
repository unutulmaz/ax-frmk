<?php
define("DIR_DATABASE", $_SERVER["DOCUMENT_ROOT"] . "/api/vendor/database/");
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/vendor/Db.php";
include_once "config.secrets.php";
include_once "config.appinfo.php";
include_once "config.routes.php";

define("DB_DATABASE", $dbConfig["dbName"]);
$dbConnection = new Db($dbConfig["driver"], $dbConfig["host"], $dbConfig["user"], $dbConfig["password"], $dbConfig["dbName"]);

include_once "config.menu.php";
