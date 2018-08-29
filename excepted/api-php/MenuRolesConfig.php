<?php
include_once $_SERVER["DOCUMENT_ROOT"] . "\api\\module\\events\model.php";
include_once $_SERVER["DOCUMENT_ROOT"] . "\api\config.php";

class MenuRolesConfig
{
   static public $userId;

   public static function GetMenuList($role, $userId, $users)
   {
      self::$userId = $userId;
      $menus = array();
      $menus[] = self:: addRole($role, $role, self:: addMenu($role, $users));
      return $menus;
   }

   private static function addRole($roleId, $roleName, $menu)
   {
      $menu = array("RoleId" => $roleId, "RoleName" => $roleName, "Menu" => $menu);
      return $menu;
   }

   private static function addMenu($role, $usersItems)
   {
      global $dbConnection;
      $items = array();
//      $items[] = new MenuItem("User profile", "profile", "app-modules/reunion/users/profile.html");
      $admin = new MenuItem("Administration");
      $admin->appendChild("Events", "events", "app-modules/reunion/events/index.html");
      $admin->appendChild("Users", "users", "app-modules/reunion/users/index.html");
      if ($role == "admin") $items[] = $admin;
      $events = new MenuItem("Events");
      $eventObj = new Event($dbConnection);
      $response = $eventObj->getListAction();
      if ($response["status"]) {
         foreach ($response["data"] as $event) {
            if ($event["restricted"] == "1") {
               $response = $eventObj->getItemDetailsAction($event["id"]);
               if (!$response["status"]) {
                  echo json_encode($response["errors"]);
                  break;
               }
               $allowed = false;
               foreach ($response["data"]["allowed-users"] as $user) {
                  if ($user["id"] == self::$userId) {
                     $allowed = $user["allowed"] == "1";
                     break;
                  }
               }
               if (!$allowed) continue;
            }
            $eventMenu = $events->appendChild($event["name"], "event({id:" . $event["id"] . "})");
//            $eventMenu->appendChild("Perioada");
//            $eventMenu->appendChild("Locatie");
         }
      }
      $items[] = $events;
      $users = new MenuItem("Users");
      foreach ($usersItems as $user) {
         $users->appendChild($user["fullName"], "user({id:" . $user["id"] . "})");
      }
//      $items[] = $users;

      return $items;
   }
}

class MenuItem
{
   public $title;
   public $route;
   public $templateUrl;
   public $cssClass;
   public $items;
   public $showItems = true;

   public function __construct($title, $route = "", $templateUrl = "", $items = array())
   {
      $this->title = $title;
      $this->route = $route;
      $this->templateUrl = $templateUrl;
      if ($items) $this->items = $items;
   }

   public function appendChild($title, $route = "", $templateUrl = "")
   {
      $item = new MenuItem($title, $route, $templateUrl);
      if (!$this->items) $this->items = [];
      $this->items[] = $item;
      return $item;
   }
}