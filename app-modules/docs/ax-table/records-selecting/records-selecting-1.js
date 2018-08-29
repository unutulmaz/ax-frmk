(function () {
	angular.module("App").controller("recordsSelecting1Ctrl", controller);
	controller.$inject = ['$scope', "apiAction"];

	function controller($scope, apiAction) {
		$scope.selectionType = 'multiple';
		let selectionType = $scope.selectionType;
		// change selectable-rows ax-table attribute programmatically
		// datasource for datatable2 must be an array, for selectable-rows === single, selected model is object, so it's need to change datatable2 datasource
		$scope.changeSelectionType = function ($event) {
			if (selectionType === $scope.selectionType) return true;//avoid infinite loop
			selectionType = $scope.selectionType;
			if ($scope.selectionType === "single") $scope.datatable1.selected = null;
			else $scope.datatable1.selected = [];
			$scope.datatable1.$ctrl.selectRows(false);
			if ($scope.datatable2 && $scope.datatable2.$ctrl) $scope.datatable2.$ctrl.datasourceChanged();
			$scope.datatable1.$ctrl.setAttribute("selectable-rows", $scope.selectionType, true);
		};
		$scope.selectOnClick = true;
		let selectOnClick = $scope.selectOnClick;
		//change select-on-click-row ax-table attribute programmatically
		$scope.changeClickRow = function () {
			if (selectOnClick === $scope.selectOnClick) return; //avoid infinite loop
			selectOnClick = $scope.selectOnClick;
			$scope.datatable1.$ctrl.setAttribute("select-on-click-row", $scope.selectOnClick, true);
		};
		$scope.datatable1 = {
			selected: [],
			removeItem: function (dataItem, $event) {
				$event.stopPropagation();
				//trigger selectRow event for datatable1
				this.$ctrl.selectRow(dataItem, false, false);
				//trigger datasourceChanged event for datatable2
				$scope.datatable2.$ctrl.datasourceChanged();
			},
			onSelectionChange: function () {
				if ($scope.selectionType === "multiple") {
					//trigger datasourceChanged event for datatable2 to display new data
					$scope.datatable2.$ctrl.datasourceChanged();
				}
			}
		};

		$scope.loadData = function (removeSpinner) {
			// factory for quick access to a server action controller. return a promise and handle errors
			apiAction('api/data', 'data100.json', 'get', { }, "no", removeSpinner).then(function (response) {
				if (!response) return;
				$scope.data = response.items;
				if (removeSpinner) removeSpinner();
			});
		};

		$scope.loadData();
	}
}());