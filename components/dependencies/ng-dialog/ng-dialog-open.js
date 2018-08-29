(function() {
    angular.module("App").factory("ngDialogOpen", factory);
    factory.$inject = ["ngDialog"];

    function factory(ngDialog) {
    	return function(params) {
    		var ngDialogOptions = {
    			className: 'ngdialog-theme-plain',
    			disableAnimation: false,
    			appendTo: "#right-pane",
    		};
    		if (!angular.isObject(params)) {
    			ngDialogOptions.template = params;
    		} else angular.extend(ngDialogOptions, params);
    		ngDialog.open(ngDialogOptions);
    		return ngDialog;
        };
    }

}());
