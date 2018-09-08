<?php
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/base.model.php";
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/module/Country.php";

class CityItem extends ModelItem
{
	public $id;
	public $name;
	public $nameInvariant;
	public $countryId;
}

class City extends BaseModel
{
	public $tableName = "cities";
	public $modelItem = "CityItem";

	public function sqlBuildGetAllItems($where = null, $order = null, $limit = NULL)
	{
		$cmd = 'SELECT a.*,
                b.name as country, b.nameInvariant as countryInvariant 
              FROM `' . $this->tableName . '` a
              LEFT JOIN `countries` b ON b.id = a.countryId';
		if (isset($where)) $cmd .= $this->sqlBuildWhere($where);
		return $cmd;
	}

	public function getListAction($where = null, $order = null, $limit = NULL)
	{
		$response = parent::getListAction($where, $order);
		if (!$response["status"]) return $response;
		$countries = (new Country($this->db, $this->postData))->getListAction();
		if (!$countries["status"]) return $countries;
		$response["countries"] = $countries["data"];
		return $response;
	}

	public function validate(&$data = null)
	{
		$itemName = "City";
		if (!isset($this->item->countryId)) {
			$exception = new Exception("Country is required");
			$exception->field = "countryId";
			throw $exception;

		}
		if (!isset($this->item->name)) {
			$exception = new Exception("$itemName name is required");
			$exception->field = "name";
			throw $exception;
		}
		if (!isset($this->item->nameInvariant)) {
			$exception = new Exception("$itemName  name is required");
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

}
