class axTableCustomCtrl {
	constructor() {
		this.dataAdapter = null;
		this.editor = new axTableEditorCustomCtrl();
		this.exportCfg = {item: new axTableExportItemCfgCtrl()};
	}

	currentItemChanged(dataItem) {
	}

	goToRowCallback(dataItem, event) {
	}

	canAdd() {
		return true;
	}

	canDelete(dataItem) {
		return true;
	}

	createCallback(dataItem) {
	}

	createApiArgs() {
		return {};
	}

	emptyItem(params) {
		return {};
	}

	deleteApiArgs() {
		return {};
	}

	deleteCallback(dataItem) {
	}

	validate(dataItem) {
		return true;
	}

	validateField(fieldName, dataItem) {
		return true;
	}

	afterSuccessSave(serverResponse) {

	}

	saveApiArgs(dataItem) {
		return {};
	}

	save(dataItem, apiArgs, saveThen) {
	}

	saveCallback($controller, serverResponse) {
	}

	tableToggleMaximize() {
	}

	loadDataApiArgs() {
		return {};
	}

	editApiArgs() {
		return {};
	}

	loadData($controller, removeSpinner, callback) {

	}

	getChildrenDatasources(childrenData) {

	}

	itemCustomFilter(dataItem) {
		return true;
	}

	itemCustomFilterClear() {

	}

	isNewRecord(dataItem) {
		return false;
	}

}

class axTableEditorCustomCtrl {
	canAdd() {
		return true;
	}

	canChangeEditorPosition() {
		return true;
	}

	canEdit() {
		return true;
	}

	canDelete() {
		return true;
	}

	canPrint() {
		return true;
	}

	editCallback(dataItem) {
	}

	createCallback(dataItem) {
	}

	afterSuccessSave({data = dataItem, status = true}) {
	}

	undoCallback(dataItem) {
	}

	beforDelete(dataItem) {
	}

	afterDelete(dataItem) {
	}
}

class axTableExportItemCfgCtrl {
	sendEmail($controller, exportType, exportResponse) {
		let data = $controller.$$grid.$$editor.from.dataItem;
		let response = {
			subject: "My subject",
			to: "destination@gmail.com",
			from: "myemail@.gmail.com",
			message: "Custom message",
			remoteAttachment: exportResponse

		};
		response.to = "bogdan.ionescu@softventure.ro";
		let sender = controller.$dataStore.user.info;
		response.from = sender.numeComplet + "<" + sender.email + ">";
		response.message = "A fost emisa factura " + invoice.serial + "-" + invoice.number + " din data " + invoice.date.toLocaleDateString() + " conform contract 152/2018. Vezi atasament!";
		response.message += "<br>Cu respect,<br>Bogdan-Mihai Ionescu";

		return response;
	}

	footerData(dataItem) {
		return {};
	}

	headerData(dataItem) {
		return {};
	}

	formOutput(exportType, popup, dataItem) {
		//build your own: popup.html(myHtml) or change current output;
		if (exportType === "xls") {

		}
		//remove form total field from export output
		popup.find("ax-form td[control-for='value']").html("");
	}

	detailsOutput(exportType, table, detailName) {
	}

}
