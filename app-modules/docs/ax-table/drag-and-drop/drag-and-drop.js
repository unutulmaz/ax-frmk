(function () {
	angular.module("App").controller("dragAndDropCtrl", controller);
	controller.$inject = ['$scope', "apiAction", "axDataAdapter"];
	function controller($scope, apiAction, $adapter) {

        var itemMoved = function(event) {
            if (event.dest.sortableScope.element === event.source.sortableScope.element) return;
            var dataItem = event.source.itemScope.modelValue;
            var source =event.source.sortableScope.$parent.$ctrl;
            var dest = event.dest.sortableScope.$parent.$ctrl;
            source.dataItemRemove(dataItem);
            dest.dataItemAdd(dataItem);
        };
        $scope.asSortable1 = {
            accept: function (sourceItemHandleScope, destSortableScope) {
                return true;
            },
            itemMoved: itemMoved,
            orderChanged: function (event) {
                var ctrl = event.dest.sortableScope.element.scope().$ctrl;
                return true;
            },
            clone: false,
            allowDuplicates: false,
            isDisabled: function(){
                return false;
            }
        };
        $scope.asSortable2 = {
            itemMoved: itemMoved,
            isDisabled: function(){
                return false;
            }
        };


        $scope.loadData = function (removeSpinner) {
			// factory for quick access to a server action controller. return a promise and handle errors
			apiAction('api/data', 'data100.json', 'get', {}, "no", removeSpinner).then(function (response) {
				if (!response) return;
				$scope.asSortable1.data = response.items;
				if (removeSpinner) removeSpinner();

			});
		};

		$scope.loadData();
	}
}());