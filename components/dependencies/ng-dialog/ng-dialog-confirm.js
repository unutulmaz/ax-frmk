(function() {
	angular.module("App").factory("ngDialogConfirm", factory);
	factory.$inject = ["ngDialog"];

	function factory(ngDialog) {
		return function(title, text, yesCallback, noCallback) {
			ngDialog.openConfirm({
				template: "/components/dependencies/ng-dialog/dialog-confirm.html",
				plain: false,
				className: 'ngdialog-theme-plain',
				appendTo: "#right-pane",
				scopeExtend: function() {
					return {
							message: text,
							title: title,
					};
				}
			}).then(yesCallback, noCallback || function() { });
			return ngDialog;
		};
	}

}());
