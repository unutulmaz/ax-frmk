(function () {
	angular.module("App").controller("columnViewCtrl", controller);
	controller.$inject = ['$scope', "apiAction", "axDataAdapter"];

	function controller($scope, apiAction, $adapter) {
		let adapter = $adapter({
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
			//create a new column in data collection, which can be sortable and filterable - this it's the most efficient and flexible way
			extend: function (dataItem) {
				this.customerFullAddress = (this.deliveryCity ? (this.deliveryCity.trim() + " - ") : "") + this.deliveryAddress;
			},
			invariant: ["customer", "deliveryCity", "deliveryCountry"]
		});
		//create dynamic custom row classes;
		$scope.getRowCssClasses = function (dataItem) {
			let classes = "";
			if (dataItem.value > 1000000) classes += " big-value";
			if (dataItem.insideUE) classes += " intra-ue";
			return classes;
		};
		$scope.loadData = function (removeSpinner) {
			apiAction('api/data', 'data100.json', 'get', {}, "no", removeSpinner).then(function (response) {
				if (!response) return;
				$scope.data = adapter.parseCollection(response.items);
				if (removeSpinner) removeSpinner();

			});
		};
		$scope.loadData();
	}
}());