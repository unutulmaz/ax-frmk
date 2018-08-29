<?php
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/base.model.php";


class EventLocationVoteItem extends ModelItem
{
   public $id;
   public $userId;
   public $eventLocationId;
   public $vote;
   public $comment;
}

class EventLocationVote extends BaseModel
{
   public $tableName = "events-locations-votes";
   public $modelItem = "EventLocationVoteItem";
   public $foreignKey = "eventLocationId";

   public function validate(&$data = null)
   {
      $itemName = "Location Vote";
      $item = $this->getDataItem($data);
      if (!isset($item->userId)) {
         $exception = new Exception("$itemName user is required");
         $exception->field = "userId";
         throw $exception;
      }
      if (!isset($item->eventLocationId)) {
         $exception = new Exception("$itemName Event Location is required");
         $exception->field = "eventLocationId";
         throw $exception;
      }
      if (!isset($item->vote)) {
         $exception = new Exception("$itemName  is required");
         $exception->field = "vote";
         throw $exception;
      }
      return true;
   }
}
