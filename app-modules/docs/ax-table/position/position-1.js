(function () {
	angular.module("App").controller("PositionCtrl", controller);
	controller.$inject = ['$scope', "apiAction", "axDataAdapter"];

	function controller($scope, apiAction, $adapter) {
		//name setted in config attribute
		$scope.dataTable1 = {
			tableToggleMaximize() {
				//this is the original code. If is not suitable for you, you can change it.
				console.log("custom tableToggleMaximize method for datatable1");
				let $controller = this.$ctrl;
				$controller.maximized = !$controller.maximized;

				var element = $controller.getDomElement();
				if ($controller.$$grid) element = element.closest("ax-grid");
				if ($controller.maximized) {
					$controller.parentSyle = element.parent()[0].style.cssText;
					$controller.normalStyle = element[0].style.cssText;
					element.parent()[0].style.overflow = "hidden";
					element.parent().scrollTop(0);
					element.css({position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, 'z-index': 100, width: 'initial', height: 'initial', margin: 0});
				} else {
					element[0].style.cssText = $controller.normalStyle;
					element.parent()[0].style = $controller.parentSyle;
				}
				$controller.$layout.set.widthChanged();
			}
		};
		$scope.loadData = function (removeSpinner) {
			apiAction('api/data', 'data100.json', 'get', {}, "no", removeSpinner).then(function (response) {
				if (!response) return;
				if ($scope.dataTable1.$ctrl) $scope.dataTable1.$ctrl.dataLoaded = false;
				$scope.data = response.items;
				if (removeSpinner) removeSpinner();

			});
		};

		$scope.loadData();
	}
}());