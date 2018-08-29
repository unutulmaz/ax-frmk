(function () {
    angular.module("App").controller("hidingColumnsSampleCtrl", controller);
    controller.$inject = ['$scope', "apiAction", "axDataAdapter"];

    function controller($scope, apiAction, $adapter) {
        var adapter = $adapter({
            conversions: {
                
                value: {type: "float"},
                number: {type: "integer"},
                insideUE: {type: "boolean"}
            },
            //create invariant columns (without accents, non alphanumeric characters) for ordering and filtering
            invariant: ["customer", "deliveryCity", "deliveryCountry"]
        });


		 $scope.hiddingColumns = {
            //method to hide conditionally some columns for user - user will not be able to see data from theses columns
            // method return an array with forbidden columns (header attribute)
            dataAdapter: adapter,
            forbiddenColumns: function () {
                if (true) return ["Created By"];
                return [];
            }
        };

        $scope.loadData = function (limit, removeSpinner) {
            apiAction('api/data', 'data100.json', 'get', {}, removeSpinner ? "no" : "", removeSpinner).then(function (response) {
					if (!response) return;
					console.log("data loaded", response.items.length);
                $scope.data = response.items;
                if (removeSpinner) removeSpinner();
                if (response.loader) response.loader.remove();
            });
        };
        $scope.loadData(100);
    }
}());