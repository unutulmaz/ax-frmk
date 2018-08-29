<?php
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/base.model.php";
include_once "EventLocationVote.php";
include_once "Event.php";


class EventLocationItem extends ModelItem
{
   public $id;
   public $userId;
   public $eventId;
   public $name;
   public $description;
   public $address;
   public $phone;
   public $email;
   public $locationUrl;
   public $websiteUrl;
}

class EventLocation extends BaseModel
{
   public $tableName = "events-locations";
   public $modelItem = "EventLocationItem";
   public $foreignKey = "eventId";
   public $currentUserId;

   public function __construct(DB $db, $postData = "{}")
   {
      parent::__construct($db, $postData);
      $this->currentUserId = isset($_COOKIE["currentUserId"]) ? $_COOKIE["currentUserId"] : 0;
      if (isset($this->item)) $this->item->userId = $this->currentUserId;
   }

   public function validate(&$data = null)
   {
      $itemName = "Locatie";
      $item = $this->getDataItem($data);
      if (!isset($item->eventId)) {
         $exception = new Exception("$itemName event id is required");
         $exception->field = "event";
         throw $exception;
      }
      if (!isset($item->name)) {
         $exception = new Exception("Denumire $itemName  is required");
         $exception->field = "name";
         throw $exception;
      }
      if (!isset($item->description)) {
         $exception = new Exception("Descriere $itemName is required");
         $exception->field = "description";
         throw $exception;
      }
      return true;
   }

   public function sqlBuildGetAllItems($where = null, $order = null)
   {
      $userId = $this->currentUserId;
      $cmd = "SELECT a.*, 
              c.fullName as addedBy,
              b.vote as vote,
              b.comment as voteComment,
              (select count(userId) from `events-locations-votes` where eventLocationId = a.id and vote>0 ) as totalLikes,    
              (select count(userId) from `events-locations-votes` where eventLocationId = a.id and vote<0 ) as totalDislikes    
              FROM `{$this->tableName}` a
      LEFT JOIN `events-locations-votes` b on b.eventLocationId = a.id and b.userId=$userId
      LEFT JOIN `users` c on c.id = a.userId 
      ";
      if (isset($where)) $cmd .= $this->sqlBuildWhere($where);
      if (isset($order)) $cmd .= $this->sqlBuildOrder($order);
      return $cmd;

   }

   public function createActionCallback($data = null, $postData)
   {
      if (!$data["status"]) return $data;
      $eventLocation = $data["data"];
      $eventLocationVoteObj = new EventLocationVote($this->db);
      $eventLocationVote = array("eventLocationId" => $eventLocation["id"], "userId" => $this->currentUserId);
      $eventLocationVote["vote"] = $postData->item->vote;
      $response = $eventLocationVoteObj->createAction(false, $eventLocationVote);
      if (!$response["status"]) return $response;
      return $data;
   }

   public function updateActionCallback($data = null, $postData)
   {
      if (!$data["status"]) return $data;
      $eventLocation = $data["data"];
      $eventLocationVoteObj = new EventLocationVote($this->db);
      $eventLocationVote = array("eventLocationId" => $eventLocation["id"], "userId" => $this->currentUserId);
      $existingVote = $eventLocationVoteObj->getItemAction($eventLocationVote);
      if (count($existingVote["data"]) > 0) $eventLocationVote["id"] = $existingVote["data"]["id"];
      $eventLocationVote["vote"] = $postData->item->vote;
      $eventLocationVote["comment"] = $postData->item->voteComment;
      if (count($existingVote["data"]) == 0) $response = $eventLocationVoteObj->createAction(false, $eventLocationVote);
      else $response = $eventLocationVoteObj->updateAction(false, $eventLocationVote);;
      if (!$response["status"]) return $response;
      else return $this->getItemAction();
   }

   public function getVotesAction()
   {
      $eventLocationId = $this->postData->item->id;
      $cmd = "Select a.id as userId, a.fullName as userName, (case when c.vote is null then -2 else c.vote end) as vote , c.comment ";
      $cmd .= "from users a ";
      $cmd .= "LEFT JOIN `events-locations-votes` c on c.userId = a.id and c.eventLocationId = $eventLocationId ";
      $cmd .= "WHERE vote != -2 ";
      $cmd .= "ORDER BY vote DESC, userName";
      $response["data"] = $this->db->query($cmd)->rows;
      $response["status"] = true;
      return $response;
   }
}
