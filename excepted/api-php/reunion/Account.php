<?php
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/base.controller.php";

class Account extends BaseController
{

   public function getUserInfoAction()
   {
      include_once $_SERVER["DOCUMENT_ROOT"] . "/api/module/User.php";
      $response = array();
      $response["status"] = false;
      try {
         if (!isset($_COOKIE["reunion-user"]) && !isset($this->postData->email)) throw new Exception("Use login link");
         $email = isset($_COOKIE["reunion-user"]) ? $_COOKIE["reunion-user"] : $this->postData->email;
         $userClass = new User($this->dbConnection, null);
         $users = $userClass->getListAction(array("email" => $email));
         if (!$users["status"]) return $users;
         if (count($users["data"]) == 0) throw new Exception("No user found for email: " . $email);
         if ($users["data"][0]["disabled"] == 1) throw new Exception("Access is disabled for email: " . $email);

         $data = $users["data"][0];
         $data["UserName"] = $email;

         $response["data"] = $data;
         $expired = 365 * 86400 + time();
         setcookie("currentUserId", $data["id"], $expired, "/");
         setcookie("reunion-user", $email, $expired, "/");

         $usersResponse = $userClass->getListAction(null, array("fullName" => "ASC"));
         if (!$usersResponse ["status"]) return $usersResponse;
         $role = explode(";", $data["roles"]) [0];
         $response["extra"] = array("menus" => MenuRolesConfig::getMenuList($role, $data["id"], $usersResponse["data"]),
            "roles" => explode(";", $data["roles"]),
            "users" => $usersResponse["data"]);
         $response["status"] = true;
      } catch (Exception  $error) {
         $response["errors"] = ["" => [$error->getMessage()]];
         $response["status"] = false;
      }
      $response["extra"]["version"] = APP_VERSION;
      return $response;
   }

   public function loginAction()
   {
      include_once $_SERVER["DOCUMENT_ROOT"] . "/api/module/User.php";
      $response = array();
      try {
         if (!isset($_REQUEST["id"])) throw new Exception("No id provided");
         $userObj = new User($this->dbConnection, null);
         $user = $userObj->getItemAction(array("loginToken" => $_REQUEST["id"]));
         if (!$user["status"]) throw new Exception("No user found for id provided! Enter the login page to receive another login link");
         $user["data"]["lastLogin"] = date("c");
         $response = $userObj->updateAction(false, $user["data"]);
         if (!$response["status"]) return $response;
         if (count($user["data"]) === 0) throw new Exception("No user found for id provided!");
         $email = $user["data"]["email"];
         $expired = 365 * 86400 + time();
         setcookie("reunion-user", $email, $expired, "/");
         $response["data"] = array("user" => $email);
         $response["status"] = true;
         header("Location: " . $this->getServerRoot() . "#!/profile"); /* Redirect browser */
         exit();
      } catch (Exception  $error) {
         $response["errors"] = $error->getMessage();
         $response["status"] = false;
         header("Location: " . $this->getServerRoot() . "#!/login"); /* Redirect browser */
      }
      $response["extra"]["version"] = APP_VERSION;
      return $response;
   }

   public function sendLinkAction()
   {
      include_once $_SERVER["DOCUMENT_ROOT"] . "/api/module/User.php";
      include_once $_SERVER["DOCUMENT_ROOT"] . "/api/send-email.php";
      global $email;
      $response = array();
      try {
         if (!isset($this->postData->{"email"})) throw new Exception("No email provided");
         $userEmail = $this->postData->email;
         $firstName = isset($this->postData->firstName) ? $this->postData->firstName : null;
         $lastName = isset($this->postData->lastName) ? $this->postData->lastName : null;
         $userName = implode(" ", [$firstName, $lastName]);
         $guid = guidv4();
         $userData = array("email" => $userEmail, "firstName" => $firstName, "lastName" => $lastName, "fullName" => $userName, "loginToken" => $guid);
         $userObj = new User($this->dbConnection, json_encode($userData));
         $user = $userObj->getItemAction(array("email" => $userEmail));
         if ($user["status"]) {
            foreach ($userData as $key => $value) {
               if (is_null($value) || $value == "") continue;
               $user["data"][$key] = $value;
            }
            $updateResponse = $userObj->updateAction(false, $user["data"]);
            if (!$updateResponse["status"]) return $updateResponse;
            $userName = $updateResponse["data"]["fullName"];
         } else {
            $user = $userObj->createAction(false, $userData);
            if (!$user["status"]) return $user;
         }
         $email["Subject"] = "Login link to 'Reunion' application for " . $userName;
         $email["To"] = array("email" => $userEmail, "name" => $userName);
         $email["MsgHTML"] = "Bine ai venit la Reunion, $userName!";
         $email["MsgHTML"] .= "<br>Utilizeaza acest link (numai cu Chrome browser pt. desktop) ptr. login:<br> ";
         $email["MsgHTML"] .= "{$_SERVER['HTTP_REFERER']}account/login?id=$guid"   ;
         $email["MsgHTML"] .= "<br>Daca ai probleme cu logarea (sau aplicatia), contacteaza-ma la adresa de email bogdanim36@gmail.com, sau prin telefon la 0730740392.";
         $email["MsgHTML"] .= "<br>Probabil vor fi bug-uri, sper sa nu te superi si sa ma anunti, pt. a le putea remedia.";

         $response = sendMail();
         if ($response != 1) return $response;

         $_COOKIE["currentUserId"] = "";
         $response = array("data" => [], "status" => true);
      } catch (Exception  $error) {
         $response["errors"] = ["" => [$error->getMessage()]];
         $response["status"] = false;
      }
      return $response;
   }
}