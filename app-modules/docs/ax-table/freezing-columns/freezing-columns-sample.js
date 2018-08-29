(function () {
	angular.module("App").controller("freezingColumnsSampleCtrl", controller);
	controller.$inject = ['$scope', "apiAction", "axDataAdapter"];

	function controller($scope, apiAction, $adapter) {
		//wait for table controller to initialize and read attributes value
		$scope.$watch("datatable1.$ctrl", function () {
			$scope.leftFreezedColumns = $scope.datatable1.$ctrl.attrs.leftFreezedColumns;
			$scope.rightFreezedColumns = $scope.datatable1.$ctrl.attrs.rightFreezedColumns;
		});
		$scope.apply = function () {
			/*
			* @type {axTableController}
			*/
			let ctrl = $scope.datatable1.$ctrl;
			let compile = true;
			ctrl.setAttribute("left-freezed-columns", $scope.leftFreezedColumns || 0);
			ctrl.setAttribute("right-freezed-columns", $scope.rightFreezedColumns || 0, compile);
		};
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

		//retrieve cities data collection for dropdown-list control;
		apiAction('api/data', 'getCities.php', 'get', {}, "no").then(function (response) {
			if (!response) return;
			$scope.cities = response.items;
		});
		//retrieve countries data collection for dropdown-list control;
		apiAction('api/data', 'getCountries.php', 'get', {}, "no").then(function (response) {
			if (!response) return;
			$scope.countries = response.items;
		});
		// a better way to retrieve data collections for dropdowns is to get all collection in one request (loadData method)
	}
}());