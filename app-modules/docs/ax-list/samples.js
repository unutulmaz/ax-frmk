(function () {
    angular.module("App").controller("datalistSamples", controller);
    controller.$inject = ['$scope', "apiAction"];

    function controller($scope, apiAction) {
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
					$scope.datatable2.$ctrl.datasourceSet($scope.datatable1.selected);}
        };

        $scope.loadData = function (removeSpinner) {
            // factory for quick access to a server action controller. return a promise and handle errors
            apiAction('api/data', 'getOrders.php', 'get', {limit: 100}, "no", removeSpinner).then(function (response) {
                if (!response) return;
                $scope.data = response.items;
                if (removeSpinner) removeSpinner();
            });
        };

        $scope.loadData();
    }

}());