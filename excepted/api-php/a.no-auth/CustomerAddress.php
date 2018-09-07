<?php
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/base.model.php";
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/module/Country.php";
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/module/City.php";
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/module/Customer.php";

class CustomerAddressItem extends ModelItem
{
   public $id;
   public $customerId;
   public $name;
   public $countryId;
   public $cityId;
   public $address;
}

class CustomerAddress extends BaseModel
{
   public $tableName = "customers-addresses";
   public $modelItem = "CustomerAddressItem";

   public function sqlBuildGetAllItems($where = null, $order = null)
   {
      $cmd = 'SELECT a.*, 
                     b.name as customer, b.nameInvariant as customerInvariant,
                     c.name as country, c.nameInvariant as countryInvariant, 
                     d.name as city, d.nameInvariant as cityInvariant 
                 FROM `' . $this->tableName . '` a 
                 LEFT JOIN customers b on b.id = a.customerId
                 LEFT JOIN countries c on c.id = a.countryId
                 LEFT JOIN cities d on d.id = a.cityId';
      if (isset($where)) $cmd .= $this->sqlBuildWhere($where);
      return $cmd;
   }

   public function getListAction($where = null, $order=null)
   {
      try {
         $cmd = $this->sqlBuildGetAllItems();
         if (isset($_REQUEST["customerId"])) {
            $cmd .= $this->sqlBuildWhere(["customerId" => $_REQUEST["customerId"]]);
         }
			$cmd .= ' Order By a.customerId ';
         $queryResult = $this->db->query($cmd);
         $response = array();
         $response["data"] = $queryResult->rows;

         $countries = (new Country($this->db, $this->postData))->getListAction();
         if (!$countries["status"]) return $countries;
         $response["countries"] = $countries["data"];

         $cities = (new City($this->db, $this->postData))->getListAction();
         if (!$cities["status"]) return $cities;
         $response["cities"] = $cities["data"];
         $response["status"] = true;
         return $response;
      } catch (Exception  $error) {
         return $this->catchError($error);
      }

   }

   public function validate(&$data=null)
   {
      $itemName = "Address";

      if (is_null($data)) $item=$this->item;
      else $item = json_decode(json_encode($data), FALSE);
      if (!isset($item->name)) {
         $exception = new Exception("$itemName name is required");
         $exception->field = "name";
         throw $exception;
      }
      if (!isset($item->countryId)) {
         $exception = new Exception("$itemName country is required");
         $exception->field = "countryId";
         throw $exception;
      }
      if (!isset($item->cityId)) {
         $exception = new Exception("$itemName city is required");
         $exception->field = "cityId";
         throw $exception;
      }

      return true;
   }

   public function populateAction()
   {
      $customersR = (new Customer($this->db, $this->postData))->getListAction();
      $customers = $customersR["data"];
      $countriesR = (new Country($this->db, $this->postData))->getListAction();
      $countries = $countriesR["data"];
      $citiesR = (new City($this->db, $this->postData))->getListAction();
      $cities = $citiesR["data"];
      $names = ["Central Warehouse ", "North Warehouse", "South Warehouse", "West Warehouse", "Est Warehouse"];
      $streetsQuery = "SELECT DISTINCT Suplier_Street as address from orders limit 400";
      $streets = $this->db->query($streetsQuery)->rows;
      foreach ($customers as $customer) {
         $addressesNo = rand(0, 5);
         for ($i = 0; $i < $addressesNo; $i++) {
            $address = [];
            $address["customerId"] = $customer["id"];
            $namesIndex = rand(0, 4);
            $address["name"] = $names[$namesIndex];
            if ($i < 2) $address["countryId"] = $customer["countryId"];
            else {
               $countryIndex = rand(0, count($countries) - 1);
               $address["countryId"] = $countries[$countryIndex]["id"];
            }
            $countryCities = array();
               array_filter($cities, function ($city) use ($address,&$countryCities) {
               if( $city["countryId"] == $address["countryId"]) {
                  $countryCities[]=$city;}
            });
            $cityIndex = rand(0, count($countryCities) - 1);
            $address["cityId"] = $countryCities[$cityIndex]["id"];
            $streetsIndex = rand(0, count($streets) - 1);
            $address["address"] = $streets[$streetsIndex]["address"];
            $this->create(false, $address);
         }
      }
      return array("status"=>true);
   }
}
