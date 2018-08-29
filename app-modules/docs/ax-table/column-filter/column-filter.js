(function () {
	angular.module("App").controller("columnFilterTabsCtrl", controller);
	controller.$inject = ['$scope'];

	function controller($scope) {
		$scope.code = {
			simple:
`<ax-column bind-to="customer" sortable="customerInvariant" header="Customer Name" width="250px">
	<ax-column-filter filter-type="text" show-config="true"></ax-column-filter>
</ax-column>
<ax-column bind-to="user" header="User" width="250px">
	<ax-column-filter filter-type="dropdown-list-distinctvalues" selectable-rows="multiple"></ax-column-filter>
</ax-column>`,
			custom:
`<ax-column-filter filter-type="custom">
	<input type="text"
				ng-model="$ctrl.$parent.customFilter.value"
				role="column-filter"
				class="form-control "
				ng-change="$ctrl.filterApply()"
				ng-disabled="$ctrl.getCollection('initial').length==0"
				style="width: 100%;margin-right:25px" tabindex="0">
	</input>
	<button class="btn icon fa fa-eraser"
			  style="position: absolute;right:0;height:22px;line-height:22px"
			  ng-click="$ctrl.$parent.customFilter.clear($event)">
	</button>
</ax-column-filter>`,
			customJs:
`$scope.customFilter = {
	value: "",
	clear: function($event){
		$scope.customFilter.value = undefined;
		if ($event){
			$event.stopPropagation();
			$scope.datatable1.$ctrl.filterApply();
		}
	},
	apply: function (dataItem) {
		if (!angular.isDefined($scope.customFilter.value)) return true;
		let value = $scope.customFilter.value.toLowerCase();
		let address = (dataItem.deliveryCity + ' ' + dataItem.deliveryAddress).toLowerCase();
		if (address.indexOf(value) === -1) return false;
		return true;
	}
};
//ax-table config object
$scope.datatable1 = {
	//itemCustomFilter method is invoked from $ctrl.filterApply method if it's defined
	itemCustomFilter :function(dataItem){
		//here you can have more custom filters, each one tested for false value, 
		//else will check the rest of filters
		if (!$scope.customFilter.apply(dataItem)) return false;
		return true;
	},
	//itemCustomClear method is invoked from $ctrl.clearAllFilters method if it's defined
	itemCustomClear:function(){
		$scope.customFilter.clear();
	}
};`
		};
	}
}());