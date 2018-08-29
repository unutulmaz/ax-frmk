<?php
abstract class Model {
    protected $registry;
    public $tableName;
    public $tableKey;
    protected $structure;
    protected $fields;
    protected $gridColumns;
    protected $formFields;
    public $documentReady = array();
    public $gridScriptLines = array();
    public $gridToobarActions = array();
    public $children = array();
    public $parentRowData;
    public $hideChildrenOnInsert = false;
    public $parentKey;
    public $token;
    public $baseUrl;
    public $deletetype = 'U';
	protected $gen;
	protected $NameSingular;
	protected $NamePlural;
	protected $AddNeedsSave = false;

    public function __construct($registry, $tableName = null, $tableKey = null)
    {
        $this->registry = $registry;
        $this->tableName = DB_PREFIX . $tableName;
        $this->tableKey = $tableKey;
        $this->setGridScriptLines();
    }

    public function __get($key)
    {
        return $this->registry->get($key);
    }

    public function __set($key, $value)
    {
        $this->registry->set($key, $value);
    }

    public function getModel($file)
    {
        $class = "model_" . str_replace("/", "_", $file);
        if (!class_exists($class)) $this->load->model($file);
        return $this->registry->get($class);
    }

    public function getTomorow($date = null)
    {
        $date = is_null($date) ? date("Y-m-d") : $date;
        $tomorow = date("Y-m-d", strtotime($date . '+1 days'));
        return $tomorow;
    }

    public function setGridScriptLines()
    {
    }

    public function addChild($model, $linkField, $autoUpdate = true)
    {
        $this->load->model($model);
        $model = $this->getModel($model);
        $this->children[] = array(
            "model" => $model,
            "tableName" => $model->tableName,
            "autoUpdate" => $autoUpdate,
            "linkField" => $linkField);
    }

    public function getChildModel($tableName)
    {
        foreach ($this->children as $child) {
            if ($child["tableName"] == $tableName) return $child["model"];
        }
        return null;
    }

    public function validateRecordData($itemData, $parentData)
    {
		//print_r($itemData);
        $errors = array();
		//echo '<br/> --------------------------------fields= <br/>';
        $fields = $this->getFormFields();
		//print_r($fields);
		//echo '<br/> -------------------------------- <br/>';
        foreach ($fields as $field) {
            if (isset($field["required"]) && $field["required"] == true) {
                $fieldName = $field["name"];
                $value = isset ($itemData[$fieldName]) ? $itemData[$fieldName] : null;
				//echo $fieldName . ' = ' . $value . '<br/>';
                if (is_null($value) || trim($value) === '') {
					$errors[$fieldName][] = "Este necesar sa completati campul!";
					//print_r($errors[$fieldName]);
				}
            }
        }
        if (isset($itemData["children"])) {
            $parentData = $itemData;
            foreach ($this->children as $child) {
                $tableName = $child["tableName"];
				//echo '<br/>--> tableName = ' . $tableName . '<br/>';
                if (!isset ($itemData["children"][$tableName])) continue;
                $items = $itemData["children"][$tableName];
				//echo '<br/>items=<br/>';
				//	print_r($items);
				//echo '<br/>done<br/>';
                if (count($items) == 0) continue;
                $model = $this->getChildModel($tableName);
                foreach ($items as $item) {
					/*echo '<br/>item=<br/>';
					print_r($item);
					echo '<br/>doen item=+++<br/>';*/
                    if (isset($item['__deleted']) && $item['__deleted'] == "1") {
                        $errors["children"][$tableName][] = array();
                        continue;
                    } else {
						$errors["children"][$tableName][] = $model->validateRecordData($item, $parentData);
					}
                }
				//echo '<br/>$errors["children"]['.$tableName.'] =<br/>';
				//print_r($errors["children"][$tableName]);
            }
        }
        return $errors;
    }

    public function getGridColumns()
    {
        return $this->fields;
    }

    public function getFormFields()
    {
        return $this->fields;
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

    public function addRecord($item)
    {
		$item = $this->beforeAddRecord($item);
        try {
            $sql = "INSERT INTO " . $this->tableName . " SET " . $this->getFieldsList($item);		
		/*echo '<br/>insert -> ';
		print_r($item); //die;
		echo '<br/>';
		echo 'insert query = ' .$sql; 
		//die;*/
            $this->db->query($sql);
            $id = $this->db->getLastId();
            if (isset($item["children"])) {
                foreach ($this->children as $child) {
                    $tableName = $child["tableName"];
                    $linkField = $child["linkField"];
                    $autoUpdate = $child["autoUpdate"];
                    if (!$autoUpdate) continue;
                    $model = $this->getChildModel($tableName);
                    $model->updateChildrenItems($id, $linkField, $item["children"][$tableName]);
                }
            }
            return $id;
        } catch (Exception $e) {
            throw $e;
        } 
    }
    public function beforeAddRecord($data) //, $fields)
    {
		$data['date_added'] = date("Y-m-d H:i:s");
		$data['date_modified'] = date("Y-m-d H:i:s");
		return $data;
	}
	
	//pt posibilitate modificare date inainte de update
	//caz specific: only_pj checkbox in clienti.php, trebuie setat pe '0' daca nu este trimis din UI
    public function beforeUpdateRecord($key, $data) //, $fields)
    {
		//echo 'beforeUpdateRecord base'; die;
		$data['date_added'] = date("Y-m-d H:i:s");
		$data['date_modified'] = date("Y-m-d H:i:s");
		return $data;
	}
	
    public function saveRecord($keyValue, $item) //, $fields)
    {
		if ($keyValue == 0) 
			$this->addRecord($item);
		else {
			$this->updateRecord($keyValue, $item);
			//die;
		}
	}
	
    public function updateRecord($keyValue, $item) //, $fields)
    {
		$item = $this->beforeUpdateRecord($keyValue, $item);
		/*echo '<br/>update -> ';
		print_r($item); //die;
		echo '<br/>';*/
        try {
            $sql = "UPDATE " . $this->tableName . " SET ";
            $sql .= $this->getFieldsList($item); //, $fields);
            $sql .= " where " . $this->tableKey . " = " . $keyValue;
			/*echo 'update query = ' .$sql;//die;
			echo '<br/>';*/
            $this->db->query($sql);
            if (isset($item["children"])) {
                foreach ($this->children as $child) {
                    $tableName = $child["tableName"];
					//echo 'child $tableName = ' . $tableName. '<br/>';
                    $linkField = $child["linkField"];
                    $autoUpdate = $child["autoUpdate"];
                    if (!$autoUpdate) continue;
                    $model = $this->getChildModel($tableName);
                    $model->updateChildrenItems($keyValue, $linkField, $item["children"][$tableName]);
                }
            }
        } catch (Exception $e) {
            throw $e;
        }
        return true;
    }

    public function updateChildrenItems($keyValue, $linkField, $child_items)
    {
        try {
            foreach ($child_items as $row) {
                $deleted = $row['__deleted'];
                if (!isset($row[$this->tableKey])) throw new Exception("Campul " . $this->tableKey . " nu este continut in $row! Verificati!");
                $recordKey = (int)$row[$this->tableKey];
                if ($deleted == "1") {
                    if ($recordKey != 0) $this->deleteRecord($row[$this->tableKey]);
                } elseif ($recordKey == 0) {
                    $row[$linkField] = $keyValue;
                    $this->addRecord($row);
                } else $this->updateRecord($recordKey, $row);
            }
        } catch (Exception $e) {
            throw new Exception("Cannot update Children Items records in table " . $this->tableName . "\n" . $e->getMessage());
        }
    }

    public function deleteRecord($rowKey, $where = null)
    {
        try {
            if (isset($this->children)) {
                foreach ($this->children as $child) {
                    $tableName = $child["tableName"];
                    $linkField = $child["linkField"];
                    $model = $this->getChildModel($tableName);
                    $rows = $model->getList(array("filter_" . $linkField => $rowKey));
                    $response = true;
                    if (count($rows) > 0) {
                        foreach ($rows as $row) {
                            $id = $row[$model->tableKey];
                            $response = $model->deleteRecord($id);
                            if ($response) continue;
                        }
                    }
                    if (!$response) return false;
                }
            }

            if ($this->deletetype == 'D') {
                $sql = "DELETE FROM {$this->tableName}";
            } else {
                $sql = "UPDATE {$this->tableName} SET deleted = 1";
            }
            if ($rowKey) $where = " where " . $this->tableKey . " = " . (int)$rowKey;
            elseif ($where) $where = " where " . $where;
            else return false;
            $sql .= $where;
            $query = $this->db->query('Select ' . $this->tableKey . ' from ' . $this->tableName . $where);
            $rows = $query->rows;
            $this->db->query($sql);
            return $rows;
        } catch (Exception $e) {
            throw $e;
        }
    }

    public function getFieldsList($data) //, $fields)
    {
        $list = '';
        foreach ($data as $key => $value) {
            if ($key == $this->tableKey) continue;
            $line = $this->getFieldValue($key, $value);
            if ($line) $list .= ($list == '' ? '' : ", ") . $line;
        }
        return $list;

    }

    private function getFieldValue($key, $value)
    {
        $structure = $this->getTableStructure();
		//print_r($structure); die;
        $index = array_search(strtolower($key), array_column($structure, 'FieldName'));
        if (!$index) return "";
        $field = $structure[$index];
        $fieldType = $field["ValueType"];
        $fieldNullable = $field["IS_NULLABLE"];
        switch ($fieldType) {
            case "date":
            case "datetime":
				if (is_null($value) && $fieldNullable == 'YES') {
					$line = sprintf("`%s` = NULL", $key);
				}
				else {
					$val = $this->db->escape($value);
					$val = $val == '' ? "null" : "'".$val."'";
					$line = sprintf("`%s` = %s", $key, $val);
				}
                break;
            case "text":
            case "varchar":
            case "char":
				if (is_null($value) && $fieldNullable == 'YES') {
					$line = sprintf("`%s` = NULL", $key);
				}
				else {
					$line = sprintf("`%s` = '%s'", $key, $this->db->escape($value));
				}
                break;
            case "int":
            case "tinyint":
				if (is_null($value) && $fieldNullable == 'YES') {
					$line = sprintf("`%s` = NULL", $key);
				}
				else {
					if (is_null($value)) $line = sprintf("%s = 0", $key);
					else $line = sprintf("`%s` = %s", $key, (int)$value);
				}
                break;
            case "decimal":
                if (is_null($value)) $line = sprintf("%s = 0", $key);
                else $line = sprintf("`%s` = %s", $key, $value);
                break;
            default:
                echo "unkown data type: " . $fieldType . "<br/>";
                $line = sprintf("`%s` = %", $key, $value);
                break;
        }
        return $line;
    }

    private function getRecordKey($data)
    {
        return (int)$data[$this->tableKey];
    }

    public function getItemById($id)
    {
        $sql = "SELECT DISTINCT * FROM " . $this->tableName . " WHERE " . $this->tableKey . " = " . (int)$id;
		//echo '<br/>'.$sql.'<br/>';
        $query = $this->db->query($sql);
        return $query->row;
    }

    public function getList($data = array(), &$nrRecords = 0)
    {
        $sql = "SELECT DISTINCT * FROM " . $this->tableName;
        $sql .= $this->buildWhere($data);
        $sql .= $this->buildOrder($data);
        $nrRecords = $this->db->query($sql)->num_rows;
        $sql .= $this->buildLimit($data);
        $query = $this->db->query($sql);
		//echo '<br/>'.$sql;
        return $query->rows;
    }

    public function runSQL($sql)
    {
        //$nrRecords = $this->db->query($sql)->num_rows; //TODO: activare log mysql pt trace SQL-uri si verificare numar rulari 
        $query = $this->db->query($sql);
		$nrRecords = $query->num_rows;
		//echo 'runSQL='.$sql;//die;
        return $query->rows;
    }

    public function buildLimit($data = array())
    {
        $sql = '';
        if (isset($data['start']) || isset($data['limit'])) {
            if ($data['start'] < 0) {
                $data['start'] = 0;
            }

            if ($data['limit'] < 1) {
                $data['limit'] = 20;
            }

            $sql = " LIMIT " . (int)$data['start'] . "," . (int)$data['limit'];
        }
        return $sql;
    }

    public function getListCount($data = array())
    {
        $sql = "SELECT COUNT(*) AS total FROM " . $this->tableName;

        $sql .= $this->buildWhere($data);
        $sql .= $this->buildOrder($data);
        $query = $this->db->query($sql);

        return $query->row['total'];
    }

    protected function buildOrder($data)
    {
        $order = "";
        if (isset($data['sort'])) {
            $order = " ORDER BY " . $data['sort'];
            $order .= isset($data['order']) ? " " . $data['order'] : "";
        }
        return $order;
    }

    protected function getFilterSqlForField($fieldName, $value)
    {
        return "";
    }

    protected function buildWhere($data)
    {
		//echo 'buildWhere';
        $filtered = [];
        foreach ($data as $key => $value) {
            if (substr($key, 0, 7) != "filter_") continue;
			//echo $key;
            if (is_null($value)) continue;
            $filtered[$key] = $value;
        }

        $where = "";
        foreach ($filtered as $key => $value) {
            $fieldName = substr($key, 7);
            $field = $this->findFieldStructure($fieldName);
            $fieldType = $field["ValueType"];
            $line = $this->getFilterSqlForField($fieldName, $value);
            if (!$line) {
                switch ($fieldType) {
                    case "date":
                    case "datetime":
                        $line = sprintf("Date_Format(`%s`, '%s') = '%s'", $fieldName, "%Y-%m-%d", $value);
                        break;
                    case "text":
                    case "varchar":
                    case "char":
                        $line = sprintf("`%s` LIKE '%s'", $fieldName, '%' . $this->db->escape($value) . '%');
                        break;
                    case "tinyint":
                    case "int":
                        $line = sprintf("`%s` = %s", $fieldName, (int)$value);
                        break;
                    default:
                        echo "unkown data type: " . $fieldType . "<br/>";
                        $line = sprintf("%s = %s", $fieldName, $value);
                        break;
                }
            }
            $where .= (empty($where) ? "" : (empty($line) ? "" : " AND ")) . $line;
        }
        $where = (!empty($where) ? " WHERE " . $where : "");
        return $where;
    }

    public function getText($element)
    {
        return $this->language->get($element);
    }

    public function getSqlRows($sql)
    {
        $query = $this->db->query($sql);
        return $query->rows;
    }

    // html helpers
    public function tabHasError($tabIndex, $data)
    {
        $fields = $this->getFormFields();
        foreach ($fields as $field) {
            if (isset($field["tab"]) && ($field["tab"] - 1) != $tabIndex) continue;
            if (!isset($field["tab"]) && 1 != $tabIndex) continue;
            $fieldName = $field['name'];
            $hasError = isset($data['errors'][$fieldName]);
            $display = (isset($field["showInForm"]) ? $field["showInForm"] == true : false);
            if ($hasError && $display) return true;
        }
        return false;
    }

	public function getTabs() {
		return $this->tabs;
	}
	/*public function retrieveHTML($template){
		return $this->retrieveHTMLCallback($template);
	}*/
	
	public function BuildFormTable($all_on_page, $data, $formReadonly)
	{
		$html = "";
        $tabsNo = isset($this->tabs) ? count($this->tabs) : 0;
		$hasTabs = $tabsNo > 0;
        if (!$hasTabs) $tabsNo = 1;
        $fields = $this->getFormFields();
        for ($i = 0; $i < $tabsNo; $i++) {

            $html .= sprintf('<div id="%s" %s %s>', 
				"tab-vtab" . $i, 
				$hasTabs ? ('class="vtabs-content' . ($all_on_page ? '-page' : '') . '"') : '',
				$all_on_page ? 'style="display:block;float:left;"' : '');
            $hasError = $this->tabHasError($i, $data);
				$html .= '<div id="vtabs" class="vtabspage">';
				$tab = $this->tabs[$i];
				$html .= sprintf('<h2 %s>%s</h2>', $hasError ? 'class="error"' : '', $tab);
				$html .= "</div>";
            $html .= sprintf('<table class="%s" >', $all_on_page ? "page-form" : "form");
            foreach ($fields as $field) {
                if ($hasTabs > 0 && isset($field["tab"]) && ($field["tab"] - 1) != $i) continue; // TODO: sau daca e showInFormAsHidden == true
				if (!isset($field["tab"]) && $i > 0) continue; // field-urile fara tab se pun doar pe tab = 0 (primul tab)
                $fieldName = $field['name'];
                $width = isset($field['width']) ? $field['width'] : "";
                $fieldValue = isset($data[$fieldName]) ? $data[$fieldName] : "";
                $fieldReadOnly = isset($field["readonly"]) && $field["readonly"] == "true";
                $title = isset($field["title"]) ? $field["title"] : $fieldName;
                if (isset($field["required"]) && $field["required"]) 
					$requiredHtml = '<span class="required">*</span>';
                else 
					$requiredHtml = '';
				$controlName = $this->getHtmlControlName($fieldName, "default");
                $controlHtml = $this->getCustomControl($fieldName, 
					array("readonly" => $formReadonly || $fieldReadOnly, "value" => $fieldValue, "width" => $width, "data" => $data),
					$controlName);
                if (!$controlHtml) $controlHtml = $this->getFormFieldDefaultControl($fieldName, $fieldValue, $width, $formReadonly || $fieldReadOnly);
                $errorHtml = isset($data['errors'][$fieldName]) ? sprintf('<span class="error">%s</span>', implode($data['errors'][$fieldName]), "<br/>") : '';
                $hintHtml = isset($field['hint']) ? "<br><p class='hint'>{$field['hint']}</p>" : "";
                //$display = $this->tableKey == $fieldName && (isset($field["showInForm"])? $field["showInForm"]== false: false)? "style='display:none'": "";
				//field-urile hidden sunt puse doar o data pe tab = 1
				if ($i == 0 && isset($field['showInFormAsHidden']) && $field['showInFormAsHidden'] == 'true') { // daca nu e setata proprietatea showInFormAsHidden atunci se prezuma = false
					// ca sa nu apara duplicari -> cazul in care este afisat in footer-ul tabelului - nu tb sa mai existe si in form
					//$display = (isset($field['showInForm']) && $field['showInForm'] == 'true') ? '' : 'style="display:none"';
					$display = 'style="display:none"';
					$html .= sprintf('<tr %s><td>%s%s</td><td>%s%s%s</td></tr>', $display, $title, $requiredHtml, $controlHtml, $hintHtml, $errorHtml);
				}
				else {
					if (isset($field['showInForm']) && $field['showInForm'] == 'true') {
						$display = '';
						$html .= sprintf('<tr %s><td>%s%s</td><td>%s%s%s</td></tr>', $display, $title, $requiredHtml, $controlHtml, $hintHtml, $errorHtml);
					}
				}
            }
            $html .= '</table></div>';
        }
		return $html;
	}
	
    public function buildFormTableHtmlAllOnPage($data, $formReadonly)
    {
		$html = $this->BuildFormTable(true, $data, $formReadonly);
		$html .= '<div style="clear:both;"></div>';
            //$this->addGridScriptLines('$(".vtabs a").tabs();');
			
        $script = $this->getEditGridScript(0, 0, null);
        $html .= $script;
        $isPost = $data['isPost'];
		//print_r($data);
		$errors = isset($data['errors']) ? $data['errors'] : array();
		$childrenHtml = $this->buildFormChildren($data, $data, $errors, 0, $formReadonly, $isPost, $this->tableName);
		$html .= $childrenHtml;
        $this->documentReady[] = sprintf('$(".hasDatepicker").datepicker({ dateFormat: "yy-mm-dd" });');

        return $html;
    }
	
    public function buildFormChildren($data, $item, $errors, $index, $formReadonly, $isPost, $parentControlName)
    {
		$html = '';
        $tableKey = $this->tableKey;
        $idValue = isset($item[$tableKey]) ? $item[$tableKey] : 0;
        $showChildren = $this->hideChildrenOnInsert ? $idValue > 0 : true;
        if ($this->children and $showChildren) {
            foreach ($this->children as $child) {
                $model = $child["model"];
                $model->parentRowData = $data;
                $model->token = isset($data["token"]) ? $data["token"] : "not set in buildFormTable";
                $model->baseUrl = isset($data["baseUrl"]) ? $data["baseUrl"] : "not set in buildFormTable";
                $model->parentKey = $idValue;
                $linkField = $child["linkField"];
                $options = array("filter_" . $linkField => $idValue);
                $options['filter_deleted'] = 0;
				//echo '$isPost='.$isPost.'<br/>';
                if ($isPost) {
					$child_items = isset($item["children"]) && isset($item["children"][$model->tableName]) ? $item["children"][$model->tableName] : array();
				}
                else {
					//echo 'getList, $options= ';
					//print_r($options);
					//echo '--'.'<br/>';
					$child_items = $model->getList($options);
				}
                $item["tableKey"] = $model->tableKey;
				
				//print_r($errors);echo '<br/>';
				$child_items = $this->SetErrors($child_items, $errors, $model->tableName);
				//echo '<br/>child_items=<br/>';
				//print_r($child_items);echo '<br/>';
				//print_r($data);echo '<br/>';
		//debugUtils::callStack(debug_backtrace());
                $toolBar = $model->getGridToolbar($formReadonly, $parentControlName, $index, $data); //, $data["baseUrl"], $data["token"], $data);
					$headerHtml = $model->buildEditGridHeaderRowHtml($formReadonly);
						$options=["readOnly"=>$formReadonly, "items"=>$child_items, "data"=>$data];//2017.01.18 -- adaugare $data
						$p_errors = (isset($errors["children"][$model->tableName])) ? $errors["children"][$model->tableName] : array();
						//print_r($p_errors);echo '<br/>';
					$dataHtml = $model->buildEditGridDataRowsHtml($child_items, $formReadonly, $data, $p_errors, $idValue, $isPost, 
							$parentControlName);
					$footerHtml = $model->getCustomControl("grid_footer", $options, null);
                $script = $model->getEditGridScript(count($child_items), $index, $parentControlName);
				$tableId = $this->TableId($model->tableName, $index);
                $childHtml = sprintf('<table class="cl-list list" id="%s"><thead><tr>%s</tr></thead><tbody>%s</tbody>%s%s</table>', 
						$tableId, $headerHtml, $dataHtml, $footerHtml, $script);
                $html .= $toolBar . $childHtml;
            }
        }
        return $html;
	}
	protected function SetErrors($child_items, $errors, $tableName) {
		if (isset($errors["children"][$tableName])) {
			$childErrors = $errors["children"][$tableName];
			//print_r($childErrors);
			$indexRow = 0;
			foreach ($childErrors as $error) {
				$child_items[$indexRow]["__errors"] = $error;
				$indexRow++;
			}
		}
		return $child_items;
	}
    public function buildFormTableHtml($data, $formReadonly)
    {
		$html = $this->BuildFormTable(false, $data, $formReadonly);
        $script = $this->getEditGridScript(0, 0, null);
        $html .= $script;
        $isPost = $data['isPost'];
		//print_r($data);
		$errors = isset($data['errors']) ? $data['errors'] : array();
		$childrenHtml = $this->buildFormChildren($data, $data, $errors, 0, $formReadonly, $isPost, $this->tableName);
		$html .= $childrenHtml;
        $this->documentReady[] = sprintf('$(".hasDatepicker").datepicker({ dateFormat: "yy-mm-dd" });');

        return $html;
    }
	
	public function getCustomCollections()
	{
		$collections = array();
        $fields = $this->getFormFields();
		foreach ($fields as $field) {
			//print_r($field);
			if (isset($field['hasCustomControl']) && $field['hasCustomControl']) {
				$fieldName = $field['name'];
				$collection = $this->getCustomCollection($fieldName);
				$collections[$fieldName] = $collection;
			}
		}
		return $collections;
	}
	
	public function getItemAndChildrenItemsByParentId($parentId)
	{
		//$itemInfo = $this->getItemById($parentId); // nu e folosit pt moment
		
		$collections = $this->getCustomCollections();
				
		$childrenItems = array();
        if ($this->children) {
            foreach ($this->children as $child) {
				$items =  array();
                $model = $child["model"];
                $model->parentKey = $parentId;
                $linkField = $child["linkField"];
                $options = array("filter_" . $linkField => $parentId);
                $options['filter_deleted'] = 0;
				$items = $model->getList($options);
				$childCollections = $model->getCustomCollections();
				$collections = array_merge($collections, $childCollections);
                /*$data["tableKey"] = $model->tableKey;
                if (isset($data["errors"]["children"][$model->tableName])) {
                    $childErrors = $data["errors"]["children"][$model->tableName];
                    $indexRow = 0;
                    foreach ($childErrors as $error) {
                        $items[$indexRow]["__errors"] = $error;
                        $indexRow++;
                    }
                }*/
				$childrenItems[] = $items;
            }
        }
		$result = array('childrenItems' => $childrenItems, 'collections' => $collections);
		return $result;
	}
    public function buildColGroupHtml($columns)
    {
        $html = '<colgroup>';
		$columnStyle = sprintf(" style='width:%s;'", "120px");
		$html .= sprintf('<col%s></col>', $columnStyle); //actions
        foreach ($columns as $field) {
            $isDisplay = (isset($field['showInGrid']) && $field['showInGrid'] == 'true');
			if ($isDisplay) {
				$columnStyle = "";
				$hasWidth = (isset($field['columnWidth']));
				if ($hasWidth) {
					$width = $field['columnWidth'];
					$columnStyle = sprintf(" style='width:%s;'", $width);
				}
				//print_r($field);
				$html .= sprintf('<col%s></col>', $columnStyle);
			}
        }
         $html .= '</colgroup>';
        return $html;
    }
    public function buildHeaderRowHtml($columns, $editing = false)
    {
        $html = '';
        $html .= $editing ? "" : sprintf('<td class="center">%s</td>', $this->data['texts']["action"]);
        foreach ($columns as $field) {
            $display = (isset($field['showInGrid']) && $field['showInGrid'] == 'true') ? "" : "style='display:none'";
			$columnStyle = isset($field["columnStyle"]) ? " style='" . $field["columnStyle"] . "'" : "";
            $html .= sprintf('<td class="center" %s>', $display . $columnStyle);
            $fieldName = $field['name'];
            $sortable = (isset($field['sort']) && $field['sort'] == 'true');
            $sortValue = "";
            $title = isset($field["title"]) ? $field["title"] : $fieldName;
            if ($sortable) {
                $sorting = 'sort_' . $fieldName;
                $sortValue = $this->data[$sorting];
            }
            if ($this->data["sort"] == $fieldName) {
                $html .= sprintf('<a href="%s" class="%s">%s</a>', $sortValue, strtolower($this->data["order"]), $title);
            } elseif ($sortable && $sortValue) {
                $html .= sprintf('<a href="%s" >%s</a>', $sortValue, $title);
            } else $html .= $title;
            $html .= '</td>';
        }
        $html .= '<td></td>';
        return $html;
    }

    public function buildFilterRowHtml($columns, $data)
    {
        $html = '';
        $html .= sprintf('<td align="center"><a onclick="filter();" class="button" style="height:16px;">%s</a></td>', '<img src="view/image/filemanager/search.png" alt="" title="Filtrare" style="height:16px; width:16px;"> Filtrare');
        foreach ($columns as $field) {
            $fieldName = $field['name'];
            $filterValue = $data['filter_' . $fieldName];
            $fieldHtml = method_exists($this, 'getFilterControl') ? $this->getFilterControl($fieldName, $filterValue) : '';
            if (!$fieldHtml) $fieldHtml = sprintf('<input type="text" name="filter_%s" value="%s" style="width:90%%"/>', $fieldName, $filterValue);
            $html .= sprintf('<td class="center">%s</td>', $fieldHtml);
        }
        $html .= '<td></td>';
        return $html;
    }

	//view mode only (getList, report)
    public function buildDataRowsHtml($fields, $items, $data, $parentControlName = null)
    {
		/*debugUtils::callStack(debug_backtrace());
		echo "<br>items:<br>";
		print_r($items);
		echo "<br>fields:<br>";
		print_r($fields);*/
        $html = '';
		$index = 0;
        foreach ($items as $item) {
            $html .= '<tr>';
            $html .= '<td class="center" style="padding:3px;">';
			if (isset($item['action'])) { // aici nu este setat
				foreach ($item['action'] as $action) {
					if (isset($action['img'])) {
						$content = sprintf('<img src="%s" alt="%s" title="%s" height="22" width="22">', $action['img'], $action['text'], $action['text']);
					}
					else {
						$content = $action['text'];
					}
					$html .= sprintf('<a href="%s">%s</a> ', $action['href'], $content);
				}
			}
            $html .= '</td>';
            foreach ($fields as $field) {
                $fieldName = $field['name'];
                $style = 'style=';
                $style .= (isset($field['showInGrid']) && $field['showInGrid'] == 'true') ? '' : '"display:none"'; //fields e deja filtrat pe showInGrid = true
				//echo $fieldName. ' '.$style.'<br>';
                $style .= isset($field['align']) ? sprintf('"text-align:%s"', $field['align']) : '';
                $data = array("item" => $item, "for" => "grid", "readonly" => true);
				//$controlName = $this->getHtmlControlName($fieldName, "default", $parentControlName, $index);
                $fieldHtml = $this->getCustomControl($fieldName, $data, null);
                if (!$fieldHtml) $fieldHtml = $item[$fieldName];
                $html .= sprintf('<td %s>%s</td>', $style, $fieldHtml);
            }
			$html .= '<td></td>';
            $html .= '</tr>';
			$index++;
        }
        return $html;
    }

    public function buildEditGridHeaderRowHtml($readonly)
    {
        $html = '<td id="deleteTd"></td>';
        foreach ($this->getGridColumns() as $field) {
            $display = (isset($field['showInGrid']) && $field['showInGrid'] == 'true') ? "" : "style='display:none'";
            $html .= sprintf('<td class="center" %s>', $display);
            $fieldName = $field['name'];
            $title = isset($field["title"]) ? $field["title"] : $fieldName;
            $html .= $title;
            $html .= '</td>';
        }
        $html .= '<td></td>';
        return $html;
    }

    public function buildEditGridDataRowsHtml($items, $gridReadonly, $data, $items_errors, $idValue, $isPost, $parentControlName = null)
    {
		//debugUtils::callStack(debug_backtrace());
				//print_r($items_errors);echo '<br/>---';
        $html = '';
        $fields = $this->getGridColumns();
        $index = 0;
        if (count($items) == 0) return '';
        foreach ($items as $item) {
			//print_r($item);
            $errors = isset($item["__errors"]) ? $item["__errors"] : array();
			//print_r($errors);
            $deleted = isset($item["__deleted"]) && $item["__deleted"] == 1 ? 'style="display:none"' : "";
            $deletedValue = isset($item["__deleted"]) && $item["__deleted"] == 1 ? '1' : '0';

            $line = sprintf('<tr %s>', $deleted);
			
			$line .= $this->getEditGridRowAction($gridReadonly, $item, $deletedValue, 
				$gridReadonly ? "" : $this->getHtmlControlName("__deleted", "default", $parentControlName, $index)
				);

            $fields = $this->getFormFields();
			$fieldcount = 0; //butonul de delete + restul counted de la 1
            foreach ($fields as $field) {
                $fieldName = $field['name'];
                $width = isset($field['width']) ? $field['width'] : "auto";
                $fieldReadonly = isset($field['readonly']) && $field['readonly'] == "true" ? true : false;
                $value = isset($item[$fieldName]) ? $item[$fieldName] : '';
                $display = (isset($field['showInGrid']) && $field['showInGrid'] == 'true') ? "" : "style='display:none'";
				$controlName = $this->getHtmlControlName($fieldName, "default", $parentControlName, $index);
                $controlHtml = $this->getCustomControl($fieldName, 
					array("value" => $value, "readonly" => $gridReadonly || $fieldReadonly, "width" => $width, "item" => $item),
					$controlName);
                if (!$controlHtml) {
                    $controlHtml = $this->getGridFieldDefaultControl($fieldName, "default", $parentControlName, $value, $gridReadonly, $fieldReadonly, $index);
                    $controlHtml = stripslashes($controlHtml);
                } else {
                }
                $error = isset($errors[$fieldName]) ? sprintf('<br/><span class="error">%s</span>', implode("<br/>", $errors[$fieldName])) : "";
                $line .= sprintf('<td %s>%s%s</td>', $display, $controlHtml, $error);
				$fieldcount++;
            }
			$line .= '<td></td>';

            $line .= '</tr>';
            //$line = str_replace("controlRowIndex", $index, $line);
            $html .= $line;
			
			//echo '<br/>item=<br/>';
			//print_r($item);echo '<br/>';
			$showChildren = $this->hideChildrenOnInsert ? $idValue > 0 : true;
			if ($this->children and $showChildren) {
				$p_errors = isset($items_errors[$index]) ? $items_errors[$index] : array();
				$chhtml = $this->buildFormChildren($data, $item, $p_errors, $index, $gridReadonly, $isPost, $parentControlName.'[children]['.$this->tableName.']['.$index.']'); 
				$line = sprintf('<tr><td></td><td colspan="%s">%s</td></tr>',$fieldcount, $chhtml);
				$html .= $line;
			}
            $index++;
        }
        return $html;
    }

    public function getNewRowGrid($parentControlName)
    {
		//echo $parentControlName . '<br/>';
        $html = '<tr>';
        $html .= $this->getEditGridRowAction(false, null, 0, $this->getHtmlControlName("__deleted", "grid", $parentControlName, 0));
        //$html .= sprintf('<td style="display:none"><input type="text" class="__deleted" value="0" name="%s"></td>', $this->getHtmlControlName("__deleted", "grid", $parentControlName, 0));
        $data = $this->getDefaultValues();

        $fields = $this->getFormFields();
        foreach ($fields as $field) {
            $fieldName = $field['name'];
            $fieldReadonly = isset($field['readonly']) ? $field['readonly'] : false;
            $width = isset($field['width']) ? $field['width'] : "auto";
            $display = (isset($field['showInGrid']) && $field['showInGrid'] == 'true') ? '' : 'style="display:none"';
			$controlName = $this->getHtmlControlName($fieldName, "grid", $parentControlName, 0);
            $controlHtml = $this->getCustomControl($fieldName, 
				array("value" => "", "readonly" => $fieldReadonly, "width" => $width),
				$controlName);
            $value = $data[$fieldName];
            if (!$controlHtml) {
                $controlHtml = $this->getGridFieldDefaultControl($fieldName, "grid", $parentControlName, $value, false, $fieldReadonly, 0);
            }
            $html .= sprintf('<td %s>%s</td>', $display, $controlHtml);
        }
        $html .= '<td></td>';
        $html .= '</tr>';
		//echo $html;
        return $html;
    }
	
    public function getEditGridRowAction($readonly, $item, $deletedValue = null, $controlName = null)
    {
		$line = '<td class="center" style="width:10px;">';
		if ($readonly) {
		}
		else {
			$line .= sprintf('<input type="hidden" class="__deleted" value="%s" name=%s>', 
					$deletedValue, $controlName);
			$line .= sprintf('<a onclick="delete%s(this)" class="img"><img src="image/delete.png"/>', $this->tableName);
			$line .= '</td>';
		}
		return $line;
    }

    public function getHtmlControlName($fieldName, $type, $parentName = null, $parentIndex = null)
    {
        switch ($type) {
            case "grid":
                $name = sprintf('%s[children][%s][controlRowIndex][%s]', $parentName, $this->tableName, $fieldName);
                break;
            default :
				if (isset($parentName) && !(trim($parentName) == "") && isset($parentIndex)) {
                $name = sprintf('%s[children][%s][%s][%s]',  $parentName, $this->tableName, $parentIndex, $fieldName);
				}
				else {
                $name = sprintf('%s[%s]',  $this->tableName, $fieldName);
				}
                break;
        }
        return $name;

    }

    private function findFieldStructure($fieldName)
{
   $structure = $this->getTableStructure();
   $fieldNames = array_column($structure, "FieldName");
   $fieldName = strtolower($fieldName);
   $index = array_search($fieldName, $fieldNames);
   if ($index == false && $index != 0) return array();
   return $structure[$index];
}

    public function findFieldIndex($fieldName)
    {
        $fieldNames = array_column($this->fields, "name");
        if (!$this->fields) {
            die("eroare");
        }
        $index = array_search($fieldName, $fieldNames);
        return $index;
    }

    public function getFieldAttribute($fieldName, $attribute)
    {
        $fieldNames = array_column($this->fields, "name");
        $index = array_search($fieldName, $fieldNames);
        if (isset($this->fields[$index][$attribute])) return $this->fields[$index][$attribute];
        return null;
    }

    public function getGridFieldDefaultControl($fieldName, $type, $parentName, $value, $gridReadonly, $fieldReadonly, $index = null)
    {
        $field = $this->findFieldStructure($fieldName);
        $fieldIndex = $this->findFieldIndex($fieldName);
        $fieldDef = $this->fields[$fieldIndex];
        $fieldControlName = $this->getHtmlControlName($fieldName, $type, $parentName, $index);
        $width = isset($fieldDef["width"]) ? "width:" . $fieldDef["width"] : "";
        if ($gridReadonly) {
			$html = sprintf('<span fieldName="%s">%s</span>', $fieldName, $value);
			return $html;
		}
		$readonly = ($gridReadonly || $fieldReadonly) ? 'readonly="readonly"' : '';
        $fieldType = $field["ValueType"];
        $onChange = isset($fieldDef["onChange"]) ? $fieldDef["onChange"] : "void(0)";
        switch ($fieldType) {
            case "date":
                $html = sprintf('<input type="date" name="%s" fieldName="%s" value ="%s" class="hasDatepicker" %s style="%s" />', $fieldControlName, $fieldName, $value, $readonly, $width);
                break;
            case "datetime":
                $html = sprintf('<input type="datetime" name="%s" fieldName="%s" value ="%s" %s style="%s" />', $fieldControlName, $fieldName, $value, $readonly, $width);
                break;
            case "text":
            case "varchar":
            case "char":
                $html = sprintf('<input type="text" name ="%s" fieldName="%s"  value ="%s" %s style="%s" />', $fieldControlName, $fieldName, $value, $readonly, $width);
                break;
            case "tinyint":
                if ($readonly) $readonly = 'onclick="return false"';
                $html = sprintf('<input type="hidden" name ="%s" fieldName ="%s" value ="%s" />', $fieldControlName, $fieldName, "0");
                $html .= sprintf('<input type="checkbox" name ="%s" fieldName ="%s" value ="%s" %s %s onchange="%s" />', $fieldControlName, $fieldName, "1", $value ? "checked" : "", $readonly, $onChange);
                break;
            case "decimal":
            case "int":
                if ($readonly) $html = sprintf('<input type="text" name ="%s" fieldName="%s"  value ="%s" %s style="text-align:right;%s" />', $fieldControlName, $fieldName, $value, $readonly, $width);
                else $html = sprintf('<input type="number" name = "%s" fieldName="%s"  style="text-align:right;%s" value ="%s"  onchange="%s" />', $fieldControlName, $fieldName, $width, $value, $onChange);
                break;
            default:
                echo "fieldname: " . $fieldName;
                $html = sprintf('<input type="text" name = "%s" fieldName="%s"  value="%" %s />', $fieldControlName, $fieldName, 'unknown datatype: ' . $fieldType, $readonly);
                break;
        }
        return $html;
    }

    public function getDefaultValues()
    {
        $fields = $this->fields;
        $dataItem = [];
        $dataItem[$this->tableKey] = 0;
        foreach ($fields as $field) {
            $fieldName = $field["name"];
            $fieldStruct = $this->findFieldStructure($fieldName);

            $fieldType = $fieldStruct["ValueType"];
            switch ($fieldType) {
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
                    $dataItem[$fieldName] = 'unknown data type:' . $fieldType;
                    break;
            }
            $specificValue = $this->getDefaultValue($fieldName);
            if (!is_null($specificValue)) $dataItem[$fieldName] = $specificValue;
        }
        return $dataItem;
    }

    public function getDefaultValue($fieldName)
    {
        return null;
    }

    public function getFormFieldDefaultControl($fieldName, $value, $width, $readonly, $hidden = false)
    {
        $field = $this->findFieldStructure($fieldName);
        $fieldIndex = $this->findFieldIndex($fieldName);
        $fieldDef = $this->fields[$fieldIndex];
        $fieldType = $hidden ? "hidden" : $field["ValueType"];
        $htmlControlName = $this->getHtmlControlName($fieldName, "form");
        if ($width) $width = "width:" . $width;
        if ($readonly) $readonly = 'readonly="readonly"';
        $onChange = isset($fieldDef["onChange"]) ? $fieldDef["onChange"] : " ";

        switch ($fieldType) {
            case "date":
                $html = sprintf('<input type="date" name = "%s" fieldName ="%s" value ="%s" style="%s" class="hasDatepicker" %s />', $htmlControlName, $fieldName, $value, $width, $readonly);
                break;
            case "datetime":
                $html = sprintf('<input type="datetime" name="%s" fieldName ="%s" value ="%s" %s />', $htmlControlName, $fieldName, $value, $readonly);
                break;
            case "text":
            case "varchar":
            case "char":
                $html = sprintf('<input type="text" name = "%s" fieldName ="%s" value="%s" style="%s" %s />', $htmlControlName, $fieldName, $value, $width, $readonly);
                break;
            case "hidden":
                $html = sprintf('<input type="hidden" name = "%s" fieldName ="%s" value="%s" style="%s" %s />', $htmlControlName, $fieldName, $value, $width, $readonly);
                break;
            case "tinyint":
                if ($readonly) $readonly = 'onclick="return false"';
                $html = sprintf('<input type="hidden" name ="%s" fieldName ="%s" value ="%s" />', $htmlControlName, $fieldName, "0");
                $html .= sprintf('<input type="checkbox" name ="%s" fieldName ="%s" value ="%s" %s %s />', $htmlControlName, $fieldName, "1", $value ? "checked" : "", $readonly);
                break;
            case "decimal":
            case "int":
                $html = sprintf('<input type="number" name ="%s" fieldName ="%s" value ="%s" style="%s" %s onchange=%s />', $htmlControlName, $fieldName, $value, "text-align:right;" . $width, $readonly, $onChange);
                break;
            default:
                $value = 'value="unknown data type:' . $fieldType . '"';
                $html = sprintf('<input type="text" name ="%s" %s>', $htmlControlName, $fieldName, $value);
                break;
        }

        return $html;
    }

    public function getGridToolbar($readonly, $parentControlName, $index, $data = null)
    {
		$this->setupGridToolbar($parentControlName, $index);
		$html = $this->tableTitle == "" ? "" : sprintf('<a class="button">%s</a>', $this->tableTitle);
        if (!(count($this->gridToobarActions) == 0 || $readonly)) {
			$html = sprintf('<div class="tollbar-buttons">%s%s</div>', $html, implode($this->gridToobarActions));
		}
		return $html;
    }
	
	protected function setupGridToolbar($parentControlName, $parentIndex) {
        $SufixVar = $this->Sufix($parentIndex); 
		$InsertFunctionVar = $this->InsertFunction($SufixVar);
		$text = sprintf("Gestioneaza %s", $this->NamePlural);
		$title = sprintf("Adauga %s %s %s", $this->gen == 'F' ? 'o' : 'un', $this->NameSingular, $this->gen == 'F' ? 'noua' : 'nou');
		$this->gridToobarActions = array(
			sprintf('<button class="tab button_sliding_bg" type="button">%s</button>'.
					'<a onclick="%s(this)" class="img" title="%s">'.
					'<img src="image/add.png"/></a>', $text, $InsertFunctionVar, $title),
			'');
	}

    public function addGridScriptLines($html)
    {
        $this->gridScriptLines[] = $html;
    }
	private function Sufix($parentIndex) {
        $SufixVar = sprintf('_%s_%s', $this->tableName, $parentIndex); 
		return $SufixVar;
	}
	private function InsertFunction($SufixVar) {
        $InsertFunctionVar = sprintf('insert%s', $SufixVar); 
		return $InsertFunctionVar;
	}
	protected function TableId($tableName, $index) {
        $tableId = sprintf('%s_%s_grid', $tableName, $index); 
		return $tableId;
	}

    public function getEditGridScript($rowsCount, $parentIndex, $parentName)
    {
        $html = '<script>';
        if (!empty($parentName)) {
            $SufixVar = $this->Sufix($parentIndex); 
            $RowsCountVar = sprintf('RowsCount%s', $SufixVar); 
			$InsertFunctionVar = $this->InsertFunction($SufixVar);
			$tableId = $this->TableId($this->tableName, $parentIndex);
			
            $html .= sprintf('var %s = %s;', $RowsCountVar, $rowsCount); 

            $html .= sprintf('function %s(buttonObj){', $InsertFunctionVar);
            $html .= sprintf('var html = \'%s\';', $this->getNewRowGrid($parentName));
            //$html .= 'console.log(1, html);';
            $html .= sprintf('html = html.replace(/controlRowIndex/g, %s);', $RowsCountVar . '.toString()');
            //$html .= 'console.log(2, html);';
            $html .= sprintf('var tbody = $("#%s.list > tbody");', $tableId);
            $html .= '$(tbody).append(html);';
            $html .= sprintf('%s++;', $RowsCountVar);
            $html .= '} ';

            $html .= sprintf('function delete%s(buttonObj){', $this->tableName);
            $html .= 'var tr = $(buttonObj).closest("tr");';
            $html .= 'var inp = $(tr).find(".__deleted").val(1);';
            $html .= '$(tr).hide();';
            if (method_exists($this, "getOnDeleteRecordJS")) $html .= $this->getOnDeleteRecordJS();
            $html .= '}';
        }
        if ($parentIndex == 0 && count($this->gridScriptLines) > 0) { //include just once the generic script lines
            $html .= implode('', $this->gridScriptLines); // ';' ??!!?!?!?!?!? - nu trebuie pusa virgula dupa fiecare linie javascript, decizia de a pune virgule tb sa ramana la cel care scrie codul javascript
        }

        $html .= '</script>';
        return $html;
    }
}

if (!function_exists("array_column")) {
    function array_column(array $input, $columnKey, $indexKey = null)
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
}