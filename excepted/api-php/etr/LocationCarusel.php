<?php
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/base.model.php";
include_once "Location.php";

class LocationCaruselItem extends ModelItem
{
	public $id;
	public $locationId;
	public $descriere;
	public $tip;
	public $visibil;
	public $tmpPath;
	public $locationPath;
	public $numeFisier;
	public $moved;
	public $index;
}

class LocationCarusel extends BaseModel
{
	public $tableName = "locations-carusel";
	public $modelItem = "LocationCaruselItem";
	public $foreignKey = "locationId";
	public $validateOnWrite = false;

	private function getFilesPath($item)
	{
		$root = $_SERVER["DOCUMENT_ROOT"] . DIRECTORY_SEPARATOR . CARUSEL_FILES . DIRECTORY_SEPARATOR;
//		$locationObj = new Location($this->db);
//		$locationData = $locationObj->getItemAction(array("a.id" => $item->locationId));
//		if ($locationData["status"] == false) return $locationData;
//		$locationItem = $locationData["data"];
//		$path = $root . $locationItem["nume"] . "-" . $locationItem["id"];
		$path = $root . $item->locationId;
		if (!file_exists($path)) mkdir($path, 0777, true);
		return array("status" => true, "path" => $path);
	}

	public function sqlBuildGetAllItems($where = null, $order = null)
	{
		$cmd = 'SELECT a.* 
              FROM `' . $this->tableName . '` a';
		if (isset($where)) $cmd .= $this->sqlBuildWhere($where);
		return $cmd;
	}

	public function getListAction($where = null, $order = null)
	{
		$response = parent::getListAction($where, $order);
		if (!$response["status"]) return $response;
		return $response;
	}

	public function deleteActionCallback($response, $postData)
	{
		$item = $response["data"];
		$result = true;
		if (file_exists($item["tmpPath"])) $result = unlink($item["tmpPath"]);
		else
		if (!$result) return $this->createErrorResponse("File " . $item["tmpPath"] . "cannot be deleted!");
		if (file_exists($item["locationPath"])) $result = unlink($item["locationPath"]);
//		else $this->createErrorResponse("File " . $item["locationPath"] . " doesn't exist!");
		if (!$result) return $this->createErrorResponse("File " . $item["locationPath"] . "cannot be deleted!");
		return array("status" => true);
	}

	private function actionCallback($response, $postData)
	{
		if ($response["status"]) {
			$tmpPath = $postData->item->tmpPath;
			$result = true;
			if (file_exists($tmpPath)) $result = unlink($tmpPath);
			if (!$result) throw new Exception("File " . $tmpPath . " no deleted!");
		}
		return $response;
	}

	public function updateActionCallback($response, $postData)
	{
		return $this->actionCallback($response, $postData);
	}

	public function createActionCallback($response, $postData)
	{
		return $this->actionCallback($response, $postData);
	}

	public function validate(&$data = null)
	{
		$itemName = "Fisier carusel";
		$item = $this->getDataItem($data);
		if (!isset($item->locationId)) {
			$exception = new Exception("Locatia este necesara");
			$exception->field = "locationId";
			throw $exception;

		}
		if (!isset($item->tip)) {
			$exception = new Exception("Tipul este necesar");
			$exception->field = "tip";
			throw $exception;

		}
		if (!isset($item->descriere)) {
			$exception = new Exception("Descrierea este necesara");
			$exception->field = "descriere";
			throw $exception;
		}
		if (!isset($item->numeFisier) || !isset($item->tmpPath)) {
			$exception = new Exception("Fisierul nu a fost incarcat.Reincercati!");
			$exception->field = "fisiere";
			throw $exception;
		}
		if (!isset($item->moved) || !$item->moved) {
			$locationPathData = $this->getFilesPath($item);
			if ($locationPathData["status"] == false) return $locationPathData;
			$locationPath = $locationPathData["path"];
			$newLocation = $locationPath . DIRECTORY_SEPARATOR . pathinfo($item->tmpPath, PATHINFO_BASENAME);
			try {
				$result = copy($item->tmpPath, $newLocation);
				if (!$result) throw new Exception("File " . $locationPath . " not moved");
				$item->locationPath = $newLocation;
				$item->moved = true;
			} catch (Exception $error) {
				return $this->catchError($error);
			}
		}
		return true;
	}

	public
	function uploadAction()
	{
		$file = $_FILES["file"];
		$fileName = $file["name"];
		$fileExtension = pathinfo($fileName, PATHINFO_EXTENSION);
		$fileOnlyName = pathinfo($fileName, PATHINFO_FILENAME);
		$newFileName = $fileOnlyName . '--' . uniqid() . mt_rand(1, 1000) . '.' . $fileExtension;
		$directory = $_SERVER["DOCUMENT_ROOT"] . DIRECTORY_SEPARATOR . CARUSEL_FILES . DIRECTORY_SEPARATOR . "_tmp";
		$filePath = $directory . DIRECTORY_SEPARATOR . $newFileName;
		try {
			if (!file_exists($directory)) mkdir($directory, 0777, true);;
			$result = move_uploaded_file($file["tmp_name"], $filePath);
			return array("status" => $result, "data" => array("tmpPath" => $filePath, "numeFisier" => $fileName, "uploaded" => $result));
		} catch (Exception $error) {
			return $this->catchError($error);
		}
	}

}
