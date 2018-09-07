<?php
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/base.model.php";
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/module/Customer.php";

class CustomerAccountItem extends ModelItem
{
   public $id;
   public $name;
   public $bank;
   public $account;
   public $customerId;
}

class CustomerAccount extends BaseModel
{
   public $tableName = "customers-accounts";
   public $modelItem = "CustomerAccountItem";

   public function sqlBuildGetAllItems($where=null, $order = null)
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
      $itemName = "Customer Account";
      if (is_null($data)) $item=$this->item;
      else $item = json_decode(json_encode($data), FALSE);
      if (!isset($item->customerId)) {
         $exception = new Exception("Customer is required");
         $exception->field = "customerId";
         throw $exception;

      }
      if (!isset($item->name)) {
         $exception = new Exception("$itemName name/alias is required");
         $exception->field = "name";
         throw $exception;
      }
      if (!isset($item->bank)) {
         $exception = new Exception("$itemName bank is required");
         $exception->field = "bank";
         throw $exception;
      }
      if (!isset($item->account)) {
         $exception = new Exception("$itemName account is required");
         $exception->field = "account";
         throw $exception;
      }

      return true;
   }
   public function populateAction()
   {
      $customersR = (new Customer($this->db, $this->postData))->getListAction();
      $customers = $customersR["data"];
      $names = ["Central Warehouse ", "North Warehouse", "South Warehouse", "West Warehouse", "Est Warehouse"];
      $banks = ["Central Bank", "Raiffeisen Bank", "Exim Bank", "ING Bank", "Garanti Bank"];
      $accounts=["AL86751639367318444714198669","BE58465045170210","BE49149522496291","BA534130469841865537","BA515388988295860588","BA182655808222815318","BA105531662061034080","BA198940842595891985","IL813919026399312117293","IL654645042217944600527","IT85M5508898545109326040966", "IT52G4674641537627600627273","IT54K9621595703270001697912","IT02F7240326523239438656917","IT75F6444007486118207984348","LV85QMUO0600628590552","LV06FYUQ8115346663782","LV05OXNQ0057259369767","LV22XGHZ6356462010762","LV27LLIK8896580861638","LB82586807590631203627574587","LB33405622563828555835796785","LB04715710805951055803616185","LB61420797023022242826619522","LB67864629408749872547678117","LI4091221689235313176","LI7615336074136062084","LI3727301137968672218","LI3551318446915634574","LI4705272204109186337","LT369967216439021801","LT937444321684957069","LT424971109068400772","LT566572547785167976","LT3448062907788543"];
      foreach ($customers as $customer) {
         $accountsNo = rand(0, 4);
         for ($i = 0; $i < $accountsNo; $i++) {
            $account = [];
            $account["customerId"] = $customer["id"];
            $namesIndex = rand(0, 4);
            $account["name"] = $names[$namesIndex];
            $account["bank"] = $banks[rand(0, 4)];
            $account["account"] = $accounts[rand(0, count($accounts)-1)];
            $this->create(false, $account);
         }
      }
      return array("status"=>true);
   }
}
