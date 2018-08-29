(function () {
	angular.module("App").controller("columnResizeSampleCtrl", controller);
	controller.$inject = ['$scope', "apiAction", "axDataAdapter"];

	function controller($scope, apiAction, $adapter) {
		var adapter = $adapter({
			conversions: {
				date: {
					type: "date",
					inputFormat: "YYYY-MM-DDTHH:mm:ss.sssZ"
				},
				createdAt: {
					type: "datetime",
					inputFormat: "YYYY-MM-DDTHH:mm:ss.sssZ", //format of string input value
				},
				value: {type: "float"},
				number: {type: "integer"},
				insideUE: {type: "boolean"}
			},
			//create invariant columns (without accents, non alphanumeric characters) for ordering and filtering
			invariant: ["customer", "deliveryCity", "deliveryCountry"]
		});

		$scope.loadData = function (limit, removeSpinner) {
			// factory for quick access to a server action controller. return a promise and handle errors
			apiAction('api/data', 'data100.json', 'get', {}, removeSpinner ? "no" : "", removeSpinner).then(function (response) {
				if (!response) return;
				// parse server response, execute converting, and create invariant columns with adapter.parseCollection
				// create controller scope variable declared as datasource for ax-table
				$scope.data = adapter.parseCollection(response.items);
				if (removeSpinner) removeSpinner();
				if (response.loader) response.loader.remove();
			});
		};
		$scope.loadData(100);
	}
}());