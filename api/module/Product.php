<?php
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/base.model.php";
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/module/ProductCategory.php";

class ProductsItem extends ModelItem
{
   public $id;
   public $name;
   public $nameInvariant;
   public $code;
   public $description;
   public $unit;
   public $categoryId;
   public $price;
}

class Product extends BaseModel
{
   public $tableName = "products";
   public $modelItem = "ProductsItem";

   public function sqlBuildGetAllItems($where = null, $order = null, $limit = NULL)
   {
      $cmd = 'SELECT a.*,
                b.name as category, b.nameInvariant as categoryInvariant 
              FROM `' . $this->tableName . '` a
              LEFT JOIN `products-categories` b ON b.id = a.categoryId';
      if (isset($where)) $cmd .= $this->sqlBuildWhere($where);
      return $cmd;
   }

   public function getListAction($where = null, $order = null, $limit = NULL)
   {
      $response = parent::getListAction($where, $order);
      if (!$response["status"]) return $response;
      $categories = (new ProductCategory($this->db, $this->postData))->getListAction();
      if (!$categories["status"]) return $categories;
      $response["productsCategories"] = $categories["data"];
      return $response;
   }

   public function validate(&$data = null)
   {
      $itemName = "Product";
      if (!isset($this->item->name)) {
         $exception = new Exception("$itemName name is required");
         $exception->field = "name";
         throw $exception;
      }
      if (!isset($this->item->unit)) {
         $exception = new Exception("$itemName unit is required");
         $exception->field = "unit";
         throw $exception;
      }
      if (!isset($this->item->price)) {
         $exception = new Exception("$itemName price is required");
         $exception->field = "price";
         throw $exception;
      }
      if (!isset($this->item->categoryId)) {
         $exception = new Exception("$itemName category is required");
         $exception->field = "categoryId";
         throw $exception;
      }
      if (!isset($this->item->nameInvariant)) {
         $exception = new Exception("$itemName  nameInvariant is required");
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

   public function populateAction()
   {
      $categoriesR = (new ProductCategory($this->db, $this->postData))->getListAction();
      $categories = $categoriesR["data"];
      $productsR = $this->getListAction();
      $products = $productsR["data"];
      foreach ($products as $product) {
         $namesIndex = rand(0, 4);
         $product["categoryId"] = $categories[rand(0, count($categories) - 1)]["id"];
         $product["price"] = rand(0.05, 10000.99);
         $this->update(true, $product);
      }
      return array("status" => true);
   }
}
