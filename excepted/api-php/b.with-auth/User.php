<?php
include_once $_SERVER["DOCUMENT_ROOT"] . "/api/base.model.php";

class UserItem extends ModelItem
{
	public $id;
	public $email;
	public $nume;
	public $prenume;
	public $esteActiv;
	public $esteAdmin;
	public $numeComplet;
	public $numeCompletInvariant;
}

class User extends BaseModel
{
	public $tableName = "users";
	public $modelItem = "UserItem";

	public function getUserByEmailAndPassword($email, $password)
	{
		$cmd = 'SELECT a.* FROM `' . $this->tableName . '` a ';
		$cmd .= "LEFT JOIN `users-pw` b on b.userId = a.id ";
		$cmd .= "WHERE a.email = '{$this->db->escape($email)}' AND b.password = '{$this->db->escape($password)}'";
		$queryResult = $this->db->query($cmd);
		$response = array();
		$response["data"] = $queryResult->rows;
		$response["status"] = true;
		return $response;
	}

	public function savePassword($resetLink, $password)
	{
		$userData = $this->getItemAction(array("resetLink" => $resetLink));
		if (!$userData["status"]) return $userData;
		if (count($userData["data"]) == 0) {
			$userData["status"] = false;
			return $userData;
		}
		try {
			$user = $userData["data"];
			$user["parola"] = $password;
			$cmd = "DELETE FROM `users-pw` WHERE userId={$this->db->escape($user["id"])}";
			$queryResult = $this->db->query($cmd);
			$cmd = "INSERT INTO `users-pw` SET userId={$this->db->escape($user["id"])}, password='{$this->db->escape($password)}'";
			$queryResult = $queryResult && $this->db->query($cmd);
			$cmd = "UPDATE `users` SET resetLink='' WHERE id = {$this->db->escape($user["id"])}";
			$queryResult = $queryResult && $this->db->query($cmd);

			$response = array();
			$response["data"] = $user;
			$response["status"] = $queryResult;
			return $response;
		} catch (Exception $error) {
			return $this->rollback("save-password");
		}

	}

	public function validate(&$data = null)
	{
		$itemName = "Utilizator";
		$item = $this->getDataItem($data);
		if (!isset($item->email)) {
			$exception = new Exception("Email $itemName  este obligatoriu");
			$exception->field = "email";
			throw $exception;
		}
		if (!isset($item->nume)) {
			$exception = new Exception("Nume $itemName  este obligatoriu");
			$exception->field = "nume";
			throw $exception;
		}
		if (!isset($item->prenume)) {
			$exception = new Exception("Prenume $itemName  este obligatoriu");
			$exception->field = "prenume";
			throw $exception;
		}
		return true;
	}

}
