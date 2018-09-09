<?php
define("DIR_DATABASE", $_SERVER["DOCUMENT_ROOT"] . "/api/vendor/database/");
include_once "vendor/Db.php";
include_once "config.secrets.php";
define("DB_DATABASE", $dbConfig["dbName"]);
$dbConnection = new Db($dbConfig["driver"], $dbConfig["host"], $dbConfig["user"], $dbConfig["password"], $dbConfig["dbName"]);
