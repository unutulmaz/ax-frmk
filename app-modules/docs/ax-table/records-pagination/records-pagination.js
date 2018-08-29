(function () {
    angular.module("App").controller("recordsPaginationCtrl", controller);
    controller.$inject = ['$scope', "apiAction", "$timeout"];

    function controller($scope, apiAction, $timeout) {
        $scope.paginationType = 'client side';
        let paginationType = $scope.paginationType;
        //change paginate ax-table attribute programmatically
        $scope.changePaginationType = function ($event) {
            if (paginationType === $scope.paginationType) return;
            let ctrl = $scope.datatable1.$ctrl;
            let reload = false;
            switch ($scope.paginationType) {
                case "no pagination":
                    if (ctrl.totalRecords.initial() > 100) {
                        ctrl.datasourceSet([]);
                        ctrl.dataLoaded = false;
                        reload = true;
                    }
                    ctrl.setAttribute("paginate", false);
                    ctrl.setAttribute("page-size", "", true);
                    if (reload) ;
                    $timeout(function () {
                        $scope.loadData(100);
                    });

                    break;
                case "client side":
                    ctrl.setAttribute("paginate", "client");
                    ctrl.setAttribute("page-size", "50", true);
                    break;
                case "virtual scroll":
                    ctrl.setAttribute("paginate", "client");
                    ctrl.setAttribute("page-size", "all", true);
                    break;
            }
            paginationType = $scope.paginationType;
        };

        $scope.loadData = function (limit, removeSpinner) {
            // factory for quick access to a server action controller. return a promise and handle errors
            apiAction('api/data', 'data100.json', 'get', {}, "no", removeSpinner).then(function (response) {
                if (!response) return;
                $scope.data = response.items;
                if (removeSpinner) removeSpinner();

            });
        };

        $scope.loadData(100);
    }
}());