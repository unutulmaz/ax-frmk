<?php
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/base.controller.php";
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/config.appinfo.php";

class Account extends BaseController
{
	public function getUserInfoAction()
	{
		include_once $_SERVER["DOCUMENT_ROOT"] . "/api/menu-roles.php";
		$response = array();
		$data = array();
		$data["UserName"] = "Anonymous";
		$data["FirstName"] = "Anonymous";
		$data["LastName"] = "User";
		$response["data"] = $data;
		try {
			$roles = array();
			if (isset($_GET['docs'])) $roles[] = array("id" => "docs", "name" => "docs");
			else $roles[] = array("id" => "guest", "name" => "Guest");
			$response["menus"] = MenuRoles::getMenuList($roles);
			$response["status"] = true;
		} catch (Exception  $error) {
			$response["errors"] = $error->getMessage();
			$response["status"] = false;
		}
		$response["extra"]["version"] = APP_VERSION;
		return $response;
	}
}
