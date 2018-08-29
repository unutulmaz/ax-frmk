(function () {
	angular.module("App").controller("columnFilterMenuCtrl", controller);
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
			invariant: ["deliveryCity", "customer"]
		});
		//custom column filter
		$scope.customFilter = {
			option1: {
				value: "",
				clear: function ($event) {
					$scope.customFilter.option1.value = undefined;
					if ($event) {
						$event.stopPropagation();
						$scope.datatable1.$ctrl.filterApply();
					}
				},
				apply: function (dataItem) {
					if (!angular.isDefined($scope.customFilter.option1.value)) return true;
					let value = $scope.customFilter.option1.value.toLowerCase();
					let address = (dataItem.deliveryCity + ' ' + dataItem.deliveryAddress).toLowerCase();
					if (address.indexOf(value) === -1) return false;
					return true;
				}
			},
			option2: {
				value: undefined,
				setValue: function (value, $event) {
					this.value = value;
					if ($event) this.th = angular.element($event.target).closest("th");
					if (!this.th) return;
					this.th.find("button > i").remove();
					let button = this.th.find("button.value" + value);
					let newHtml = "<i class='fa fa-check' style='line-height:16px;width:20px'></i>" + button.html();
					button.html(newHtml);
				},
				clear: function ($event) {
					$scope.customFilter.option2.setValue(undefined, $event);
					if ($event) {
						$event.stopPropagation();
						$scope.datatable1.$ctrl.filterApply();
					}
				},
				apply: function (dataItem) {
					var value = $scope.customFilter.option2.value;
					if (!angular.isDefined(value)) return true;
					let address = (dataItem.deliveryCity + ' ' + dataItem.deliveryAddress).toLowerCase();
					if (value === 1) if (address.indexOf('road') === -1) return false;
					if (value === 2) if (address.indexOf('road') > -1) return false;
					return true;
				}
			}
		};
		$scope.datatable1 = {
			//method invoked from $ctrl.filterApply method
			itemCustomFilter: function (dataItem) {
				//here you can have more custom filters, each one tested for false value,
				// else will check the rest of filters
				if (!$scope.customFilter.option1.apply(dataItem)) return false;
				if (!$scope.customFilter.option2.apply(dataItem)) return false;
				return true;
			},
			//method invoked from $ctrl.clearAllFilters method
			itemCustomClear: function () {
				$scope.customFilter.option1.clear();
				$scope.customFilter.option2.clear();
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