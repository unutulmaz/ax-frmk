<?php
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/base.model.php";
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/module/Customer.php";

class CustomerPhoneItem extends ModelItem
{
   public $id;
   public $name;
   public $phone;
   public $customerId;
}

class CustomerPhone extends BaseModel
{
   public $tableName = "customers-phones";
   public $modelItem = "CustomerPhoneItem";

   public function sqlBuildGetAllItems($where=null, $order = null, $limit = NULL)
   {
      $cmd = 'SELECT a.*,
                b.name as customer, b.nameInvariant as customerInvariant 
              FROM `' . $this->tableName . '` a
              LEFT JOIN `customers` b ON b.id = a.customerId';
      if (isset($where)) $cmd .= $this->sqlBuildWhere($where);
      return $cmd;
   }

   public function validate(&$data=null)
   {
      $itemName = "Customer Phone";
      if (!isset($this->item->customerId)) {
         $exception = new Exception("Customer is required");
         $exception->field = "customerId";
         throw $exception;

      }
      if (!isset($this->item->name)) {
         $exception = new Exception("$itemName name/alias is required");
         $exception->field = "name";
         throw $exception;
      }
      if (!isset($this->item->phone)) {
         $exception = new Exception("$itemName phone/fax is required");
         $exception->field = "phone";
         throw $exception;
      }
      return true;
   }
   public function populateAction()
   {
      $phonesR = (new CustomerPhone($this->db, $this->postData))->getListAction();
      $phones = $phonesR["data"];
      $names = ["Central Warehouse ", "North Warehouse", "South Warehouse", "West Warehouse", "Est Warehouse"];
      foreach ($phones as $phone) {
            $namesIndex = rand(0, 4);
            $phone["name"] = $names[$namesIndex];
            $this->update(true, $phone);
      }
      return array("status"=>true);
   }

}
