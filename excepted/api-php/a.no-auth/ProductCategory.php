<?php
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/base.model.php";


class ProductsCategoryItem extends ModelItem
{
   public $id;
   public $name;
   public $nameInvariant;
   public $code;
   public $description;
}

class ProductCategory extends BaseModel
{
   public $tableName = "products-categories";
   public $modelItem = "ProductsCategoryItem";
   public function validate(&$data=null)
   {
      $itemName = "Product Category";
      if (!isset($this->item->name)) {
         $exception = new Exception("$itemName name is required");
         $exception->field = "name";
         throw $exception;
      }
      if (!isset($this->item->nameInvariant)) {
         $exception = new Exception("$itemName  name is required");
         $exception->field = "name";
         throw $exception;

      }
      if (strlen($this->item->name) < 3) {
         $exception = new Exception("$itemName name must have at least three characters.");
         $exception->field = "name";
         throw $exception;
      }

      $cmd = 'SELECT * from `' . $this->tableName . '` Where name = "' . $this->item->name . '"' . (isset($this->item->id) ? ' AND id !=' . $this->item->id : '');
      $queryResult1 = $this->db->query($cmd);
      if ($queryResult1->num_rows > 0) {
         $exception = new Exception('The ' . $itemName . ' with name: "' . $this->item->name . '" already exists!');
         $exception->field = "name";
         throw $exception;
      }
      return true;
   }

}
