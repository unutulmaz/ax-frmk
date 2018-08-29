<?php
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/base.model.php";


class EventPeriodVoteItem extends ModelItem
{
   public $id;
   public $userId;
   public $eventPeriodIdId;
}

class eventPeriodVote extends BaseModel
{
   public $tableName = "events-periods-votes";
   public $modelItem = "EventPeriodVoteItem";
   public $foreignKey = "eventPeriodId";

   public function validate(&$data = null)
   {
      $itemName = "Period Vote";
      $item = $this->getDataItem($data);
      if (!isset($item->userId)) {
         $exception = new Exception("$itemName user is required");
         $exception->field = "userId";
         throw $exception;
      }
      if (!isset($item->eventPeriodId)) {
         $exception = new Exception("$itemName Event Period  is required");
         $exception->field = "eventPeriodId";
         throw $exception;
      }
      return true;
   }
}
