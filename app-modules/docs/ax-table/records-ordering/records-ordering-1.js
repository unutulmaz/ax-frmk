(function () {
	angular.module("App").controller("recordsOrderingCtrl", controller);
	controller.$inject = ['$scope', "apiAction", "axDataAdapter"];

	function controller($scope, apiAction, $adapter) {
		//create an adapter for converting column data type from string to date, datetime, boolean, integer or float
		//create columns for sorting and filtering without diacritics (accents) or non-alphanumeric characters
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
			invariant: ["customer", "deliveryCity", "deliveryCountry"]
		});

		//Data are filtered with a custom filter by deliveryCity wich has accents or non-alphabetic characters in name.
		$scope.datatable1 = {
			itemCustomFilter: function (item) {
				return item.deliveryCity !== item.deliveryCityInvariant;
			}
		};

		$scope.loadData = function (removeSpinner) {
			// factory for quick access to a server action controller. return a promise and handle errors
			apiAction('api/data', 'data1000.json', 'get', {}, "no", removeSpinner).then(function (response) {
				if (!response) return;
				// parse server response, execute converting, and create invariant columns with adapter.parseCollection
				// create controller scope variable declared as datasource for ax-table
				$scope.data = adapter.parseCollection(response.items);
				if (removeSpinner) removeSpinner();

			});
		};

		$scope.loadData();
	}
}());