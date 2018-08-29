(function () {
	angular.module("App").controller("test1Ctrl", controller);
	controller.$inject = ['$scope', "apiAction", "axDataAdapter"];

	function controller($scope, apiAction, $adapter) {

		$scope.customHeader = function (name) {
			if (name === "ID") return "Custom ID header";
			if (name === "Superior") return "Superior header1";
		};
		let adapter = $adapter({
			conversions: {
				date: {
					type: "date",
					inputFormat: "YYYY-MM-DD"//format of string input value
				},
				createdAt: {
					type: "datetime",
					inputFormat: "YYYY-MM-DD HH:mm:ss" //format of string input value
				},
				value: {type: "float"},
				number: {type: "integer"},
				insideUE: {type: "boolean"}
			},
			//create a new column in data collection, which can be sortable and filterable
			extend: function (dataItem) {
				this.customerFullAddress = (this.deliveryCity ? (this.deliveryCity.trim() + " - ") : "") + this.deliveryAddress;
			},
			invariant: ["customer", "deliveryCity", "deliveryCountry"]
		});

		$scope.loadData = function (limit, removeSpinner) {
			apiAction('api/data', 'getOrders.php', 'get', {limit: limit}, "no", removeSpinner).then(function (response) {
				if (!response) return;
				$scope.data = adapter.parseCollection(response.items);
				if (removeSpinner) removeSpinner();

			});
		};
		$scope.loadData(100);
	}
}());