<?php
//include_once $_SERVER["DOCUMENT_ROOT"] . "/api/vendor/Db.php" ;
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/config.db.php" ;
$queryResult = $dbConnection->query("SELECT * from cities");

$response = array();
$response["items"] = $queryResult->rows;

$response["status"] = true;
echo json_encode($response);