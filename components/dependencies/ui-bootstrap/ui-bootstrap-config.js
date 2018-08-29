angular.module("ui.bootstrap").config(['uibDatepickerPopupConfig', function (datepickerPopupConfig) {
	datepickerPopupConfig.currentText = "Today";
	datepickerPopupConfig.clearText = "Clear";
	datepickerPopupConfig.toggleWeeksText = "Week";
	datepickerPopupConfig.closeText = "Done";
	datepickerPopupConfig.appendToBody = true;
}]);