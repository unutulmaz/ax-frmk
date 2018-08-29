<?php
abstract class Report {
	protected $registry;
	public $reportName;
	public $tableKey;
	protected $gridColumns;
	protected $filterFields;
	public $documentReady = array();
	public $gridScriptLines = array();
	public $token;
	public $baseUrl;

	public function __construct($registry, $tableName = null, $tableKey = null) {
		$this->registry = $registry;
		$this->tableName = DB_PREFIX . $tableName;
		$this->tableKey = $tableKey;
		$this->setGridScriptLines();
	}

	public function __get($key) {
		return $this->registry->get($key);
	}

	public function __set($key, $value) {
		$this->registry->set($key, $value);
	}
	public function getModel($file){
		$class = "model_" . str_replace( "/", "_", $file);
		if (!class_exists($class)) $this->load->model($file );
		return $this->registry->get($class);
	}
	public function setGridScriptLines(){}
	public function validateFilterData($formData){
		$errors=array(); 
		$fields = $this->filterFields;
		foreach ($fields as $field)
		{
			if (isset($field["required"]) && $field["required"] == "true"){
				$fieldName = $field["name"];
				$value = isset ($formData[$fieldName]) ? $formData[$fieldName]: null;
				if (empty($value)) $errors[$fieldName][] = "Este necesar sa completati campul!";
			}
		}
		return $errors;
	}
	public function getGridColumns(){
		return $this->gridColumns;
	}
	public function getFilterFields(){
		return $this->filterFields;
	}
	public function buildLimit($data=array()){
		$sql = '';
		if (isset($data['start']) || isset($data['limit'])) {
			if ($data['start'] < 0) {
				$data['start'] = 0;
			}

			if ($data['limit'] < 1) {
				$data['limit'] = 20;
			}

			$sql = " LIMIT " . (int)$data['start'] . "," . (int)$data['limit'] . ' ';
		}
		return $sql;
	}

	public function getList($data = array(), &$nrRecords=0) {
		$sql = "SELECT DISTINCT * FROM " . $this->tableName ;
		$sql .= $this->buildWhere($data);
		$sql .= $this->buildOrder($data);
		$nrRecords = $this->db->query($sql)->num_rows;
		$sql .= $this->buildLimit($data);

		$query = $this->db->query($sql);
		return $query->rows;
	}
	public function getListCount($data = array()) {
		$sql = "SELECT COUNT(*) AS total FROM " . $this->tableName;

		$sql .= $this->buildWhere($data);
		$sql .= $this->buildOrder($data);
		$query = $this->db->query($sql);

		return $query->row['total'];
	}
	protected function buildOrder($data){
		$order = "";
		if (isset($data['sort'])) {
			$order = " ORDER BY " . $data['sort'];
			$order .= isset($data['order'])? " " . $data['order']: "";
		}
		return $order;
	}
	protected function buildWhere($data){
		$structure = $this->getTableStructure();
		$where = "";
		foreach ($structure as $field)
		{
			$fieldName = $field["FieldCaption"];
			$key = "filter_" . $fieldName;
			$line = "";
			if (isset($data[$key])) {
				$fieldType = $field["ValueType"];
				$value = $data[$key];
				switch ($fieldType){
					case "date":
					case "datetime":
					case "text":
					case "varchar":
					case "char":
						$line = sprintf( "%s LIKE '\%%s\%'", $fieldName, $this->db->escape($value));
						break;
					case "tinyint":
					case "int":
						$line = sprintf( "%s = %s", $fieldName , (int)$value);
						break;
					default:
						echo "unkown data type: " . $fieldType . "<br/>";
						$line = sprintf( "%s = %s", $fieldName , $value);
						break;
				}
			}
			$where .= (empty($where)? "": (empty($line)? "": " AND ")) . $line;
		}
		$where = (!empty($where)? " WHERE " . $where : "") ;
		return $where;
	}
	public function getText($element){
		return $this->language->get($element);
	}
	public function getSqlRows($sql){
		$query = $this->db->query($sql);
		return $query->rows;
	}
	// html helpers
	public function buildFormTableHtml($data, $formReadonly = false){
		$html = "<table class='form'>";
		$fields = $this->filterFields;
		foreach ($fields  as $field)
		{
			$fieldName = $field['name'];
			$width = isset( $field['width']) ? $field['width']: "" ;
			$fieldValue = isset( $data[$fieldName]) ? $data[$fieldName]: "";
			$fieldReadOnly = isset( $field["readonly"]) && $field["readonly"] == "true";
			$label = isset( $field["title"])? $field["title"]: $field["name"];
			if (isset($field["required"]) && $field["required"]) $requiredHtml = '<span class="required">*</span>';
			else $requiredHtml  = '';
				$controlName = $this->getHtmlControlName($fieldName, "default");
			$controlHtml = $this->getCustomControl( $fieldName, array("value" => $fieldValue, "width" => $width), $controlName);
			if (!$controlHtml) $controlHtml = $this->getFormFieldDefaultControl($fieldName, $fieldValue, $width, $formReadonly || $fieldReadOnly);
			$errorHtml = isset( $data['errors'][$fieldName]) ? sprintf( '<span class="error">%s</span>', implode($data['errors'][$fieldName]),"<br/>"): '';
			$display = $this->tableKey == $fieldName ? "style='display:none'": "";
			$html .= sprintf('<tr %s><td>%s%s</td><td>%s%s</td></tr>', $display , $label, $requiredHtml, $controlHtml, $errorHtml);
		}
		$html .= '</table>';
		//$this->documentReady[] = sprintf( '$(".hasDatepicker").datepicker({ dateFormat: "yy-mm-dd" });');

		return $html;
	}
	public function buildHeaderRowHtml($data){
		$html = '<thead><tr>';
		
		foreach( $this->gridColumns as $field ){
			$title = $field['title'];
			if (is_array($title)){
			}
			$html .= sprintf('<td class="center" >%s</td>', $title);
		}
		$html .= "</tr></thead>";
		return $html;
	}
	public function buildDataRowsHtml($items){
		$html = '';
		foreach ($items as $item)
		{
			$html .= '<tr>';

			foreach($this->gridColumns as $field ){
				$fieldName = $field['name'];
				$fieldHtml = (isset($field['fieldHtml'])? $field['fieldHtml']: null);
				if (!$fieldHtml ) $fieldHtml = $item[$fieldName];
				$html .= sprintf( '<td class="%s" >%s</td>', $field['align'], $fieldHtml);
			}
			$html .= '</tr>';
		}
		return $html;
	}
	public function getHtmlControlName($fieldName, $type){
		switch ($type){ 
			case "grid":
				$name = sprintf( '%s[controlRowIndex][%s]', $this->tableName, $fieldName);
				break;
			default :
				$name = sprintf( '%s', $fieldName);
				break;
		}
		return $name;
		
	}
	private function findFieldStructure($fieldName){
		$structure = $this->filterFields;
		$fieldNames = array_column($structure, "name");
		$fieldName = strtolower($fieldName);
		$index = array_search($fieldName, $fieldNames);
		if ($index == false && $index != 0) return array();
		return $structure[$index];
	}
	public function findFieldIndex($fieldName){
		$fieldNames = array_column($this->fields, "name");
		$index = array_search($fieldName, $fieldNames);
		return $index;
	}
	public function getFieldAttribute($fieldName, $attribute){
		$fieldNames = array_column($this->fields, "name");
		$index = array_search($fieldName, $fieldNames);
		if (isset($this->fields[$index][$attribute])) return $this->fields[$index][$attribute];
		return null;
	}
	public function getGridFieldDefaultControl($fieldName, $parentName, $value, $gridReadonly, $fieldReadonly){
		$field = $this->findFieldStructure($fieldName);
		$fieldControlName = $this->getHtmlControlName( $fieldName, "grid", $parentName);
			$html = sprintf('<span fieldName="%s">%s</span>', $fieldName, $value);
			return $html;
		//$readonly= $readonly ? $readonly: $this->getFieldAttribute($fieldName, "readonly");
		//if ($readonly) $readonly = 'readonly="readonly"';
		//$fieldType = $field["ValueType"];
		/*switch ($fieldType){
			case "date":
				$html = sprintf( '<input type="date" name="%s" fieldName="%s" value ="%s" class="hasDatepicker" %s />',$fieldControlName, $fieldName, $value, $readonly);
				break;
			case "datetime":
				$html = sprintf( '<input type="datetime" name="%s" fieldName="%s" value ="%s" %s />',$fieldControlName, $fieldName, $value, $readonly);
				break;
			case "text":
			case "varchar":
			case "char":
				$html = sprintf( '<input type="text" name ="%s" fieldName="%s"  value ="%s" %s />', $fieldControlName, $fieldName, $value, $readonly );
				break;
			case "decimal":
			case "int":
				$html = sprintf( '<input type="number" name = "%s" fieldName="%s"  style="text-align:right" value ="%s"  %s/>', $fieldControlName, $fieldName, $value, $readonly );
				break;
			default:
				echo "fieldname: " . $fieldName ;
				$html = sprintf( '<input type="text" name = "%s" fieldName="%s"  value="%" %s />', $fieldControlName, $fieldName , 'unknown datatype: '. $fieldType, $readonly);
				break;
		}

		return $html;*/
	}
	public function getDefaultValues(){
		$fields = $this->filterFields;
		$dataItem = [];
		if (isset($this->tableKey)) $dataItem[$this->tableKey] = 0;
		foreach ($fields as $field)
		{
			$fieldName = $field["name"];
			$fieldType = $field["ValueType"];
			switch ($fieldType){
				case "date":
					$dataItem[$fieldName] = date('Y-m-d');
					break;
				case "datetime":
					$dataItem[$fieldName] = date('Y-m-d H:i');
					break;
				case "text":
				case "varchar":
				case "char":
					$dataItem[$fieldName] = '';
					break;
				case "tinyint":
					$dataItem[$fieldName] = 0;
					break;
				case "decimal":
				case "int":
					$dataItem[$fieldName] = 0;
					break;
				default:
					$dataItem[$fieldName] = 'unknown data type:'. $fieldType ;
					break;
			}
			$specificValue = $this->getDefaultValue($fieldName);
			if (!is_null($specificValue)) $dataItem[$fieldName] = $specificValue;
		}
		return $dataItem;
	}
	public function getDefaultValue($fieldName){
		return null;
	}
	public function getFormFieldDefaultControl($fieldName, $value, $width, $readonly){
		$field = $this->findFieldStructure($fieldName);
		$fieldType = $field["ValueType"];
		$htmlControlName = $this->getHtmlControlName( $fieldName, "form");
		if ($width) $width = "width:" . $width;
		if ($readonly) $readonly = 'readonly="readonly"';
		switch ($fieldType){
			case "date":
				$html = sprintf( '<input type="date" name = "%s" fieldName ="%s" value ="%s" style="%s" class="hasDatepicker" %s />', $htmlControlName, $fieldName, $value, $width, $readonly);
				break;
			case "datetime":
				$html = sprintf( '<input type="datetime" name="%s" fieldName ="%s" value ="%s" %s />',$htmlControlName, $fieldName, $value, $readonly);
				break;
			case "text":
			case "varchar":
			case "char":
				$html = sprintf( '<input type="text" name = "%s" fieldName ="%s" value="%s" style="%s" %s />', $htmlControlName,$fieldName, $value, $width, $readonly);
				break;
			case "tinyint":
				if ($readonly) $readonly = 'onclick="return false"';
				$html = sprintf( '<input type="hidden" name ="%s" fieldName ="%s" value ="%s" />', $htmlControlName,  $fieldName, "0");
				$html .= sprintf( '<input type="checkbox" name ="%s" fieldName ="%s" value ="%s" %s %s />', $htmlControlName, $fieldName, "1", $value? "checked": "", $readonly);
				break;
			case "decimal":
			case "int":
				$html = sprintf( '<input type="number" name ="%s" fieldName ="%s" value ="%s" style="%s" %s />', $htmlControlName, $fieldName, $value, "text-align:right;". $width, $readonly);
				break;
			default:
				$value = 'value="unknown data type:'. $fieldType . '"';
				$html = sprintf( '<input type="text" name ="%s" %s>', $htmlControlName, $fieldName, $value);
				break;
		}

		return $html;
	}
	public function getGridToolbar($readonly){
		$html = $this->tableTitle == ""? "": sprintf('<a class="button">%s</a>', $this->tableTitle);
		if (count($this->gridToobarActions) == 0 || $readonly) return $html;
		$html = sprintf( '<div class="buttons">%s%s</div>', $html, implode($this->gridToobarActions));
		return $html;
	}
}
