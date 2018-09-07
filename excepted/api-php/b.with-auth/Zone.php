<?php
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/base.model.php";
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/module/City.php";

class ZoneItem extends ModelItem
{
   public $id;
   public $nume;
   public $numeInvariant;
   public $cityId;
}

class Zone extends BaseModel
{
   public $tableName = "zones";
   public $modelItem = "ZoneItem";

   public function sqlBuildGetAllItems($where=null, $order=null)
   {
      $cmd = 'SELECT a.*,
                b.nume as city, b.numeInvariant as cityInvariant 
              FROM `' . $this->tableName . '` a
              LEFT JOIN `cities` b ON b.id = a.cityId';
      if (isset($where)) $cmd .= $this->sqlBuildWhere($where);
      return $cmd;
   }

   public function getListAction($where=null, $order=null)
   {
      $response = parent::getListAction($where, $order);
      if (!$response["status"]) return $response;
      $cities = (new City($this->db, $this->postData))->getListAction();
      if (!$cities["status"]) return $cities;
      $response["cities"] = $cities["data"];
      return $response;
   }

   public function validate(&$data=null)
   {
      $itemName = "Zona";
      if (!isset($this->item->cityId)) {
         $exception = new Exception("Orasul is este necesar");
         $exception->field = "cityId";
         throw $exception;

      }
      if (!isset($this->item->nume)) {
         $exception = new Exception("$itemName nume este necesar");
         $exception->field = "nume";
         throw $exception;
      }
      if (!isset($this->item->numeInvariant)) {
         $exception = new Exception("$itemName  nume este necesar");
         $exception->field = "nume";
         throw $exception;

      }
      if (strlen($this->item->nume) < 3) {
         $exception = new Exception("$itemName nume trebuie sa aiba mai mult de trei czractere.");
         $exception->field = "nume";
         throw $exception;
      }

      $cmd = 'SELECT * from `' . $this->tableName . '` Where nume = "' . $this->item->nume . '"' . (isset($this->item->id) ? ' AND id !=' . $this->item->id : '');
      $queryResult1 = $this->db->query($cmd);
      if ($queryResult1->num_rows > 0) {
         $exception = new Exception($itemName . ' cu numele: "' . $this->item->name . '" exista deja!');
         $exception->field = "nume";
         throw $exception;
      }
      return true;
   }

}
