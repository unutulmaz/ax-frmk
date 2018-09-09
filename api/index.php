<?php
include 'route.php';
$postData = file_get_contents('php://input');
ob_start();
$route = new Route();
$response = $route->submit($postData );

$list = ob_get_contents(); // Store buffer in variable

ob_end_clean(); // End buffering and clean up

if ($list) {
   $response["status"] = false;
   $response["message"] = $list;
}
echo json_encode($response);


function guidv4()
{
   if (function_exists('com_create_guid') === true)
      return trim(com_create_guid(), '{}');

   $data = openssl_random_pseudo_bytes(16);
   $data[6] = chr(ord($data[6]) & 0x0f | 0x40); // set version to 0100
   $data[8] = chr(ord($data[8]) & 0x3f | 0x80); // set bits 6-7 to 10
   return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}
function array_column1(array $input, $columnKey, $indexKey = null)
{
	$array = array();
	foreach ($input as $value) {
		if (!isset($value[$columnKey])) {
			trigger_error("Key \"$columnKey\" does not exist in array");
			return false;
		}
		if (is_null($indexKey)) {
			$array[] = $value[$columnKey];
		} else {
			if (!isset($value[$indexKey])) {
				trigger_error("Key \"$indexKey\" does not exist in array");
				return false;
			}
			if (!is_scalar($value[$indexKey])) {
				trigger_error("Key \"$indexKey\" does not contain scalar value");
				return false;
			}
			$array[$value[$indexKey]] = $value[$columnKey];
		}
	}
	return $array;
}