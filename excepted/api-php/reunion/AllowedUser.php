<?php
include_once $_SERVER["DOCUMENT_ROOT"] . "\api\base.model.php";

class AllowedUserItem extends ModelItem
{
   public $id;
   public $userId;
   public $eventId;
}

class AllowedUser extends BaseModel
{
   public $tableName = "events-allowed-users";
   public $modelItem = "AllowedUserItem";
   public $foreignKey = "eventId";

   public function validate($data = null)
   {
      $itemName = "Allowed user";
      $item = $this->getDataItem($data);
      if (!isset($item->userId)) {
         $exception = new Exception("$itemName userId is required");
         $exception->field = "user";
         throw $exception;
      }
      return true;
   }
}
