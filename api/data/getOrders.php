<?php
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/config.db.php" ;
$limit = isset($_REQUEST['limit'])? $_REQUEST['limit']: "100";
$orderBy = isset($_REQUEST['orderBy'])? $_REQUEST['orderBy']: false;
$query = 'SELECT a.*,
                b.name as customer, b.nameInvariant as customerInvariant, b.code as customerCode, 
                c.name as deliveryCountry, c.nameInvariant as deliveryCountryInvariant, 
                d.name as deliveryCity, d.nameInvariant as deliveryCityInvariant,
                (select sum(productPrice*quantity) from `invoices-details` where invoiceId = a.id) as value
              FROM `invoices` a
              LEFT JOIN `customers` b ON b.id = a.customerId
              LEFT JOIN `countries` c ON c.id = a.deliveryCountryId
              LEFT JOIN `cities` d ON d.id = a.deliveryCityId'; ;
if ($orderBy) $query .= " order by " . $orderBy;
if ($limit) $query .= " limit " . $limit;
$queryResult = $dbConnection->query($query);
$response = array();
$response["items"] = $queryResult->rows;

$response["status"] = true;
echo json_encode($response);