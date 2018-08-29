(function () {
	angular.module("App").controller("columnFilterCtrl", controller);
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
			invariant: ["customer"]
		});
		//custom column filter
		$scope.customFilter = {
			value: "",
			clear: function ($event) {
				$scope.customFilter.value = undefined;
				if ($event) {
					$event.stopPropagation();
					$scope.datatable1.$ctrl.filterApply();
				}
			},
			apply: function (dataItem) {
				if (!angular.isDefined($scope.customFilter.value)) return true;
				let value = $scope.customFilter.value.toLowerCase();
				let address = (dataItem.deliveryCity + ' ' + dataItem.deliveryAddress).toLowerCase();
				if (address.indexOf(value) === -1) return false;
				return true;
			}
		};
		$scope.datatable1 = {
			//method invoked from $ctrl.filterApply method
			itemCustomFilter: function (dataItem) {
				//here you can have more custom filters, each one tested for false value,
				// else will check the rest of filters
				if (!$scope.customFilter.apply(dataItem)) return false;
				return true;
			},
			//method invoked from $ctrl.clearAllFilters method
			itemCustomClear: function () {
				$scope.customFilter.clear();
			}
		};
		$scope.loadData = function (removeSpinner) {
			apiAction('api/data', 'data1000.json', 'get', {}, "no", removeSpinner).then(function (response) {
				if (!response) return;
				$scope.data = adapter.parseCollection(response.items);
				if (removeSpinner) removeSpinner();

			});
		};
		$scope.loadData();
	}
}());