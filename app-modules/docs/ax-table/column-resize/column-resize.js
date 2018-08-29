(function () {
	angular.module("App").controller("columnResizeCtrl", controller);
	controller.$inject = ['$scope'];

	function controller($scope) {
		$scope.code = {
			forbiddenColumns:
`$scope.datatable1 = {
    //method to hide conditionally some columns for user - user will not be able to see data from theses columns
    // method return an array with forbidden columns
    forbiddenColumns: function (header) {
        if (true) return ["createdBy"];
        return [];
    }
};`,
		};
	}
}());