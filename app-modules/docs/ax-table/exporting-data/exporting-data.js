(function () {
    angular.module("App").controller("exportingDataCtrl", controller);
    controller.$inject = ['$scope'];

    function controller($scope) {
        $scope.code = {
            html:
                `client-side: <ax-export file-name="Records grouping" export-type="client" data-value="view" api-controller="" view-template-limit="1001"></ax-export>
server-side: <ax-export file-name="Records grouping" export-type="server" api-controller="axTableController"></ax-export>`
        };
    }
}());