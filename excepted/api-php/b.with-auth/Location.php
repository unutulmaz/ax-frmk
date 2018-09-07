<?php
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/base.model.php";
include_once "Zone.php";
include_once "City.php";
include_once "LocationCarusel.php";
include_once "Camera.php";
include_once "User.php";

class LocationItem extends ModelItem
{
	public $id;
	public $nume;
	public $numeInvariant;
	public $zoneId;
	public $userId;
	public $cod;
	public $descriere;
	public $videoUrl;
	public $caruselHtml;
	public $estePublic;
}

class Location extends BaseModel
{
	public $tableName = "locations";
	public $modelItem = "LocationItem";
	public $childrenItems = [];
	public $children = array(
		"LocationCarusel" => array(
			"postData" => 'carusel',
			"foreignKey" => "locationId"),
		"Camera" => array(
			"postData" => 'camere',
			"foreignKey" => "locationId"));

	public function sqlBuildGetAllItems($where = null, $order = null)
	{
		$cmd = 'SELECT a.id, a.zoneId, a.cod, a.nume, a.numeInvariant, a.estePublic,
                d.numeComplet as user, d.numeCompletInvariant as userInvariant, 
                b.nume as zone, b.numeInvariant as zoneInvariant, 
                c.id as cityId, c.nume as city, c.numeInvariant as cityInvariant 
              FROM `' . $this->tableName . '` a
              LEFT JOIN `zones` b ON b.id = a.zoneId
              LEFT JOIN `cities` c ON c.id = b.cityId
              LEFT JOIN `users` d ON d.id = a.userId';
		if (isset($where)) $cmd .= $this->sqlBuildWhere($where);
		return $cmd;
	}

	public function sqlBuildGetItem($where = null, $order = null)
	{
		$cmd = 'SELECT a.*,
                d.numeComplet as user, d.numeCompletInvariant as userInvariant, 
                b.nume as zone, b.numeInvariant as zoneInvariant, 
                c.id as cityId, c.nume as city, c.numeInvariant as cityInvariant 
              FROM `' . $this->tableName . '` a
              LEFT JOIN `zones` b ON b.id = a.zoneId
              LEFT JOIN `cities` c ON c.id = b.cityId
              LEFT JOIN `users` d ON d.id = a.userId';
		if (isset($where)) $cmd .= $this->sqlBuildWhere($where);
		return $cmd;
	}

	public function getListAction($where = null, $order = null)
	{
		if (isset($_REQUEST["userId"]) && !isset($where)) $where = array("userId" => $_REQUEST["userId"]);
		$response = parent::getListAction($where, $order);
		if (!$response["status"]) return $response;
		$zones = (new Zone($this->db, $this->postData))->getListAction();
		if (!$zones["status"]) return $zones;
		$response["zones"] = $zones["data"];
		$cities = (new City($this->db, $this->postData))->getListAction();
		if (!$cities["status"]) return $cities;
		$response["cities"] = $cities["data"];
		$users = (new User($this->db, $this->postData))->getListAction();
		if (!$users["status"]) return $users;
		$response["users"] = $users["data"];
		return $response;
	}

	public function getPublicItemAction()
	{
		if (isset($_REQUEST["id"])) {
			$where = array("a.id" => $_REQUEST["id"]);
			$where["estePublic"] = "1";
		} else $where=array("a.id"=>"xx");
		return $this->getItemAction($where);
}

	public function getItemAction($where = null)
	{
		if (isset($_REQUEST["id"]) && !isset($where)) {
			$where = array("a.id" => $_REQUEST["id"]);
			if (isset($_REQUEST["estePublic"])) $where["estePublic"] = $_REQUEST["estePublic"];
		}
		$response = parent::getItemAction($where);
		if (!$response["status"]) return $response;
		$caruselObj = new LocationCarusel($this->db);
		$locationId = count($response["data"]) > 0 ? $response["data"]["id"] : 0;
		$caruselItems = $caruselObj->getListAction(array("locationId" => $locationId));
		if (!$caruselItems["status"]) return $caruselItems;
		$response["data"]["children"] = array("carusel" => $caruselItems["data"]);

		$cameraObj = new Camera($this->db);
		$camereItems = $cameraObj->getListAction(array("locationId" => $locationId));
		if (!$camereItems["status"]) return $camereItems;
		$response["data"]["children"]["camere"] = $camereItems["data"];
		$response["status"] = true;
		return $response;
	}

	public function validate(&$data = null)
	{
		$itemName = "Locatie";
		if (!isset($this->item->zoneId)) {
			$exception = new Exception("Zona lcaotiei is este necesara");
			$exception->field = "zoneId";
			throw $exception;

		}
		if (!isset($this->item->nume)) {
			$exception = new Exception("$itemName nume este necesar");
			$exception->field = "nume";
			throw $exception;
		}
		if (!isset($this->item->numeInvariant)) {
			$exception = new Exception("$itemName  nume este necesar");
			$exception->field = "nume";
			throw $exception;

		}
		if (strlen($this->item->nume) < 3) {
			$exception = new Exception("$itemName nume trebuie sa aiba mai mult de trei caractere.");
			$exception->field = "nume";
			throw $exception;
		}
		return $this->childrenValidate();
	}

}
