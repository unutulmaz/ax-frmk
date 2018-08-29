(function () {
	angular.module("App").controller("toolbarSampleCtrl", controller);
	controller.$inject = ['$scope', "apiAction"];

	function controller($scope, apiAction) {
		$scope.datatable1 = {};
		$scope.loadDataPopup = {
			select: function (limit) {
				let button = angular.element(".load-data > .btn-spinner").removeClass("fa-refresh").addClass("fa-spinner fa-pulse fa-fw");
				var removeSpinner = function () {
					button.addClass("fa-refresh").removeClass("fa-spinner fa-pulse fa-fw");
				};
				$scope.loadData(limit, removeSpinner);
				this.close();
			}
		};
		$scope.loadData = function (limit, removeSpinner) {
			apiAction('api/data', "data"+limit+".json", 'get', {}, removeSpinner ? "no" : "", removeSpinner).then(function (response) {
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