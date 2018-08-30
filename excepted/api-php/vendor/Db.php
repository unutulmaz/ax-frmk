<?php
class DB {
	private $driver;
	private $level=0;

	public function __construct($driver, $hostname, $username, $password, $database) {
		$file = DIR_DATABASE . $driver . '.php';

		if (file_exists($file)) {
			require_once($file);

			$class = 'DB' . $driver;

			$this->driver = new $class($hostname, $username, $password, $database);
		} else {
			exit('Error: Could not load database driver type ' . $driver . '!');
		}
	}

	public function query($sql) {
		return $this->driver->query($sql);
	}

	public function escape($value) {
		return $this->driver->escape($value);
	}

	public function countAffected() {
		return $this->driver->countAffected();
	}

	public function getLastId() {
		return $this->driver->getLastId();
	}
   public function begin_transaction(){
	   $this->level++;
	   if ($this->level>1) return;
      return $this->driver->begin_transaction();
   }
   public function commit(){
      $this->level--;
      if ($this->level>1) return;
      return $this->driver->commit();
   }
   public function rollback(){
      return $this->driver->rollback();
   }
}
?>