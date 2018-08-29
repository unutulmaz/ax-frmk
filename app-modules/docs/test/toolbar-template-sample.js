(function () {
	angular.module("App").controller("toolbarSample11Ctrl", controller);
	controller.$inject = ['$scope', "apiAction"];

	function controller($scope, apiAction) {
		$scope.datatable1 = {};
		$scope.loadData = function (limit, removeSpinner) {
			apiAction('api/data', "data" + limit + ".json", 'get', {limit: 100}, removeSpinner ? "no" : "", removeSpinner).then(function (response) {
				if (!response) return;
				if ($scope.datatable1.$ctrl) $scope.datatable1.$ctrl.dataLoaded = false;
				$scope.datatable1.data = response.items;
				if (removeSpinner) removeSpinner();
				if (response.loader) response.loader.remove();
			});
		};
		$scope.loadData(100);

	}
}());