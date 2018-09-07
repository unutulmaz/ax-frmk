(function () {
	angular.module("App").controller("configProfiles2Ctrl", controller);
	controller.$inject = ['$scope', "apiAction", "axDataAdapter", "axDataStore", "$stateParams", "$timeout", "axDataSet", "$element"];

	function controller($scope, apiAction, $adapter, dataStore, stateParams, $timeout, dataSet) {
		let config = {
			action: function (limit) {
				return "data" + limit + ".json";
			},
			adapter: {
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
				parsingCollection: true,
				invariant: ["customer", "deliveryCity", "deliveryCountry"]
			}

		};
		//creates an adapter for converting column data type from string to date, datetime, boolean, integer or float
		//creates columns for sorting and filtering without diacritics (accents) or non-alphanumeric characters
		var adapter = $adapter(config.adapter);

		//ax-table config object. With this object you can invoke all axTableController methods, or get properties
		$scope.datatable1 = {
			dataAdapter: adapter,
		};
		$scope.dataStore = dataStore;
		$scope.loadData = function (limit, removeSpinner) {
			// if it's stored in cache take it, else loads from server
			if (dataSet["data" + limit])
				$timeout(function () {
					if ($scope.datatable1.$ctrl) $scope.datatable1.$ctrl.dataLoaded = false;
					if (dataSet["data" + limit].distinctValues) $scope.distinctValues = dataSet["data" + limit].distinctValues;
					$scope.datatable1.data = dataSet["data" + limit].items;
					if (removeSpinner) removeSpinner();
				});
			else
			// factory for quick access to a server action controller. returns a promise and handles errors
				apiAction('api/data', config.action(limit), 'get', false, removeSpinner ? "no" : "", removeSpinner).then(function (response) {
					if (!response) return;
					if ($scope.datatable1.$ctrl) $scope.datatable1.$ctrl.dataLoaded = false;
					dataSet["data" + limit] = response;
					if (response.distinctValues) $scope.distinctValues = response.distinctValues;
					$scope.datatable1.data = response.items;
					if (removeSpinner) removeSpinner();
					if (response.loader) response.loader.remove();
				});
		};
		$scope.loadData(100);
	}
}());