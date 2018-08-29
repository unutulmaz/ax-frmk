(function () {
	angular.module("App").controller("invariantColumnCtrl", controller);
	controller.$inject = ['$scope', "apiAction", "axDataAdapter","$timeout"];
	function controller($scope, apiAction, $adapter, $timeout) {
		//create an adapter for converting column data type from string to date, datetime, boolean, integer or float
		//create columns for sorting and filtering without diacritics (accents) or non-alphanumeric characters

		//Data are filtered with a custom filter by deliveryCity which has accents or non-alphabetic characters in name.
		$scope.dataTable1 = {
			dataAdapter: $adapter({
				invariant: ["country"]
			})
		};

		$scope.loadData = function (removeSpinner) {
			apiAction('api/data', 'data1000.json', 'get', {}, "no", removeSpinner).then(function (response) {
				if (!response) return;
				$scope.data = $scope.dataTable1.dataAdapter.parseCollection(response.items);
				if (removeSpinner) removeSpinner();
			});
		};

		$scope.loadData();
	}
}());