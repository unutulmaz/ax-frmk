<?php
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/base.model.php";

class CityItem extends ModelItem
{
   public $id;
   public $nume;
   public $numeInvariant;

}

class City extends BaseModel
{
   public $tableName = "cities";
   public $modelItem = "CityItem";


   public function validate(&$data = null)
   {
      $itemName = "Oras";
      $item = $this->getDataItem($data);
      if (!isset($item->nume)) {
         $exception = new Exception("Nume $itemName  este obligatoriu");
         $exception->field = "nume";
         throw $exception;
      }
      return true;
   }

}
