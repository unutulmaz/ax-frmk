<?php
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/base.model.php";
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/module/Product.php";

class InvoiceDetailItem extends ModelItem
{
   public $id;
   public $invoiceId;
   public $position;
   public $productId;
   public $quantity;
   public $productPrice;
   public $discount;
   public $discountValue;
}

class InvoiceDetail extends BaseModel
{
   public $tableName = "invoices-details";
   public $modelItem = "InvoiceDetailItem";
   public $foreignKey = "invoiceId";
   public $validateOnWrite = false;

   public function sqlBuildGetAllItems($where = null, $order = null)
   {
      $cmd = 'SELECT a.*, 
                     b.name as productName, 
                     b.nameInvariant as productInvariant,
                     b.code as productCode, 
                     c.name as productCategory, 
                     b.unit as productUnit
                 FROM `' . $this->tableName . '` a 
                 LEFT JOIN products b on b.id = a.productId
                 LEFT JOIN `products-categories` c on c.id = b.categoryId';
      if (isset($where)) $cmd .= $this->sqlBuildWhere($where);
      return $cmd;
   }

   public function getListAction($where = null, $order = null)
   {
      try {
         if (isset($_REQUEST["invoiceId"]) && !isset($where["invoiceId"])) {
            $where["invoiceId"] = $_REQUEST["invoiceId"];
         }
         $cmd = $this->sqlBuildGetAllItems($where, $order);
         if (!isset($where["invoiceId"])) {
            throw  new Exception("invoiceId query parameter needed");
         }
         $queryResult = $this->db->query($cmd);
         $response = array();
         $response["data"] = $queryResult->rows;
         $response["status"] = true;

         return $response;
      } catch (Exception  $error) {
         return $this->catchError($error);
      }

   }

   private function addError($field = null, $message)
   {
      if (isset($field)) {
         if (!isset($this->errors->$field)) $this->errors->$field = array();
         $error = $this->errors->$field;
         $error[] = $message;
         $this->errors->$field = $error;
      } else {
         if (!isset($this->errors->{''})) $this->errors->{''} = array();
         $this->errors->{''}[] = $message;
      }
      $this->hasErrors = true;
   }

   public function validate(&$data=null)
   {
      $this->errors = new stdClass();
      $this->hasErrors = false;
      if (!isset($this->item->position)) {
         $this->addError("position", "Field is required");
      }
      if (!isset($this->item->productId)) {
         $this->addError("productId", "Field is required");
      }
      if (!isset($this->item->quantity) || !$this->item->quantity > 0) {
         $this->addError("quantity", "Field is required");

      }
      if (!isset($this->item->productPrice) || !$this->item->productPrice > 0) {
         $this->addError("productPrice", "Field is required");
      }
      return !$this->hasErrors;
   }

}
