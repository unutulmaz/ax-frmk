<?php
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/base.model.php";
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/module/Location.php";

class CameraItem extends ModelItem
{
   public $id;
   public $locationId;
   public $cod;
   public $url;
}

class Camera extends BaseModel
{
   public $tableName = "camere";
   public $modelItem = "CameraItem";
	public $foreignKey = "locationId";
	public $validateOnWrite = false;


   public function validate(&$data=null)
   {
      $itemName = "Camera";
      if (!isset($this->item->locationId)) {
         $exception = new Exception("Locatia is este necesara");
         $exception->field = "locationId";
         throw $exception;

      }
      if (!isset($this->item->cod)) {
         $exception = new Exception("$itemName cod este necesar");
         $exception->field = "cod";
         throw $exception;
      }

      $cmd = 'SELECT * from `' . $this->tableName . '` Where cod = "' . $this->item->cod . '"' . (isset($this->item->id) ? ' AND id !=' . $this->item->id : '');
      $queryResult1 = $this->db->query($cmd);
      if ($queryResult1->num_rows > 0) {
         $exception = new Exception($itemName . ' cu codul: "' . $this->item->cod . '" exista deja!');
         $exception->field = "cod";
         throw $exception;
      }
      return true;
   }

}
