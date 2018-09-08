<?php
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/base.model.php";
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/module/Customer.php";

class CustomerEmailItem extends ModelItem
{
   public $id;
   public $name;
   public $email;
   public $customerId;
}

class CustomerEmail extends BaseModel
{
   public $tableName = "customers-emails";
   public $modelItem = "CustomerEmailItem";

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
      $itemName = "Customer Email";
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
      if (!isset($this->item->email)) {
         $exception = new Exception("$itemName email is required");
         $exception->field = "email";
         throw $exception;
      }
      return true;
   }
   public function populateAction()
   {
      $emailsR = (new CustomerEmail($this->db, $this->postData))->getListAction();
      $emails = $emailsR["data"];
      $names = ["Central Warehouse ", "North Warehouse", "South Warehouse", "West Warehouse", "Est Warehouse"];
      foreach ($emails as $email) {
         $namesIndex = rand(0, 4);
         $email["name"] = $names[$namesIndex];
         $this->update(true, $email);
      }
      return array("status"=>true);
   }
}
