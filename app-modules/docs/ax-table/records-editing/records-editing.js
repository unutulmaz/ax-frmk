(function () {
	angular.module("App").controller("recordsEditingCtrl", controller);
	controller.$inject = ['$scope'];

	function controller($scope) {
		$scope.code = {
			columnDef:
` <ax-column bind-to="deliveryCity" sortable="deliveryCityInvariant" header="Delivery City" width="250px">
    <ax-column-header row-index="1">Customer city</ax-column-header>
    <ax-column-header row-index="2">text with invariant</ax-column-header>
    <ax-column-filter-menu bind-to="deliveryCity" invariant-field="deliveryCityInvariant" data-type="string"></ax-column-filter-menu>
</ax-column>
`,
            js:
`var adapter = $adapter({
    invariant: ["deliveryCity"]
});

$scope.loadData = function (removeSpinner) {
    apiAction('api/data', 'getOrders.php', 'get', {limit: 3000}, "no", removeSpinner).then(function (response) {
        if (!response) return;
        $scope.data = adapter.parseCollection(response.items);
        if (removeSpinner) removeSpinner();

    });
};`
		};
	}
}());