<?php


class BaseController
{
   public $modelClass;
   public $db;
   public $postData;

   public function __construct($dbConnection, $postData = "{}")
   {
      $this->db = $dbConnection;
      $this->postData = json_decode($postData, false);
   }

   public function getServerRoot()
   {
      return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != "off" ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . '/';
   }

   public function action($action)
   {
      $action .= "Action";
      return $this->$action();
   }
}
