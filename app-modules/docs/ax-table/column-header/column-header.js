(function () {
	angular.module("App").controller("columnHeaderTabsCtrl", controller);
	controller.$inject = ['$scope'];

	function controller($scope) {
		$scope.code = {
			simple: `<ax-column bind-to="number" header="Order ID" width="100px"></ax-column>`,
			twoRows:
				`<ax-column bind-to="number" header="Order ID" width="100px">
		<ax-column-header row-index="1" colspan="2">Order</ax-column-header>
		<ax-column-header row-index="2">ID</ax-column-header>
</ax-column>`,
			threeRows:
				`<ax-column bind-to="number" sortable header="Order ID" width="150px" view-type="text" style="text-align:right;padding-right:10px">
	<ax-column-header row-index="1" colspan="4" header-title="Dynamic header1"><div ng-bind="$ctrl.$parent.customHeader('Superior')"></div></ax-column-header>
	<ax-column-header row-index="2" colspan="2" style="background-color: #7ed268"><div>Any html</div></ax-column-header>
	<ax-column-header row-index="3" header-title="Dynamic header2"><div ng-bind="$ctrl.$parent.customHeader('ID')"></div></ax-column-header>
</ax-column>`,
			groupDefine:
				`<ax-groups>
	<ax-group expression="true">
		<ax-calculation column="Value" 
                      show-on="false"
	                   name="sum-value"
				          aggregate-type="sum"></ax-calculation>
	</ax-group>
</ax-groups>`,
			insertCalc: `<ax-column-header row-index="2" rowspan="2" header-title="Dynamic header" >
	<span ng-bind="'Total: ' + $ctrl.getCalculation('sum-value').toLocaleString(axNumberFormat.locale)"></span>
</ax-column-header>`
		};
	}
}());