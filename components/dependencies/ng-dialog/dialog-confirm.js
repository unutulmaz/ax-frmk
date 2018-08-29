(function() {
    angular.module("App").controller("dialogConfirmController", dialogConfirmController);
    dialogConfirmController.$inject = ['$scope', "axDataStore"];

    function dialogConfirmController($scope, dataStore) {
        $scope.confirm = function() {
            $scope.$parent.confirm();
        };
        $scope.cancel = function() {
            $scope.closeThisDialog();
        };
    }

}());