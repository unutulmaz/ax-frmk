(function () {
	angular.module("App").controller("dragAndDropTabsCtrl", controller);
	controller.$inject = ['$scope'];

	function controller($scope) {
		$scope.code = {
			html:
`<ax-groups>
    <ax-group expression="true">
        <ax-calculation column="Value" show-on="footer" aggregate-type="sum"></ax-calculation>
    </ax-group>
    <ax-group expression="dataItem.deliveryCountry" order="deliveryCountry" label="Country">
        <ax-calculation column="Value" show-on="footer" aggregate-type="sum"></ax-calculation>
    </ax-group>
    <ax-group expression="dataItem.deliveryCity" order="deliveryCity" label="Country">
        <ax-calculation column="Value" show-on="footer" aggregate-type="sum"></ax-calculation>
    </ax-group>
</ax-groups>`,
		};
	}
}());