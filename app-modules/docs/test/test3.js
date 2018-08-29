(function () {
	angular.module("App").controller("test3Ctrl", controller);
	controller.$inject = ['$scope', "apiAction", "axDataAdapter"];

	function controller($scope, apiAction, $adapter) {

		//$scope.loadData = function (limit, removeSpinner) {
		//	apiAction('api/data', 'getOrders.php', 'get', { limit: limit }, "no", removeSpinner).then(function (response) {
		//		if (!response) return;
		//		$scope.data = adapter.parseCollection(response.items);
		//		if (removeSpinner) removeSpinner();
		//	});
		//};
		//retrieve cities data collection for dropdown-list control;
		$scope.datatable1 = {
			_axGrid: "AAA",
			dataAdapter: $adapter({
				conversions: {
					date: {type: "date"},
					createdAt: {type: "datetime"},
					insideUE: {type: "boolean"}
				}
			}),
			getTooltipFor(fieldName) {
				switch (fieldName) {
					case "value":
						return "Something useful information in html <strong>format</strong>!";
					case "deliveryCity":
						return `Customer Name, Delivery Country and Delivery City has 'invariant-field',<br> this mean a field with no accents which can be used for sort, filter or grouping.
<br>See <strong>Invariant data column</strong> topic for more info.`;
				}
			},

			loadDataPopup: {
				select: function (limit) {
					let button = angular.element(".load-data > .btn-spinner").removeClass("fa-refresh").addClass("fa-spinner fa-pulse fa-fw");
					var removeSpinner = function () {
						button.addClass("fa-refresh").removeClass("fa-spinner fa-pulse fa-fw");
					};
					$scope.loadData(limit, removeSpinner);
					this.close();
				}
			},
		};

		//apiAction('api/data', 'getOrders.php', 'get', { limit: 100000 }, "no").then(function (response) {
		//	if (!response) return;
		//	console.log("data loaded")
		//	$scope.$watch("axGridConfig.$ctrl",
		//		/**
		//		 *@param {axTableController} ctrl
		//		*/function (ctrl) {
		//			if (!ctrl) return;

		//			ctrl.timeStamp(true, 'datasource loaded', 'loaded data from backend');
		//			$scope.invoices = response.items;
		//		})
		//});
		$scope.timings = {
			onOpen: function () {
				this.msg = $scope.datatable1.timeStampLog;
				this.openFinish = true;
			}
		};
		$scope.loadData = function (limit, removeSpinner) {
			let $ctrl = $scope.datatable1.$ctrl;
			$ctrl.timeStamp("clear");
			$ctrl.timeStamp("start", 'datasource loaded');
			apiAction('api/data', "data" + limit + ".json", 'get', {limit: limit}, removeSpinner ? "no" : "", removeSpinner).then(function (response) {
				if (!response) return;
				$ctrl.timeStamp(false, 'datasource loaded', 'loaded data from backend');
				$ctrl.dataLoaded = false;
				if (response.distinctValues) $scope.datatable1.distinctValues = response.distinctValues;
				$ctrl.datasourceSet(response.items);
				if (removeSpinner) removeSpinner();
				if (response.loader) response.loader.remove();
			});
		};
		$scope.$watch("datatable1.$ctrl", function (ctrl) {
			if (!ctrl) return;
			$scope.loadData(100);
		});
	}
}());
