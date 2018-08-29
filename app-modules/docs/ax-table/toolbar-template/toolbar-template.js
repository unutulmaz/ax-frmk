(function () {
	angular.module("App").controller("toolbarTemplateTabsCtrl", controller);
	controller.$inject = ['$scope'];

	function controller($scope) {
		$scope.code = {
			sample1: `<ax-toolbar ax-scroller="true" min-width="400px">
    <label class="header-title" toolbar="left">
        Overview
    </label>
    <div class="toolbar-container" toolbar="left">
    	<label>edit-row = {{$ctrl.attrs.editRow}} </label>
    </div>
    <ax-button button-type="refresh" style="width:120px" ng-click="$ctrl.$parent.loadData(100,removeSpinner)">
        100 records
    </ax-button>
    <ax-button button-type="refresh" style="width:120px" ng-click="$ctrl.$parent.loadData(1000,removeSpinner)">
        1k records
    </ax-button>
    <ax-button button-type="refresh" style="width:120px" ng-click="$ctrl.$parent.loadData(10000,removeSpinner)">
        10k records
    </ax-button>
    <ax-button button-type="refresh" style="width:120px" ng-click="$ctrl.$parent.loadData(100000,removeSpinner)">
        100k records
    </ax-button>
    <ax-button toolbar="right" button-type="export" ></ax-button>
    <ax-button toolbar="right" button-type="groups-toggle"></ax-button>
    <ax-button toolbar="right" button-type="settings"></ax-button>
</ax-toolbar>`
		};
	}
}());