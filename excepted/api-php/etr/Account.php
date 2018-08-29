<?php
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/base.controller.php";

class Account extends BaseController
{

	public function getUserInfoAction()
	{
		include_once $_SERVER["DOCUMENT_ROOT"] . "/api/menu-roles.php";
		include_once $_SERVER["DOCUMENT_ROOT"] . "/api/module/User.php";
		$response = array();
		$response["status"] = false;
		try {
			if (!isset($_COOKIE["etr-user"]) && !isset($this->postData->email)) throw new Exception("Login user");
			$email = isset($_COOKIE["etr-user"]) ? $_COOKIE["etr-user"] : $this->postData->email;
			$userClass = new User($this->db, null);
			$users = $userClass->getListAction(array("email" => $email));
			if (!$users["status"]) return $users;
			if (count($users["data"]) == 0) throw new Exception("No user found for email: " . $email);
			if ($users["data"][0]["esteActiv"] == 0) throw new Exception("Access is disabled for email: " . $email);

			$data = $users["data"][0];

			$response["data"] = $data;
			$expired = 365 * 86400 + time();
			setcookie("etr-user", $email, $expired, "/");
			if ($data["esteAdmin"] === "1") $userRoles = array(array("id" => "admin", "name" => "admin"));
			else $userRoles = array(array("id" => "user", "name" => "user"));
			$menus = MenuRolesConfig::getMenuList($userRoles, $data["id"]);
			$response["extra"] = array("menus" => $menus, "roles" => array("admin", "user"));
			$response["status"] = true;
		} catch (Exception  $error) {
			$response["errors"] = $error->getMessage();
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
			if (!$this->postData->email) throw new Exception("No email provided");
			if (!$this->postData->parola) throw new Exception("Nu e parolaaaaa");
			$userObj = new User($this->db, null);
			$users = $userObj->getUserByEmailAndPassword($this->postData->email, $this->postData->parola);
			if (!$users["status"] || count($users["data"]) != 1) throw new Exception("No user found for email and password provided!");
			$expired = 365 * 86400 + time();
			setcookie("etr-user", $this->postData->email, $expired, "/");
			return $this->getUserInfoAction();
		} catch (Exception  $error) {
			$response["errors"] = $error->getMessage();
			$response["status"] = false;
		}
		$response["extra"]["version"] = APP_VERSION;
		return $response;
	}

	public function logoffAction()
	{
		include_once $_SERVER["DOCUMENT_ROOT"] . "/api/module/User.php";
		$response = array();
		try {
			setcookie("etr-user", null, 1 + time(), "/");
			unset($_COOKIE["etr-user"]);
			return array("status" => true);
		} catch (Exception  $error) {
			$response["errors"] = $error->getMessage();
			$response["status"] = false;
		}
		$response["extra"]["version"] = APP_VERSION;
		return $response;
	}

	public function resetPasswordAction()
	{
		include_once $_SERVER["DOCUMENT_ROOT"] . "/api/module/User.php";
		include_once $_SERVER["DOCUMENT_ROOT"] . "/api/send-email.php";
		global $email;
		$response = array();
		try {
			if (!isset($this->postData->{"email"})) throw new Exception("No email provided");
			$userEmail = $this->postData->email;
			$guid = guidv4();
			$userObj = new User($this->db);
			$user = $userObj->getItemAction(array("email" => $userEmail));
			if ($user["status"]) {
				$user["data"]["resetLink"] = $guid;
				$updateResponse = $userObj->updateAction(false, $user["data"]);
				if (!$updateResponse["status"]) return $updateResponse;
				$userName = $updateResponse["data"]["numeComplet"];
			} else {
				throw new Exception("No user found for " . $email);
			}
			$email["Subject"] = "Resetare parola ETR pt. " . $userName;
			$email["To"] = array("email" => $userEmail, "name" => $userName);
			$email["MsgHTML"] = "";
			$email["MsgHTML"] .= "<br>Utilizeaza acest link (numai cu Chrome browser pt. desktop) ptr. resetare parola:<br> ";
			$email["MsgHTML"] .= "{$_SERVER['HTTP_REFERER']}#!/resetare-parola?id=$guid";
			$email["MsgHTML"] .= "<br>Atentie: linkul este valabil o singura data!";
			$email["MsgHTML"] .= "<br>Daca ai probleme cu logarea (sau aplicatia), contacteaza-ma la adresa de email bogdanim36@gmail.com, sau prin telefon la 0730740392.";

			$response = sendMail();
			if ($response != 1) return $response;
			$response = array("status" => true);
		} catch (Exception  $error) {
			$response["errors"] = $error->getMessage();
			$response["status"] = false;
		}
		return $response;
	}

	public function savePasswordAction()
	{
		include_once $_SERVER["DOCUMENT_ROOT"] . "/api/module/User.php";
		try {
			if (!isset($this->postData->id)) throw new Exception("No id provided");
			if (!isset($this->postData->parola)) throw new Exception("No password provided");
			$userObj = new User($this->db);
			$response = $userObj->savePassword($this->postData->id, $this->postData->parola);
			if (!$response["status"]) {
				return array("status" => false, "errors" => "Link isn't valid one. Reset again your password");
			}
			$this->postData->email = $response["data"]["email"];
			$this->postData->parola = $response["data"]["parola"];
			return $this->loginAction();
		} catch (Exception  $error) {
			$response = array();
			$response["errors"] = $error->getMessage();
			$response["status"] = false;
		}
		return $response;
	}
}