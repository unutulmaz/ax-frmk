(function() {
    angular.module("App").controller("dialogReportController", controller);
    controller.$inject = ['$scope', "axDataStore"];

    function controller($scope, dataStore) {
        $scope.confirm = function() {
            $scope.$parent.confirm();
        };
        $scope.cancel = function() {
            $scope.closeThisDialog();
        };
    }

}());