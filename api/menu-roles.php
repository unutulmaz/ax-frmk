<?php
include_once "config.menu.php";
include_once "menu-item.php";

class MenuRoles
{
	static public $userId;

	public static function GetMenuList($roles, $userId = 0)
	{
		self::$userId = $userId;
		$menus = array();
		foreach ($roles as $role) {
			$menus[] = array(
				"RoleId" => $role["id"],
				"RoleName" => $role["name"],
				"Menu" => self:: addMenu($role["id"]));
		}
		return $menus;
	}


	private static function addMenu($roleId)
	{
		return addMenu($roleId);
	}
}

