<?php
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/base.model.php";
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/module/Customer.php";
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/module/CustomerAddress.php";
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/module/Product.php";
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/module/InvoiceDetail.php";

class InvoiceItem extends ModelItem
{
	public $id;
	public $date;
	public $number;
	public $customerId;
	public $deliveryCountryId;
	public $deliveryCityId;
	public $deliveryAddress;
	public $deliveryAddressId;
	public $createdBy;
	public $createdAt;

}

class Invoice extends BaseModel
{
	public $tableName = "invoices";
	public $modelItem = "InvoiceItem";
	public $childrenItems = [];
	public $children = array("InvoiceDetail" => array(
		"postData" => 'invoices.details',
		"foreignKey" => "invoiceId"));

	public function validate(&$data = null)
	{
		$itemName = "Invoice";
		if (!isset($this->item->date)) {
			$exception = new Exception("$itemName date is required");
			$exception->field = "date";
			throw $exception;
		}
		if (!isset($this->item->number)) {
			$exception = new Exception("$itemName number is required");
			$exception->field = "number";
			throw $exception;
		}

		if (!isset($this->item->customerId)) {
			$exception = new Exception("$itemName customer is required");
			$exception->field = "customerId";
			throw $exception;
		}
		if (!isset($this->item->deliveryAddress)) {
			$exception = new Exception("$itemName delivery address is required");
			$exception->field = "deliveryAddress";
			throw $exception;
		}

//      $cmd = 'SELECT * from `' . $this->tableName . '` Where number = ' . $this->item->number . (isset($this->item->id) ? ' AND id !=' . $this->item->id : '');
//      $queryResult1 = $this->db->query($cmd);
//      if ($queryResult1->num_rows > 0) {
//         $exception = new Exception('The ' . $itemName . ' with number: "' . $this->item->number . '" already exists!');
//         $exception->field = "number";
//         throw $exception;
//      }
		$childrenClass = "InvoiceDetail";
		$postDataName = $this->children[$childrenClass]["postData"];
		if (!isset($this->postData->extraArgs->children->$postDataName)) {
			$exception = new Exception("$itemName details are required");
			throw $exception;
		}
		$details = $this->postData->extraArgs->children->$postDataName;
		if (count($details) === 0) {
			$exception = new Exception("$itemName details are required");
			throw $exception;
		}
		$this->childrenItems = array("InvoiceDetail" => $details);
		return $this->childrenValidate();
	}

	public function sqlBuildGetAllItems($where = null, $order = null, $limit = null)
	{
		$cmd = 'SELECT a.*,
                b.name as customer, b.nameInvariant as customerInvariant, b.code as customerCode, 
                c.name as deliveryCountry, c.nameInvariant as deliveryCountryInvariant, 
                d.name as deliveryCity, d.nameInvariant as deliveryCityInvariant,
                (select sum(productPrice*quantity) from `invoices-details` where invoiceId = a.id) as value
              FROM `' . $this->tableName . '` a
              LEFT JOIN `customers` b ON b.id = a.customerId
              LEFT JOIN `countries` c ON c.id = a.deliveryCountryId
              LEFT JOIN `cities` d ON d.id = a.deliveryCityId';
		if (isset($where)) $cmd .= $this->sqlBuildWhere($where);
		if (isset($order)) $cmd .= $this->sqlBuildOrder($order);
		if (isset($limit)) $cmd .= " limit " . $limit;


		return $cmd;
	}

	public function getListAction($where = null, $order = null)
	{
		$where = array();
		if (isset($_REQUEST["from"])) $where[] = array("field" => "date", "operator" => ">=", "value" => $_REQUEST["from"]);
		if (isset($_REQUEST["to"])) $where[] = array("field" => "date", "operator" => "<=", "value" => $_REQUEST["to"]);
		$limit = isset($_REQUEST["limit"]) ? $_REQUEST["limit"] : null;
		$response = parent::getListAction($where, $order, $limit);
		if (!$response["status"]) return $response;
		$customers = (new Customer($this->db, $this->postData))->getListAction();
		if (!$customers["status"]) return $customers;
		$response["customers"] = $customers["data"];
		$customersAddresses = (new CustomerAddress($this->db, $this->postData))->getListAction();
		if (!$customersAddresses["status"]) return $customersAddresses;
		$response["customersAddresses"] = $customersAddresses["data"];
		$products = (new Product($this->db, $this->postData))->getListAction();
		if (!$products["status"]) return $products;
		$response["products"] = $products["data"];
		return $response;
	}

	public function populateAction()
	{
		$invoicesR = (new Invoice($this->db, $this->postData))->getListAction();
		$invoices = $invoicesR["data"];
		$customersR = (new Customer($this->db, $this->postData))->getListAction();
		$customers = $customersR["data"];
		$productsR = (new Product($this->db, $this->postData))->getListAction();
		$products = $productsR["data"];
		$datesQuery = "SELECT DISTINCT Order_Date as date from orders limit 20";
		$dates = $this->db->query($datesQuery)->rows;
		$createdByR = "SELECT DISTINCT Created_By as createdBy from orders limit 20";
		$createdBys = $this->db->query($createdByR)->rows;
		$numbers = [];
		foreach ($invoices as $invoice) {
			$numbers[(int)$invoice["number"]] = true;
		}
		for ($number = 1; $number <= 100000; $number++) {
			$invoice["number"] = $number;
			if (isset($numbers[$number])) continue;
			$int = rand(0, count($dates) - 1);
			$invoice["date"] = (new DateTime($dates[$int]["date"]))->format("Y-m-d H:i:s");
			$invoice["customerId"] = $customers[rand(0, count($customers) - 1)]["id"];
			$this->postData = json_decode(json_encode(array()), FALSE);
			$addressesR = (new CustomerAddress($this->db, $this->postData))->getListAction(array("customerId" => $invoice["customerId"]));
			$customerAddresses = $addressesR["data"];
			$address = $customerAddresses[rand(0, count($customerAddresses) - 1)];
			$invoice["deliveryAddressId"] = $address["id"];
			$invoice["deliveryCountryId"] = $address["countryId"];
			$invoice["deliveryCityId"] = $address["cityId"];
			$invoice["deliveryAddress"] = $address["address"];
			$invoice["createdBy"] = $createdBys[rand(0, count($createdBys) - 1)]["createdBy"];
			$invoice["createdAt"] = $invoice["date"];
			$details = array();
			$detailsNo = rand(1, 20);
			for ($j = 0; $j < $detailsNo; $j++) {
				$detail = array();
				$detail["position"] = $j + 1;
				$product = $products[rand(0, count($products) - 1)];
				$detail["productId"] = $product["id"];
				$detail["quantity"] = rand(1, 200);
				$detail["productPrice"] = $product["price"];
				$detail["discount"] = rand(1, 10);
				$details[] = $detail;
			}
			$data = array("item" => $invoice, "extraArgs" => array("children" => array("invoices.details" => $details)));
			$this->postData = json_decode(json_encode($data), FALSE);
			$item = json_decode(json_encode($invoice), FALSE);
			$this->item = new $this->modelItem($item);
			$response = $this->create();
//         if (!$response["status"]) return $response;
		}
		return array("status" => true);
	}

	public function update1Action()
	{
		$invoicesR = (new Invoice($this->db, $this->postData))->getListAction();
		$invoices = $invoicesR["data"];
		foreach ($invoices as $invoice) {
			$numbers[(int)$invoice["number"]] = true;
			if (!is_null($invoice["type"])) continue;
			$invoice["type"] = rand(0, 2);
			$queryResult = $this->db->query($this->sqlBuildUpdate($invoice));
			if (!$queryResult) return array("status" => false);
		}
		return array("status" => true);
	}

	public function update2Action()
	{
		$invoicesR = (new Invoice($this->db, $this->postData))->getListAction(null, array("date" => "ASC"));
		$invoices = $invoicesR["data"];
		$number = 0;
		foreach ($invoices as $invoice) {
			$number++;
			if ((int)$invoice["number"] == $number) continue;
			$queryResult = $this->db->query($this->sqlBuildUpdate(array("id" => $invoice["id"], "number" => $number)));
			if (!$queryResult) return array("status" => false);
		}
		return array("status" => true);
	}

}
