<?php
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/base.controller.php";

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
			$roles[] = array("id" => "guest", "name" => "Guest");
			$response["extra"] = array("menus" => MenuRolesConfig::getMenuList($roles), "roles" => array("guest"));
			$response["status"] = true;
		} catch (Exception  $error) {
			$response["errors"] = $error->getMessage();
			$response["status"] = false;
		}
		$response["extra"]["version"] = APP_VERSION;
		return $response;
	}
}
