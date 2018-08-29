(function () {
	angular.module("App").controller("freezingColumnsCtrl", controller);
	controller.$inject = ['$scope'];

	function controller($scope) {
		$scope.code = {
			forbiddenColumns:
`$scope.datatable1 = {
    //method to hide conditionally some columns for user - user will not be able to see data from theses columns
    // method return an array with forbidden columns
    forbiddenColumns: function (header) {
        if (true) return ["Created By"]; // headers title list , not field name
        return [];
    }
};`,
            group:`<ax-group expression="dataItem.deliveryCountry" order-by="deliveryCountry" label="Country" >
    <ax-calculation column="Value" show-on="footer" aggregate-type="sum"></ax-calculation>
</ax-group>`
		};
	}
}());