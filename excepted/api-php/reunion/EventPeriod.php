<?php
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/base.model.php";
include_once "EventPeriodVote.php";
include_once "Event.php";



class EventPeriodItem extends ModelItem
{
   public $id;
   public $userId;
   public $eventId;
   public $startDate;
   public $days;
}

class EventPeriod extends BaseModel
{
   public $tableName = "events-periods";
   public $modelItem = "EventPeriodItem";
   public $foreignKey = "eventId";
   public $currentUserId;

   public function __construct(DB $db, $postData = "{}")
   {
      parent::__construct($db, $postData);
      $this->currentUserId = isset( $_COOKIE["currentUserId"])? $_COOKIE["currentUserId"]: 0;
      if (isset($this->item)) $this->item->userId = $this->currentUserId;
   }

   public function validate(&$data = null)
   {
      $itemName = "Event Period";
      $item = $this->getDataItem($data);
      if (!isset($item->eventId)) {
         $exception = new Exception("$itemName event id is required");
         $exception->field = "event";
         throw $exception;
      }
      if (!isset($item->startDate)) {
         $exception = new Exception("$itemName start date is required");
         $exception->field = "startDate";
         throw $exception;
      }
      if (!isset($item->days)) {
         $exception = new Exception("$itemName Zile is required");
         $exception->field = "days";
         throw $exception;
      }
      return true;
   }

   public function sqlBuildGetAllItems($where = null, $order=null)
   {
      $userId = $this->currentUserId;
      $cmd = "SELECT a.*, 
              b.userId is not null as available,
              (select count(userId) from `events-periods-votes` where eventPeriodId = a.id ) as total    
              FROM `{$this->tableName}` a
      LEFT JOIN `events-periods-votes` b on b.eventPeriodId = a.id and b.userId=$userId
      ";
      if (isset($where)) $cmd .= $this->sqlBuildWhere($where);
      if (isset($order)) $cmd .= $this->sqlBuildOrder($order);
      return $cmd;

   }

   public function createActionCallback(&$createResponse = null, $postData)
   {
      if (!$createResponse["status"]) return $createResponse;
      $eventPeriod = $createResponse["data"];
      $eventPeriodVoteObj = new EventPeriodVote($this->db);
      $eventPeriodVote = array("eventPeriodId" => $eventPeriod["id"], "userId" => $this->currentUserId);
      $response = $eventPeriodVoteObj->createAction(false, $eventPeriodVote);
      if (!$response["status"]) return $response;
      $createResponse["data"]["available"] = 1;
      $createResponse["data"]["total"] = 1;
      return $createResponse;
   }

   public function updateActionCallback(&$updateResponse = null, $postData)
   {
      if (!$updateResponse["status"]) return $updateResponse;
      $eventPeriod = $updateResponse["data"];
      $eventPeriodVoteObj = new EventPeriodVote($this->db);
      $eventPeriodVote = array("eventPeriodId" => $eventPeriod["id"], "userId" => $this->currentUserId);
      $existingVote = $eventPeriodVoteObj->getItemAction($eventPeriodVote);
      if (!$existingVote["status"]) return $existingVote;
      if (count($existingVote["data"]) > 0 && $postData->item->available) return $updateResponse;
      if (count($existingVote["data"]) == 0 && !$postData->item->available) return $this->getItemAction();
      if ($postData->item->available) $response = $eventPeriodVoteObj->createAction(false, $eventPeriodVote);
      else $response = $eventPeriodVoteObj->deleteAction($existingVote["data"]["id"]);
      if (!$response["status"]) return $response;
      else return $this->getItemAction();
   }

   public function getAvailableUsersAction()
   {
      $eventObj = new Event($this->db);
      $eventPeriodId = $this->postData->item->id;
      $eventId = $this->postData->item->eventId;
      $response = array("status" => true);
      $response["data"] = $eventObj->getPeriodVotes($eventId, $eventPeriodId);
      return $response;
   }
}
