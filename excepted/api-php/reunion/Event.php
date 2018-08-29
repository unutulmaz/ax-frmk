<?php
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/base.model.php";
include_once "EventPeriod.php";
include_once "EventAvailability.php";
include_once "EventLocation.php";
include_once "EventAllowedUser.php";


class EventItem extends ModelItem
{
   public $id;
   public $name;
   public $description;
   public $startDate;
   public $endDate;
   public $locationName;
   public $locationLinks;
   public $restricted;
   public $days;
   public $anunt;
   public $closed;

}

class Event extends BaseModel
{
   public $tableName = "events";
   public $modelItem = "EventItem";
   public $childrenItems = [];
   public $children = array(
      "EventAllowedUser" => array(
         "postData" => 'allowed-users',
         "foreignKey" => "eventId")
   );

   public function __construct(DB $db, $postData = "{}")
   {
      parent::__construct($db, $postData);
      $this->currentUserId = isset($_COOKIE["currentUserId"]) ? $_COOKIE["currentUserId"] : 0;
   }

   public function validate(&$data = null)
   {
      $itemName = "Event";
      $item = $this->getDataItem($data);
      if (!isset($item->name)) {
         $exception = new Exception("$itemName name is required");
         $exception->field = "name";
         throw $exception;
      }

      $cmd = 'SELECT * from `' . $this->tableName . '` Where name = "' . $item->name . '"' . (isset($item->id) ? ' AND id !=' . $item->id : '');
      $queryResult1 = $this->db->query($cmd);
      if ($queryResult1->num_rows > 0) {
         $exception = new Exception('The ' . $itemName . ' with name: "' . $item->name . '" already exists!');
         $exception->field = "name";
         throw $exception;
      }
      if (!$item->restricted) return true;
      $childrenClass = "EventAllowedUser";
      $postDataName = $this->children[$childrenClass]["postData"];
      if (!isset($this->postData->extraArgs->children->$postDataName)) {
         $exception = new Exception("$itemName details are required");
         throw $exception;
      }
      $details = $this->postData->extraArgs->children->$postDataName;
      if (count($details) === 0) {
         $exception = new Exception("$itemName details are required");
         throw $exception;
      }
      $this->childrenItems = array($childrenClass => $details);
      return $this->childrenValidate();

   }

   public function getItemDetailsAction($id = null)
   {
      $response = array();
      $id = isset($id) ? $id : $this->item->id;
      try {
         $response["data"] = array();
         $response["data"]["allowed-users"] = $this->db->query(
            "Select a.*,
          b.userId is not null as allowed 
			 from `users` a
			 LEFT JOIN `events-allowed-users` b on b.userId= a.id and b.eventId=" . $id)->rows;

         $response["data"]["periods"] = $this->getAvailability($id);

         $cmd = (new EventLocation($this->db))->sqlBuildGetAllItems(array("a.eventId" => $id));
         $response["data"]["locations"] = $this->db->query($cmd)->rows;

         $cmd = (new EventAvailability($this->db))->sqlBuildGetAllItems(array("a.typeId" => $id, "a.type" => "event", "a.userId" => $this->currentUserId));
         $response["data"]["availability"] = $this->db->query($cmd)->rows;
         $response["status"] = true;

      } catch (Exception  $error) {
         $field = isset($error->field) ? $error->field : "";
         $response["errors"] = [$field => [$error->getMessage()]];
         $response["status"] = false;
      }
      return $response;
   }

   public function getPeriodVotes($eventId = null, $eventPeriodId = null)
   {
      $eventId = isset($eventId) ? $eventId : $this->item->id;
      $cmd = "Select a.* 
              From Events a
              Where a.id = $eventId";
      $event = $this->db->query($cmd)->row;
      $cmd = "Select a.*";
      if ($event["restricted"]) {
         if (isset($eventPeriodId))
            $cmd .= ", c.userId is not null as disponibil ";
         $cmd .= " from users a
                   LEFT JOIN `events-allowed-users` b on b.userId= a.id and b.eventId= $eventId";
         if (isset($eventPeriodId))
            $cmd .= "LEFT JOIN `events-periods-votes` c on c.userId = a.id and c.eventPeriodId = $eventPeriodId";
         $cmd .= "WHERE b.userId is not null";
      } else {
         if (isset($eventPeriodId))
            $cmd .= ", c.userId is not null as disponibil ";
         $cmd .= "from users a ";
         if (isset($eventPeriodId))
            $cmd .= "LEFT JOIN `events-periods-votes` c on c.userId = a.id and c.eventPeriodId = $eventPeriodId";
      }
      return $this->db->query($cmd)->rows;
   }

   public function getAvailability($eventId)
   {
      $cmd = (new EventAvailability($this->db))->sqlBuildGetAllItems(array("a.typeId" => $eventId, "a.type" => "event"));
      $intervals = $this->db->query($cmd)->rows;
      $dates = [];
      foreach ($intervals as $userInterval) {
         $start = DateTime::createFromFormat("Y-m-d", $userInterval["start"]);
         $start->setTime($start->getOffset() / 3600, 0, 0);
         $end = DateTime::createFromFormat("Y-m-d", $userInterval["end"]);
         $end->setTime($end->getOffset() / 3600, 0, 0);

         $interval = DateInterval::createFromDateString('1 day');
         $period = new DatePeriod($start, $interval, $end);
         foreach ($period as $date) {
            $date->setTime($date->getOffset() / 3600, 0, 0);
            $dayOfWeek = $date->format("w");
            if (($dayOfWeek == "1" && $userInterval["monday"])
               || ($dayOfWeek == "2" && $userInterval["tuesday"])
               || ($dayOfWeek == "3" && $userInterval["wednesday"])
               || ($dayOfWeek == "4" && $userInterval["thursday"])
               || ($dayOfWeek == "5" && $userInterval["friday"])
               || ($dayOfWeek == "6" && $userInterval["saturday"])
               || ($dayOfWeek == "0" && $userInterval["sunday"])
            )
               $dates[] = array("eventId" => $eventId, "userId" => $userInterval["userId"], "date" => $date->format("Y-m-d"), "userName" => $userInterval["userName"]);
         }
      }
      return $dates;
   }

   public function getAvailabilityAction()
   {
      try {
         $response["data"] = $this->getAvailability($this->item->id);
         $response["status"] = true;
      } catch (Exception  $error) {
         $field = isset($error->field) ? $error->field : "";
         $response["errors"] = [$field => [$error->getMessage()]];
         $response["status"] = false;
      }
      return $response;
   }
}
