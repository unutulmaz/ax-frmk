<?php
include_once $_SERVER["DOCUMENT_ROOT"] . "\api\config.db.php" ;
$limit = isset($_REQUEST['limit'])? $_REQUEST['limit']: "100";
$orderBy = isset($_REQUEST['orderBy'])? $_REQUEST['orderBy']: false;
$query = 'SELECT 
                Order_ID as number, 
                Order_Date as date, 
                Suplier_Name as customer,
                Suplier_Country as deliveryCountry,
                Suplier_Code as customerCode,
                Suplier_Country as deliveryCountry,
                Suplier_City as deliveryCity,
                Suplier_Street as deliveryAddress,
                Created_By as createdBy,
                Created_at as createdAt,
                Intra_UE as insideUE,
                Value as value
              FROM `orders` ' ;
if ($orderBy) $query .= " order by " . $orderBy;
if ($limit) $query .= " limit " . $limit;
$queryResult = $dbConnection->query($query);
$response = array();
$response["items"] = $queryResult->rows;

$response["status"] = true;
echo json_encode($response);