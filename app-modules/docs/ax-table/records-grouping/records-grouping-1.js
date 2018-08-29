(function () {
	angular.module("App").controller("recordsGroupingSample1Ctrl", controller);
	controller.$inject = ['$scope', "apiAction", "axDataAdapter"];
	function controller($scope, apiAction, $adapter) {
	    $scope.showResultOn="footer";
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

		$scope.loadData = function (limit,removeSpinner) {

            apiAction('api/data', 'data100.json', 'get', {},removeSpinner?"no":"", removeSpinner).then(function (response) {
				if (!response) return;
				$scope.data = adapter.parseCollection(response.items);
                if (removeSpinner) removeSpinner();
                if (response.loader) response.loader.remove();
			});
		};
		$scope.loadData(100);
	}

}());