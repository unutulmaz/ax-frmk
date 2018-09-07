<?php
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/base.model.php";
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/module/Country.php";
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/module/City.php";

class CustomerItem extends ModelItem
{
   public $id;
   public $name;
   public $nameInvariant;
   public $code;
   public $administratorName;
   public $countryId;
   public $cityId;
   public $seatAddress;
}

class Customer extends BaseModel
{
   public $tableName = "customers";
   public $modelItem = "CustomerItem";

   public function sqlBuildGetAllItems($where=null, $order=null)
   {
      $cmd= 'SELECT a.*, 
                     c.name as city, c.nameInvariant as cityInvariant, 
                     b.name as country, b.nameInvariant as countryInvariant
                 FROM `' . $this->tableName . '` a 
                 LEFT JOIN countries b on b.id = a.countryId
                 LEFT JOIN cities c on c.id = a.cityId';
      if (isset($where)) $cmd .= $this->sqlBuildWhere($where);
      return $cmd;
   }

   public function getListAction($where=null, $order=null)
   {
      $response = parent::getListAction($where, $order);
      if (!$response["status"]) return $response;
      $countries = (new Country($this->db, $this->postData))->getListAction();
      if (!$countries["status"]) return $countries;
      $response["countries"] = $countries["data"];

      $cities = (new City($this->db, $this->postData))->getListAction();
      if (!$cities["status"]) return $cities;
      $response["cities"] = $cities["data"];
      return $response;
   }

   public function getItemDetailsAction()
   {
      $response = array();
      $id = $this->item->id;
      try {
         $response["data"] = array();
         $response["data"]["phones"] = $this->db->query("Select * from `customers-phones` Where customerId=" . $id)->rows;
         $response["data"]["emails"] = $this->db->query("Select * from `customers-emails` Where customerId=" . $id)->rows;
         $response["data"]["accounts"] = $this->db->query("Select * from `customers-accounts` Where customerId=" . $id)->rows;
         $response["data"]["addresses"] = $this->db->query(
            "Select `customers-addresses`.*,
          cities.name as city, cities.nameInvariant as cityInvariant, 
			 countries.name as country, countries.nameInvariant as countryInvariant 
			 from `customers-addresses` 
			 LEFT JOIN countries on countries.id = `customers-addresses`.countryId 
          LEFT JOIN cities on cities.id = `customers-addresses`.cityId 
			Where customerId=" . $id)->rows;
         $response["status"] = true;

      } catch (Exception  $error) {
         $field = isset($error->field) ? $error->field : "";
         $response["errors"] = [$field => [$error->getMessage()]];
         $response["status"] = false;
      }
      return $response;
   }

   public function validate(&$data=null)
   {
      $itemName = "Customer";
      if (!isset($this->item->name)) {
         $exception = new Exception("$itemName name is required");
         $exception->field = "name";
         throw $exception;
      }
      if (!isset($this->item->nameInvariant)) {
         $exception = new Exception("$itemName  name is required");
         $exception->field = "name";
         throw $exception;

      }
      if (strlen($this->item->name) < 3) {
         $exception = new Exception("$itemName name must have at least three characters.");
         $exception->field = "name";
         throw $exception;
      }

      $cmd = 'SELECT * from `' . $this->tableName . '` Where name = "' . $this->item->name . '"' . (isset($this->item->id) ? ' AND id !=' . $this->item->id : '');
      $queryResult1 = $this->db->query($cmd);
      if ($queryResult1->num_rows > 0) {
         $exception = new Exception('The ' . $itemName . ' with name: "' . $this->item->name . '" already exists!');
         $exception->field = "name";
         throw $exception;
      }
      return true;
   }

}
