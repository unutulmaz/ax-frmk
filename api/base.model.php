<?php
include_once "base.controller.php";

class ModelItem
{
	public function __construct($item)
	{
		foreach ($this as $key => $value) {
			$this->$key = isset($item->$key) ? $item->$key : null;
		}
	}
}

class BaseModel extends BaseController
{
	public $item;
	public $modelItem;
	public $tableName;
	public $tableKey = "id";
	public $db;
	public $postData;
	public $structure;
	public $childrenItems = null;
	public $children = null;
	public $validateOnWrite = true;

	public function __construct(DB $db, $postData = "{}")
	{
		$this->db = $db;
		if (isset($postData)) $this->postData = json_decode($postData, false);
		if (isset($this->postData) && isset($this->postData->item)) $this->item = new $this->modelItem($this->postData->item);
	}

	public function action($action)
	{
		$action .= "Action";
		return $this->$action();
	}

	public function validate(&$data = null)
	{
		return true;
	}

	public function getDataItem($data = null)
	{
		return $item = isset($data) ? json_decode(json_encode($data)) : $this->item;
	}

	public function getTableStructure()
	{
		if (!$this->structure) {
			$sql = sprintf("
					SELECT
						lower( Column_name) AS FieldName,
						Column_name AS FieldCaption,
						Data_type AS ValueType,
						Extra AS Extra,
						if( isnull( Character_Maximum_Length),Numeric_Precision, Character_Maximum_Length) AS Length,
						if( isnull(Numeric_Scale), 000, Numeric_Scale) AS DecimalPosition,
						IS_NULLABLE
					FROM information_schema.COLUMNS
					WHERE Table_Schema = '%s'
						AND LOWER(Table_Name) = '%s'", DB_DATABASE, $this->tableName);
			$query = $this->db->query($sql);

			$this->structure = $query->rows;
		}
		return $this->structure;
	}

	public function sqlBuildFieldsList($data = null) //, $fields)
	{
		$list = '';
		if (is_null($data)) $item = $this->item;
		else $item = json_decode(json_encode($data), FALSE);
		if (!$item) throw new Exception("No data Item provided, use item as holder in postData!");
		foreach ($item as $key => $value) {
			if ($key == $this->tableKey) continue;
			$line = $this->getFieldValue($key, $value);
			if ($line) $list .= ($list == '' ? '' : ", ") . $line;
		}
		return $list;

	}

	protected function sqlBuildOrder($data)
	{
		$order = "";
		if (isset($data)) {
			$order = " ORDER BY ";
			$cnt = 0;
			foreach ($data as $key => $value) {
				$order .= ($cnt > 0 ? "," : "") . $key . " " . $value . " ";
				$cnt++;
			}
		}
		return $order;
	}

	private function findFieldStructure($fieldName)
	{
		$structure = $this->getTableStructure();
		$fieldNames = array_column1($structure, "FieldName");
		$fieldParts = explode(".", $fieldName);
		if (count($fieldParts) > 1) $fieldName = $fieldParts[1];
		$fieldName = strtolower($fieldName);
		$index = array_search($fieldName, $fieldNames);
		if ($index == false && $index != 0) return array();
		return $structure[$index];
	}

	protected function getFilterSqlForField($fieldName, $value, $operator)
	{
		return "";
	}

	protected function sqlBuildWhere($data)
	{
		//echo 'buildWhere';

		$where = "";
		foreach ($data as $fieldName => $value) {
			if (is_array($value)) {
				$fieldName = $value["field"];
				$field = $this->findFieldStructure($fieldName);
				$fieldType = $field["ValueType"];
				$operator = isset($value["operator"]) ? $value["operator"] : "=";
				$value = $value["value"];
				$line = $this->getFilterSqlForField($fieldName, $value, $operator);
				if (!$line) {
					switch ($fieldType) {
						case "date":
						case "datetime":
							$line = sprintf("Date_Format(`%s`, '%s') " . $operator . " '%s'", $fieldName, "%Y-%m-%d", $value);
							break;
						case "text":
						case "varchar":
						case "char":
							$line = $operator == "LIKE" ? sprintf("%s LIKE '%s'", $fieldName, '%' . $this->db->escape($value) . '%') : sprintf("%s " . $operator . " '%s'", $fieldName, $this->db->escape($value));
							break;
						case "real":
						case "double":
						case "decimal":
						case "float":
							$line = sprintf("%s " . $operator . " %s", $fieldName, (float)$value);
							break;
						case "smallint":
						case "tinyint":
						case "bigint":
						case "mediumint":
						case "int":
							$line = sprintf("%s " . $operator . " %s", $fieldName, (int)$value);
							break;
						default:
							throw new Exception("unkown data type: " . $fieldType . "<br/>");
							$line = sprintf("%s " . $operator . " %s", $fieldName, $value);
							break;
					}
				}

			} else {
				$field = $this->findFieldStructure($fieldName);
				$fieldType = $field["ValueType"];
				$line = $this->getFilterSqlForField($fieldName, $value, "=");
				if (!$line) {
					switch ($fieldType) {
						case "date":
						case "datetime":
							$line = sprintf("Date_Format(`%s`, '%s') = '%s'", $fieldName, "%Y-%m-%d", $value);
							break;
						case "text":
						case "varchar":
						case "char":
							$line = sprintf("%s = '%s'", $fieldName, $this->db->escape($value));
							break;
						case "real":
						case "double":
						case "decimal":
						case "float":
							$line = sprintf("%s = %s", $fieldName, (float)$value);
							break;
						case "smallint":
						case "tinyint":
						case "bigint":
						case "mediumint":
						case "int":
							$line = sprintf("%s = %s", $fieldName, (int)$value);
							break;
						default:
							throw new Exception("unkown data type: " . $fieldType . "<br/>");
							$line = sprintf("%s = %s", $fieldName, $value);
							break;
					}
				}
			}
			$where .= (empty($where) ? "" : (empty($line) ? "" : " AND ")) . $line;
		}
		$where = (!empty($where) ? " WHERE " . $where : "");
		return $where;
	}

	private function getFieldValue($key, $value)
	{
		$structure = $this->getTableStructure();
		//print_r($structure); die;
		$index = array_search(strtolower($key), array_column1($structure, 'FieldName'));
		if (!$index) return "";
		$field = $structure[$index];
		$fieldType = $field["ValueType"];
		$fieldNullable = $field["IS_NULLABLE"];
		switch ($fieldType) {
			case "date":
			case "datetime":
				if (is_null($value) && $fieldNullable == 'YES') {
					$line = sprintf("`%s` = NULL", $key);
				} else {
					$val = $this->db->escape($value);
					$val = $val == '' ? null : "'" . $val . "'";
					$line = sprintf("`%s` = %s", $key, $val);
				}
				break;
			case "text":
			case "tinytext":
			case "mediumtext":
			case "longtext":
			case "varchar":
			case "char":
				if (is_null($value) && $fieldNullable == 'YES') {
					$line = sprintf("`%s` = NULL", $key);
				} else {
					$line = sprintf("`%s` = '%s'", $key, $this->db->escape($value));
				}
				break;
			case "real":
			case "double":
			case "decimal":
			case "float":
				if (is_null($value)) $line = sprintf("%s = 0", $key);
				else $line = sprintf("`%s` = %s", $key, $this->db->escape($value));
				break;
			case "smallint":
			case "tinyint":
			case "bigint":
			case "mediumint":
			case "int":
				if (is_null($value) && $fieldNullable == 'YES') {
					$line = sprintf("`%s` = NULL", $key);
				} else {
					if (is_null($value)) $line = sprintf("%s = 0", $key);
					else $line = sprintf("`%s` = %s", $key, (int)$value);
				}
				break;

			default:
				if (!is_null($value)) {
					throw new Exception("base.model.getFieldValue: unknown data type: " . $fieldType . "<br/>");
					$line = sprintf("`%s` = %", $key, $value);
				} else $line = "";
				break;
		}
		return $line;
	}

	public function sqlGetItem($id)
	{
		$tableKey = 'a.' . $this->tableKey;
		$cmd = $this->sqlBuildGetAllItems(array($tableKey => $id));
		return $cmd;
	}


	public function sqlBuildGetAllItems($where = null, $order = null, $limit=null)
	{
		$cmd = 'SELECT a.* FROM `' . $this->tableName . '` a ';
		if (isset($where)) $cmd .= $this->sqlBuildWhere($where);
		if (isset($order)) $cmd .= $this->sqlBuildOrder($order);
		if (isset($limit)) $cmd .= " limit " . $limit;

		return $cmd;
	}

	public function sqlBuildGetItem($where = null, $order = null)
	{
		return $this->sqlBuildGetAllItems($where,$order);
	}
	public function sqlBuildDeleteAll($where = null)
	{
		$cmd = 'DELETE FROM `' . $this->tableName . '` ';
		if (isset($where)) $cmd .= $this->sqlBuildWhere($where);
		return $cmd;
	}

	public function sqlBuildDeleteItem($id)
	{
		$cmd = $this->sqlBuildDeleteAll();
		$cmd .= $this->sqlBuildWhere(array($this->tableKey => $id));
		return $cmd;
	}

	public function sqlBuildDeleteByForeignKey($id)
	{
		$cmd = $this->sqlBuildDeleteAll();
		$cmd .= $this->sqlBuildWhere(array($this->foreignKey => $id));
		return $cmd;
	}

	public function getItemQuery($id)
	{
		$queryResult = $this->db->query($this->sqlGetItem($id));
		return $queryResult->num_rows == 1 ? $queryResult->row : [];
	}

	public function sqlBuildInsert($data = null)
	{
		$cmd = 'INSERT into `' . $this->tableName . '` SET ' . $this->sqlBuildFieldsList($data);
		return $cmd;
	}

	public function sqlBuildUpdate($data = null)
	{
		$cmd = 'UPDATE `' . $this->tableName . '` SET ' . $this->sqlBuildFieldsList($data);
		$tableKey = $this->tableKey;
		$id = is_null($data) ? $this->item->$tableKey : $data[$tableKey];
		$cmd .= $this->sqlBuildWhere(array($tableKey => $id));
		return $cmd;
	}

	public function catchError(Exception $error)
	{
		$response = array();
		$field = isset($error->field) ? $error->field : "";
		$response["errors"] = [$field => [$error->getMessage()]];
		$response["status"] = false;
		return $response;
	}

	public function createErrorResponse($message)
	{
		$response = array();
		$response["errors"] = ["" => [$message]];
		$response["status"] = false;
		return $response;
	}

	public function getItemAction($where = null)
	{
		try {
			$id = isset($_REQUEST['id']) ? $_REQUEST['id'] : -1;
			$response = array();
			$cmd = $this->sqlBuildGetItem();
			$tableKey = "a." . $this->tableKey;
			if (isset($where)) $cmd .= $this->sqlBuildWhere($where);
			else $cmd .= $this->sqlBuildWhere(array($tableKey => $id));
			$queryResult = $this->db->query($cmd);
			$response["data"] = $queryResult->num_rows == 1 ? $queryResult->row : [];;
			$response["status"] = true;
			return $response;
		} catch (Exception  $error) {
			return $this->catchError($error);
		}

	}

	public function getListAction($where = null, $order = null, $limit = null)
	{
		try {
			$queryResult = $this->db->query($this->sqlBuildGetAllItems($where, $order, $limit));
			$response = array();
			$response["data"] = $queryResult->rows;
			$response["status"] = true;
			return $response;
		} catch (Exception  $error) {
			return $this->catchError($error);
		}

	}

	public function newAction()
	{
		$response = array();
		$item = array("id" => 0);
		$response["data"] = $item;
		$response["status"] = true;
		return $response;
	}

	public function createAction($fromParent = false, $data = null)
	{
		try {
			$this->db->begin_transaction();

			$response = array();
			$response["status"] = false;
			if (!$fromParent && !$this->validate($data)) {
				$response["errors"] = array("children" => $this->childrenErrors);
				return $response;
			} else $this->validate($data);
			$queryResult = $this->db->query($this->sqlBuildInsert($data));
			if (is_null($data)) $item = $this->item;
			else $item = json_decode(json_encode($data), FALSE);
			$item->id = $this->db->getLastId();
			$response["status"] = $queryResult;
			$children = $this->childrenInsert($item->id);
			if (!$children["status"]) return $children;
			if (method_exists($this, "createActionCallback")) {
				$response = $this->createActionCallback($response, $this->postData);
				if (!$response["status"]) return $this->rollback("create", null, $response);;
			}
			$response["data"] = $this->getItemQuery($item->id);
			$this->db->commit();
			return $response;
		} catch (Exception  $error) {
			$this->db->rollback();
			return $this->catchError($error);
		}
	}

	public function updateAction($fromParent = false, $data = null)
	{
		try {
			$this->db->begin_transaction();
			$response = array();
			$response["status"] = false;
			if (!$fromParent) {
				if (!$this->validate($data)) {
					$response["errors"] = array("children" => $this->childrenErrors);
					return $response;
				}
			} else $this->validate($data);

			if (is_null($data)) $item = $this->item;
			else $item = json_decode(json_encode($data), FALSE);
			$deleted = $this->childrenDelete($item->id);
			if (!$deleted["status"]) return $deleted;
			$queryResult = $this->db->query($this->sqlBuildUpdate($data));
			$response["status"] = $queryResult;
			$children = $this->childrenInsert($item->id);
			if (!$children["status"]) return $children;
			if (method_exists($this, "updateActionCallback")) {
				$response = $this->updateActionCallback($response, $this->postData);
				if (!$response["status"]) return $this->rollback("update", null, $response);;
			}
			$response["data"] = $this->getItemQuery($item->id);
			$this->db->commit();
			return $response;
		} catch (Exception  $error) {
			$this->db->rollback();
			return $this->catchError($error);
		}
	}

	public function deleteAction($id = null, $fromParent = false)
	{
		try {
			$this->db->begin_transaction();
			$id = isset($id) ? $id : (isset($_REQUEST['id']) ? $_REQUEST['id'] : -1);
			$response = array();
			$deleted = $this->childrenDelete($id);
			if (!$deleted["status"]) return $deleted;

			$response["data"] = $this->getItemQuery($id);
			$response["status"] = $this->db->query($this->sqlBuildDeleteItem($id));
			if (method_exists($this, "deleteActionCallback")) {
				$response = $this->deleteActionCallback($response, $this->postData);
				if (!$response["status"]) return $this->rollback("delete", null, $response);
			}
			$this->db->commit();
			return $response;
		} catch (Exception  $error) {
			return $this->db->rollback("delete", $error);
		}
	}

	public function rollback($action, $exception = null, $response = null)
	{
		$this->db->rollback();
		if (method_exists($this, "rollbackCallback")) {
			$this->rollbackCallback($action, $exception, $response);
		}
		if (isset($exception)) return $this->catchError($exception);
		else if (isset($response)) return $response;
	}

	public function childrenInsert($id)
	{
		$response["status"] = true;
		if (!isset($this->childrenObjects)) return $response;
		foreach ($this->childrenObjects as $className => $data) {
			foreach ($data as $classObj) {
				$classObj->item->{$classObj->foreignKey} = $id;
				$response = $classObj->createAction(true);
				if (!$response["status"]) return $response;
			}
		}
		return $response;
	}

	public function setChildrenItems($childrenClass)
	{
		$postDataName = $this->children[$childrenClass]["postData"];
		$items = $this->postData->extraArgs->children->$postDataName;
		if (!isset($this->childrenItems)) $this->childrenItems = array();
		$this->childrenItems[$childrenClass] = $items;
	}

	public function childrenDelete($id)
	{
		$response["status"] = true;
		if (!$this->children) return $response;
		foreach ($this->children as $class => $child) {
			$classObj = new $class($this->db, json_encode(array()));
			$response = $classObj->getListAction(array($classObj->foreignKey => $id));
			if (!$response["status"]) return $response;
			$items = $response["data"];
			foreach ($items as $item) {
				$itemClassObj = new $class($this->db, json_encode(array("item" => $item)));
				$response = $itemClassObj->deleteAction($item[$itemClassObj->tableKey], true);
				if (!$response["status"]) return $response;
			}
		}
		return $response;
	}

	public function childrenValidate()
	{
		if (!isset($this->children)) return true;
		foreach ($this->children as $key => $value) {
			$this->setChildrenItems($key);
		}

		$this->childrenErrors = null;
		$this->childrenObjects = [];
		$hasErrors = false;
		$errors = [];
		foreach ($this->childrenItems as $class => $data) {
			$childErrors = array();
			$childHasErrors = false;
			$this->childrenObjects[$class] = [];
			foreach ($data as $item) {
				$classObj = new $class($this->db, json_encode(array("item" => $item)));
				$classObj->item->{$classObj->foreignKey} = $this->item->{$this->tableKey};
				$classObj->errors = [];
				$this->childrenObjects[$class][] = $classObj;
				$errItem = !$classObj->validate();
				$childErrors[] = $classObj->errors;
				if ($errItem) $childHasErrors = true;
			}

			if ($childHasErrors) {
				$hasErrors = true;
				$errors[$this->children[$class]["postData"]] = $childErrors;
			}
		}
		if ($hasErrors) $this->childrenErrors = $errors;
		return !$hasErrors;
	}

}

function array_column1(array $input, $columnKey, $indexKey = null)
{
	$array = array();
	foreach ($input as $value) {
		if (!isset($value[$columnKey])) {
			trigger_error("Key \"$columnKey\" does not exist in array");
			return false;
		}
		if (is_null($indexKey)) {
			$array[] = $value[$columnKey];
		} else {
			if (!isset($value[$indexKey])) {
				trigger_error("Key \"$indexKey\" does not exist in array");
				return false;
			}
			if (!is_scalar($value[$indexKey])) {
				trigger_error("Key \"$indexKey\" does not contain scalar value");
				return false;
			}
			$array[$value[$indexKey]] = $value[$columnKey];
		}
	}
	return $array;
}