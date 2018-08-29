<?php
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/base.model.php";

class UserItem extends ModelItem
{
   public $id;
   public $email;
   public $loginToken;
   public $firstName;
   public $lastName;
   public $initialLastName;
   public $fullName;
   public $nickName;
   public $phones;
   public $roles;
   public $disabled;
   public $lastLogin;
}

class User extends BaseModel
{
   public $tableName = "users";
   public $modelItem = "UserItem";


   public function validate(&$data = null)
   {
      $itemName = "Utilizator";
      $item = $this->getDataItem($data);
      if (!isset($item->firstName)) {
         $exception = new Exception("Nume $itemName  este obligatoriu");
         $exception->field = "firstName";
         throw $exception;
      }
      if (!isset($item->lastName)) {
         $exception = new Exception("Prenume $itemName  este obligatoriu");
         $exception->field = "lastName";
         throw $exception;
      }
      if (!is_null($this->item)) $this->item->fullName = implode(" ", [$item->firstName, $item->lastName]);
      if (!is_null($data)) $data["fullName"] = implode(" ", [$item->firstName, $item->lastName]);
//      if (!is_null($data)) $data["fullName"] = implode(" ", [$data["firstName"], $data["lastName"]]);
      return true;
   }

}
