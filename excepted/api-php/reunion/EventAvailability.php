<?php
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/base.model.php";
include_once "Event.php";


class EventAvailabilityItem extends ModelItem
{
   public $id;
   public $type;
   public $typeId;
   public $userId;
   public $start;
   public $end;
   public $monday;
   public $tuesday;
   public $wednesday;
   public $thursday;
   public $friday;
   public $saturday;
   public $sunday;
}

class EventAvailability extends BaseModel
{
   public $tableName = "events-availability";
   public $modelItem = "EventAvailabilityItem";
   public $foreignKey = "eventId";

   public function __construct(DB $db, $postData = "{}")
   {
      parent::__construct($db, $postData);
      $this->currentUserId = isset($_COOKIE["currentUserId"]) ? $_COOKIE["currentUserId"] : 0;
      if (isset($this->item)) $this->item->userId = $this->currentUserId;
   }

   public function sqlBuildGetAllItems($where = null, $order = null)
   {
      $cmd = 'SELECT a.*, b.fullName as userName  FROM `' . $this->tableName . '` a
       INNER JOIN users b ON b.id = a.userId';
      if (isset($where)) $cmd .= $this->sqlBuildWhere($where);
      if (isset($order)) $cmd .= $this->sqlBuildOrder($order);
      return $cmd;
   }

   public function getListAction($where = null, $order = null)
   {
      if (!$where) {
         $where = array();
         If (isset($_REQUEST["typeId"])) $where["typeId"] = $_REQUEST["typeId"];
         If (isset($_REQUEST["type"])) $where["type"] = $_REQUEST["type"];
         If (isset($_REQUEST["userId"])) $where["userId"] = $_REQUEST["userId"];
      }
      if (!$order) $order = array("start" => "ASC");
      return parent::getListAction($where, $order);
   }

   public function validate(&$data = null)
   {
      $itemName = "Availability";
      $item = $this->getDataItem($data);
      if (!isset($item->start)) {
         $exception = new Exception("$itemName start required");
         $exception->field = "start";
         throw $exception;
      }
      if (!isset($item->end)) {
         $exception = new Exception("$itemName end required");
         $exception->field = "end";
         throw $exception;
      }
      return true;
   }

}
