<?php
abstract class Controller {
	protected $registry;
	protected $id;
	protected $layout;
	protected $template;
	protected $children = array();
	public $data = array();
	protected $output;
	protected $model ;
	protected $error = array();

	public function __construct($registry) {
		$this->registry = $registry;
	}
	public function __get($key) {
		return $this->registry->get($key);
	}
	public function __set($key, $value) {
		$this->registry->set($key, $value);
	}
	protected function forward($route, $args = array()) {
		return new Action($route, $args);
	}
	protected function getModel($file){
		$class = "model_" . str_replace( "/", "_", $file);
		if (!class_exists($class)) $this->load->model($file );
		$m = $this->registry->get($class);
		//$m->retrieveHTMLCallback = $this->retrieveHTML;
		return $m;
	}
	protected function redirect($url, $status = 302) {
		header('Status: ' . $status);
		header('Location: ' . str_replace(array('&amp;', "\n", "\r"), array('&', '', ''), $url));
		exit();
	}
	public function info(){
		$this->update($readonly=true);
	}
	
	protected function retrieveHTML($template){
		$this->template = $template;
		return $this->render();
	}
	
	protected function getHTML($template, $loadAllPage, $pdfTemplateFileName = "", $exportedFileName = ""){
		if ($loadAllPage) $this->children = array(
				'common/header',
				'common/footer'
		);
		//echo 'this is it';
	    $pdf = (isset($this->request->get['pdf'])) ? true : false;
		if ($pdf){
			//echo 'is pdf $pdfTemplateFileName='.$pdfTemplateFileName; die;
			$this->template = $pdfTemplateFileName;
			$this->data["dir_application"] = //strpos(HTTP_SERVER, "localhost")> 0? "": 
				( empty($pdf) ? "": str_replace ( '/', '//', DIR_APPLICATION));
			$this->response->setOutput(pdf($this->render(),$this->data, $exportedFileName));
		}else{
			//echo 'is not pdf';
			$this->template = $template;
			$this->response->setOutput($this->render());
		}
	}
	public function insert(){
		$this->update();
	}
	
	protected function updateInner($readonly=false, $linkupdate = false) {
		$this->load->model($this->controller );
		$model = $this->getModel($this->controller);
		$this->data['token'] = $this->session->data['token'];

		$fields = $model->fields;
		$tableKey = $model->tableKey;
		if (isset($this->request->get[$tableKey])) {
			$this->data[$tableKey] = $this->request->get[$tableKey];
		} else {
			$this->data[$tableKey] = 0;
		}
		//echo $tableKey . ' = ' . $this->data[$tableKey]; die;
		$this->data["fields"] = $fields;
		$this->data["formFields"] = array();
		$this->data["gridColumns"] = array();
		foreach ($fields as $field) {
			if (isset($field["showInForm"]) && $field["showInForm"] == true) {
				$this->data["formFields"][] = $field;
			}
		}
		$url = $this->buildUrlFull($sort = $this->sortColumn, $order = $this->orderby);
		if (($this->request->server['REQUEST_METHOD'] == 'POST') && $this->validateForm()) {
			//echo 'validateform';die;
            try {
                $this->db->begin_transaction();
				$data = $this->request->post[$model->tableName];
				//print_r($data); die;
				$this->getModel($this->controller)->saveRecord($this->data[$tableKey], $data);
				$this->afterUpdateMainRecord($data);
                $this->db->commit();
				//die;
				
                $this->getText('success');
                $update = $linkupdate ? "/update&order_id=" . $this->data[$tableKey] : '';
				$this->redirect($this->url->link($this->controller . $update, 'token=' . $this->session->data['token'] . $url, 'SSL'));
			} catch (Exception $e) {
                $this->db->rollback();
                throw $e;
            }
		} else {
			$this->getForm( $url, $readonly, $this->data[$tableKey]);
		}
	}
	protected function afterUpdateMainRecord($data) {
	}
	protected function setHeadingTitle($title){
		$this->data['heading_title'] = $title;
	}
	protected function hasContainer(){
		//$this->data['hasContainer'] = true;
		$this->document->addProperty('hasContainer', true);
	}
	protected function execTransaction($callback, $controller=null, $url=null)
    {
        try {
            $this->db->begin_transaction();
            $callback();
            $this->db->commit();
            if ($controller)
            $this->redirect($this->url->link($controller, 'token=' . $this->session->data['token'] . $url, 'SSL'));
        } catch (Exception $e) {
            $this->db->rollback();
            $this->getText('error');
            throw $e;
        }
        return;

    }
	protected function listInit(){
		//echo 'listInit';
		$this->data['breadcrumbs'] = array();
		$this->data['token'] = isset($this->session->data['token'])? $this->session->data['token']: "";
		$this->data['buttons'] = array();
		//echo 'error=';
		//print_r($this->error);
		if (isset($this->error['warning'])) {
			$this->data['errors']['warning'] = $this->error['warning'];
		} else {
			$this->data['errors']['warning'] = '';
		}
		if (isset($this->session->data['success'])) {
			$this->data['success'] = $this->session->data['success'];
			unset($this->session->data['success']);
		} else {
			$this->data['success'] = '';
		}
		$this->getText('heading_title');
		$this->getText('no_results');
		$this->getText('missing');
		$this->getText('action');
	}
	protected function renderInnerForm($template)
	{
		$tableKey = $this->getTableKeyName();
		$this->extractData($tableKey, false);
		$this->getHTML($template, false);
	}
	protected $keyvalue;
	protected function getTableKeyValue()
	{
		return $this->keyvalue;
	}
	protected function setTableKeyValue()
	{
		$tableKey = $this->getTableKeyName();
//		if (($this->request->server['REQUEST_METHOD'] == 'POST') ) {
//			$key = isset($this->request->post[$tableKey]) ? $this->request->post[$tableKey] : 0;
//		}
//		else {
//			$key = isset($this->request->get[$tableKey]) ? $this->request->get[$tableKey] : 0;
//		}
        // oare id-ul vine doar prin url? adica prin get?
        $key = isset($this->request->get[$tableKey]) ? $this->request->get[$tableKey] : 0;
		$this->keyvalue = $key;
		$this->data[$tableKey] = $key;
		//return $tableKey;
	}
	protected function getTableKeyName()
	{
		$tableKey = $this->getModel($this->controller)->tableKey;
		return $tableKey;
	}
	protected function extractData($tableKey, $readonly, $all_on_page = false)
	{
		//echo 'extractData';
		//print_r($this->data);
		$itemInfo = array();
		$model = $this->getModel($this->controller);
		if ($this->request->server['REQUEST_METHOD'] == 'POST') {
			$itemInfo = $this->request->post[$model->tableName];
			//echo 'is POST';die;  
		}
		elseif ($this->data[$tableKey] == 0) {
			//echo 'else1';  
			$itemInfo = $model->getDefaultValues(); 
			//print_r($itemInfo);die;
		}
		else {
			//echo 'else2';die;
			$itemInfo = $model->getItemById($this->data[$tableKey]);
			$this->data["itemInfo"] = $itemInfo;
			$childrenInfo = $model->getItemAndChildrenItemsByParentId($this->data[$tableKey]);
			//print_r($childrenInfo);
			$this->data["childrenItems"] = isset($childrenInfo['childrenItems']) ? $childrenInfo['childrenItems'] : [];
			$this->data["collections"] = isset($childrenInfo['collections']) ? $childrenInfo['collections'] : [];
		}
		if( $this->error) $itemInfo["errors"] = $this->error;
		$itemInfo["isPost"] = ($this->request->server['REQUEST_METHOD'] == 'POST');
		$itemInfo["token"] = $this->data['token'];
		$itemInfo["baseUrl"] = $this->url->link($this->controller , "", 'SSL');
		if (isset($all_on_page) && $all_on_page) {
			$this->data["formTableHtml"] = $model->buildFormTableHtmlAllOnPage($itemInfo, $readonly);
		}
		else {
			$this->data["formTableHtml"] = $model->buildFormTableHtml($itemInfo, $readonly); ////model->
		}
		$this->data["documentReady"] = $model->documentReady;
	}

	protected function scandShowInGridFields(){
		if (!isset($this->data["fields"])) return "";
		$url = '';
		foreach ($this->data["fields"]  as $field)
		{
			if (isset($field["showInGrid"]) && $field["showInGrid"] == true) {
				$this->data["gridColumns"][] = $field;
				$fieldName = $field['name'];
				$value = $this->getUrlForFilterField($fieldName);
				$url .= $this->buildUrl('filter_' . $fieldName, $value);
			};
		}
		return $url;
	}
	protected function getUrlForFilterField($field){
		switch ($field){
			default:
				$value = null;
				break;
		}
		return $value;
	}
	protected function buildUrlFull($sort, $order){
		$url = $this->scandShowInGridFields();
		$url .= $this->buildUrl('sort', null, $sort);
		$url .= $this->buildUrl('order', null, $order);
		$url .= $this->buildUrl('page', null, 1);
		return $url;
	}
	protected function setElementError($element){
		if (isset($this->error[$element])) {
			$this->data['errors'][ $element] = $this->error[$element];
		} else {
			$this->data['errors'][ $element] = [];
		}
	}
	protected function setElementPostData($element, $model = null){
		if (isset($this->request->post[$element])) {
			$this->data[$element] = $this->request->post[$element];
		} elseif (!empty($model)) {
			$this->data[$element] = $model[$element];
		} else {
			$this->data[$element] = '';
		}
	}
	protected function setElementGetData($element, $initial = null){
		if (isset($this->request->get[$element])) {
			$this->data[$element] = $this->request->get[$element];
		} else {
			$this->data[$element] = $initial;
		}
	}
	protected function buildUrl($element, $value=null, $initial=null){
		$url = '';
		if (is_null($value) && isset($this->request->get[$element])) {
			$value = $this->request->get[$element];
			$value = urlencode(html_entity_decode($value, ENT_QUOTES, 'UTF-8'));
		}
		if (!is_null($value)) {
			$url .= '&' . $element . '=' . $value;
		}
		if (isset($this->request->get[$element])) {
			$this->data[$element] = $this->request->get[$element];
		} else {
			$this->data[$element] = $initial;
		}
		return $url;
	}
	protected function getAllTexts($elements){
		foreach ($elements as $element)
		{
			$this->getText($element);
		}
	}
	protected function getText($element, $text = null){
		if (is_null($text)) $text = $this->language->get($element);
		if (!isset($this->data['texts'])) $this->data['texts'] = array();
		$this->data['texts'][$element] = $text;
		return $text;
	}
	protected function getSortUrl($element, $actionController, $url){
		$this->data['sort_' . $element] = $this->url->link($actionController, 'token=' . $this->session->data['token'] . $url, 'SSL');
	}
	protected function addBreadcrumbs($text, $controllerAction, $url){
		if (!isset($this->data['breadcrumbs'])) {
			$this->data['breadcrumbs'] = array();
		}
		$index = count($this->data['breadcrumbs']);
        $token = isset($this->session->data['token'])? 'token=' . $this->session->data['token']: "";
		$this->data['breadcrumbs'][] = array(
		'text'      => $this->language->get($text),
		'href'      => $this->url->link($controllerAction, $token . $url, 'SSL'),
		'separator' => $index == 0 ? false: ' :: '
);
	}
	protected function getPagination($total, $actionController, $url){
		
		$url = $this->cleanUpUrl($url, 'page');
		$pagination = new Pagination();
		$pagination->total = $total;
		$pagination->page = $this->data[ 'page'];
		$pagination->limit = $this->config->get('config_admin_limit');
		$pagination->text = $this->language->get('text_pagination');
		$pagination->url = $this->url->link($actionController, 'token=' . $this->session->data['token'] . $url . '&page={page}', 'SSL');
		$this->data['pagination'] = $pagination->render();
		//$pagination->limit = $total;
		//$this->data['pagination'] = '';
	}
	protected function cleanUpUrl($url, $paramName){
		$params = explode('&', $url);
		$url = '';
		foreach ($params as $param)
		{
			$pair = explode('=', $param);
			if ($pair[0] == $paramName) continue;
			if ($pair[0] == '') continue;
			$url .= "&". $param;
		}
		return $url;
	}
	protected function buildFilterJsCode($controller){
		$jsFilterCode  = '<script type="text/javascript">';
		$jsFilterCode .= 'function filter(){';
		$jsFilterCode .= sprintf( 'var url ="index.php?route=%s&token=%s";', $controller, $this->data["token"]);
		if (isset($this->data["gridColumns"])){
			foreach ($this->data["gridColumns"] as $column)
			{
				$filterVar = 'filter_' . $column['name'];
				$jsFilterCode .= sprintf( 'var %1$s = $("[name=\'%1$s\']").attr("value");', $filterVar);
				$jsFilterCode .= sprintf('if (%s)', $filterVar);
				$jsFilterCode .= sprintf( ' url += "&%1$s=" + encodeURIComponent(%1$s);', $filterVar);
			}
		}
		$jsFilterCode .= "location = url; }";
		$jsFilterCode .= "</script>";
		$this->data["jsFilterCode"] = $jsFilterCode;
	}

	
	protected function buildDocumentReady($html){
		if(!isset($this->data["documentReady"])) $this->data["documentReady"]=array();
		$this->data["documentReady"][] = $html;
	}
	protected function validateForm() {
		$model = $this->getModel($this->controller);
		//print_r($this->request->post);
		$formData = $this->request->post[$model->tableName];
		//print_r($formData);
		$error = $model->validateRecordData($formData, null);
		//print_r($error);
		if ($error && $this->error) $this->error = array_merge($this->error , $error);
		if ($error && !$this->error) $this->error = $error;
		$hasError = $this->hasErrors($error);
		if ($hasError && !isset($this->data["errors"]['warning'])) {
			$this->data["errors"]['warning'] = "Exista erori de introducere! Verificati!";
			//echo '<br/>'. $this->data["errors"]['warning'];
		}
		//die;
		return (!$hasError);
	}
	protected function hasErrors($error) {
		//echo count($error) .'<br/>';
		//print_r($error);
		$hasError = isset( $error["children"]) ? (count($error) > 1) : (count($error) > 0);
		//echo '<br/>haserror='.$hasError.'<br/>';
		if (!$hasError && isset( $error["children"])) {
			foreach ($error["children"] as $items)
			{
				foreach ($items as $item) {
					$hasError = $this->hasErrors($item);
					if ($hasError) break;
				}
				if ($hasError) break;
			}

		}
		return $hasError;
	}
	protected function flatten(array $array) { 
		$return = array(); 
		array_walk_recursive($array, 
			function($a,$b) use (&$return) { 
				$return[$b] = $a; }); 
		return $return; 
	} 
	protected function arrayflatten(array $array) {
		$return = array();
		foreach ($array as $key => $value) {
			//echo $key;
			//print_r($value);
			if (is_array($value)){
				$return = array_merge($return, $this->arrayflatten($value));
			} else {
				$return[$key] = $value;
			}
		}
		return $return;
	}
	
	protected function genericReport(){
		//echo 'genericReport';
		$this->load->model($this->controller );
		$this->model = $this->getModel($this->controller);
		$this->document->setTitle($this->model->reportName);
		$this->data['heading_title'] = $this->model->reportName;
		$this->data['buttons'] = array();

		$this->data["buttons"][] = sprintf('<button onclick="filter();" class="button">%s</button>', "Genereaza raport");
		$this->data['token'] = $this->session->data['token'];
		$url = $this->buildUrlFull($sort = "", $order = "");
		$formData = $this->model->getDefaultValues();
		foreach ($formData as $key=>&$value){
			if ($key === "") continue;
			if (isset($this->request->get[$key])) $value=$this->request->get[$key];
			$url .= "&$key=$value";
		}
		$this->data = array_merge(	$this->data, $formData);

		$this->setElementGetData('start', ($this->data['page'] - 1) * $this->config->get('config_admin_limit'));
		$this->setElementGetData('limit', $this->config->get('config_admin_limit'));

		$this->data["formTableHtml"] = $this->model->buildFormTableHtml($formData); //model->
		$showReport = ( !isset($formData["errors"]) || count($formData["errors"]) == 0) ;
		if ($showReport){
			$nrRecords = 0;
			$results = $this->model->getList($this->data, $nrRecords);
			$this->data['columnsNo'] = count($this->model->gridColumns);
			$this->data["headerRowHtml"] = $this->model->buildHeaderRowHtml($formData);
			//print_r($results["table"]);
			$this->data["dataRowsHtml"] = $this->model->buildDataRowsHtml($results["table"]);
			$this->getPagination($nrRecords , $this->controller , $url);
			if ($nrRecords == 0) $this->data["noResult"] = "Nu sunt inregistrari de afisat";
		}
		$this->data["showReport"] = $showReport;
		$this->buildFilterJsCodeForReport($this->controller, $formData);
		$this->getHTML('generic/generic_report.tpl', true);
		$this->response->setOutput($this->render());
	}
	
	protected function getList($sortColumn, $orderby = "ASC")
	{
		$this->hasContainer();
		$this->listInit();
		$token = $this->session->data['token'];
		$model = $this->getModel( $this->controller);
		$this->data["controllerAction"] = $this->controller ;
		$this->data["baseUrl"] = sprintf( 'index.php?route=%s?token=%s', $this->controller, $token);

		$this->data["fields"] = $model ->fields;
		$url = $this->buildUrlFull($sort = $sortColumn, $order = $orderby);
		$this->addBreadcrumbs("home", 'common/home', '');
		$this->addBreadcrumbs("heading_title", $this->controller, $url);

		$this->setElementGetData('start', ($this->data['page'] - 1) * $this->config->get('config_admin_limit'));
		$this->setElementGetData('limit', $this->config->get('config_admin_limit'));

		$this->data['items'] = array();
        $nrRecords = 0;
		$results = $model->getList( $this->data, $nrRecords);
		$insertUrl = $this->url->link($this->controller . '/insert', 'token=' . $token, 'SSL');
        $this->data['insertUrl'] = $this->url->link($this->controller . '/insert', 'token=' . $token, 'SSL');
        $this->data['deleteUrl'] = $this->url->link($this->controller . '/delete', 'token=' . $token . $url, 'SSL');
		//echo 'tableactions';
		$results = $this->TableActions($results, $model, $url);
		//print_r($results);
		//$this->data['deleteUrl'] = $this->url->link($this->controller . '/delete', 'token=' . $token . $url, 'SSL');
		
		$this->buildFilterJsCode($this->controller);
        $this->data['buttons'][] = sprintf('<a href="%s" class="button">%s</a>', $insertUrl, '<img src="view/image/add.png" alt="" title="Adaugare" style="height:16px; width:16px;margin-right:4px; margin-left:0px;"> Adaugare');
		$this->data["texts"]["heading_title"] = $this->document->getProperty("heading_title");

		$this->data["tableKey"] = $model->tableKey;
		$this->data["items"] = $results;
		$this->getPagination($nrRecords, $this->controller , $url);
		$this->data["colGroupHtml"] = $model->buildColGroupHtml($this->data["gridColumns"]);
		$this->data["headerRowHtml"] = $model->buildHeaderRowHtml($this->data["gridColumns"]);
		$this->data["filterRowHtml"] = $model->buildFilterRowHtml( $this->data["gridColumns"], $this->data);
		$this->data["dataRowsHtml"] = $model->buildDataRowsHtml($this->data["gridColumns"], $results, $this->data);

		$this->getHTML('generic/generic_list.tpl', true);
	}
	protected function buildFilterJsCodeForReport($controller, $formData){
		$jsFilterCode  = '<script type="text/javascript">';
		$jsFilterCode .= 'function filter(){';
		$jsFilterCode .= sprintf( 'var url ="index.php?route=%s&token=%s";', $controller, $this->data["token"]);
		foreach ($formData as $key=>$value)
		{
			$filterVar = $key;
			$jsFilterCode .= sprintf( 'var %1$s = $("[name=\'%1$s\']").attr("value");', $filterVar);
			$jsFilterCode .= sprintf('if (%s)', $filterVar);
			$jsFilterCode .= sprintf( ' url += "&%1$s=" + encodeURIComponent(%1$s);', $filterVar);
		}
		$jsFilterCode .= "location = url; }";
		$jsFilterCode .= "</script>";
		$this->data["jsFilterCode"] = $jsFilterCode;
	}

	protected function getChild($child, $args = array()) {
		$action = new Action($child, $args);

		if (file_exists($action->getFile())) {
			require_once($action->getFile());

			$class = $action->getClass();

			$controller = new $class($this->registry);

			$controller->{$action->getMethod()}($action->getArgs());

			return $controller->output;
		} else {
			trigger_error('Error: Could not load controller ' . $child . '!');
			exit();
		}
	}

	protected function hasAction($child, $args = array()) {
		$action = new Action($child, $args);

		if (file_exists($action->getFile())) {
			require_once($action->getFile());

			$class = $action->getClass();

			$controller = new $class($this->registry);

			if(method_exists($controller, $action->getMethod())){
				return true;
			}else{
				return false;
			}
		} else {
			return false;
		}
	}

	protected function render() {
		foreach ($this->children as $child) {
			$this->data[basename($child)] = $this->getChild($child);
		}

		if (file_exists(DIR_TEMPLATE . $this->template)) {
			extract($this->data);

			ob_start();

			require(DIR_TEMPLATE . $this->template);

			$this->output = ob_get_contents();

			ob_end_clean();

			return $this->output;
		} else {
			trigger_error('Error: Could not load template ' . DIR_TEMPLATE . $this->template . '!');
			exit();
		}
	}
	//2017.01.17 - adic - mutate din Model - 
	//html helpers
    protected function tabHasError($tabIndex, $data)
    {
        $fields = $this->model->getFormFields();
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
	
	protected function getFormInner($url, $readonly, $all_on_page) {
		$texts = [];
		foreach ($this->data["formFields"] as $field) {
			$fieldName = $field["name"];
			$texts[] = $fieldName;
			$this->setElementError($fieldName);
		}
		//$texts = array_merge( $texts, ['heading_title', 'enabled', 'disabled', 'select', 'none', 'wait', 'no_results', 'Save', 'Cancel', 'General']);
		$this->getAllTexts($texts);
		
		if( $this->error) $this->data["errors"] = $this->error;

		$this->addBreadcrumbs('home', 'common/home', '');
		$this->addBreadcrumbs('heading_title', $this->controller, $url);

		$model = $this->getModel($this->controller);
		$tableKey = $model->tableKey; //$tableKey = $this->getTableKeyName();
		if (isset($this->request->get[$tableKey])) {
			$this->data[$tableKey] = $this->request->get[$tableKey];
		} else {
			$this->data[$tableKey] = 0;
		}

		if ($readonly) {}
		else if ($this->data[$tableKey] == 0) {
			$this->data['actionUrl'] = $this->url->link($this->controller . '/insert', 'token=' . $this->session->data['token'] . $url, 'SSL');
		} else {
			$this->data['actionUrl'] = $this->url->link($this->controller . '/update', 'token=' . $this->session->data['token'] . '&' . $tableKey . '=' . $this->data[$tableKey] . $url, 'SSL');
		}
		$this->data['cancelUrl'] = $this->url->link($this->controller, 'token=' . $this->session->data['token'] . $url, 'SSL');
		
		$this->data["buttons"] = array();
		$this->buttonsSetup($tableKey, $url, $readonly);

		$this->extractData($tableKey, $readonly, $all_on_page);
		$this->getHTML('generic/generic_form.tpl', true);
	}
	protected function buttonsSetup($tableKey, $url, $readonly) {
	}
}
?>