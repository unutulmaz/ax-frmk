(function () {
	angular.module("App").controller("testCtrl", controller);
	controller.$inject = ['$scope', "apiAction", "axDataAdapter"];

	function controller($scope, apiAction, $adapter) {
		let adapter = $adapter({
			conversions: {
				date: {
					type: "date",
					inputFormat: "YYYY-MM-DD" //format of string input value
				},
				value: { type: "float" },
				number: { type: "integer" },
				insideUE: { type: "boolean" }
			},
			//create a new column in data collection, which can be sortable and filterable - this it's the most efficient and flexible way
			extend: function (dataItem) {
				this.customerFullAddress = (this.deliveryCity ? (this.deliveryCity.trim() + " - ") : "") + this.deliveryAddress;
			},
			invariant: ["customer", "deliveryCity", "deliveryCountry"]
		});

		$scope.loadData = function (limit, removeSpinner) {
			apiAction('api/data', 'getOrders.php', 'get', { limit: limit }, "no", removeSpinner).then(function (response) {
				if (!response) return;
				$scope.data = adapter.parseCollection(response.items);
				if (removeSpinner) removeSpinner();
			});
		};
		//retrieve cities data collection for dropdown-list control;
		apiAction('api/data', 'getCities.php', 'get', {}, "no").then(function (response) {
			if (!response) return;
			$scope.cities = response.items;
		});

		$scope.loadData(100);
	}
}());
