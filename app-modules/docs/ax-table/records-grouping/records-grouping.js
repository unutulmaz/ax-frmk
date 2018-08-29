(function () {
    angular.module("App").controller("recordsGroupingCtrl", controller);
    controller.$inject = ['$scope'];

    function controller($scope) {
        $scope.code = {
            html:
                `<ax-groups>
    <ax-group expression="true">
        <ax-calculation column="Value" show-on="footer" aggregate-type="sum"></ax-calculation>
    </ax-group>
    <ax-group expression="dataItem.deliveryCountry" order-by="deliveryCountryInvariant" label="Country">
        <ax-calculation column="Value" show-on="footer" aggregate-type="sum"></ax-calculation>
    </ax-group>
    <ax-group expression="dataItem.deliveryCity.substring(0,1)" order-by="deliveryCityInvariant" label="City first letter">
        <ax-calculation column="Value" expression="dataItem.Value*1.19" show-on="footer" aggregate-type="sum"></ax-calculation>
    </ax-group>
</ax-groups>`,
            customDisplayCalc:
                `<span ng-bind="'Total: ' + datatable1.$ctrl.getCalculation(calculationName)"></span>`,
            headerDef:
                `<ax-group expression="dataItem.deliveryCountry" order-by="deliveryCountryInvariant" label="Country">
    <ax-group-header show-label="true"
        show-value="true"
        show-toggle-collapsed="true"
        show-filter="true"
        label="Country:"
        label-indent="0"
        background-color="#4267b2"
        show-counter="false">
    </ax-group-header>
</ax-group>`,
            headerFullRow:
                `<ax-group expression="dataItem.deliveryCountry" order-by="deliveryCountryInvariant" label="Country">
    <ax-group-header >
        <ax-group-display>
            <div ng-bind="dataItem.headerLabel + ':'" class="group-label"></div>
            <div ng-bind="dataItem.value" class="group-value"></div>
            <div ng-bind="dataItem.groupRecords" class="group-records-count"></div>
        </ax-group-display>
    </ax-group-header>
</ax-group>`,
            headerInGrouping:`<ax-group-header label="Country:">
    <ax-group-column
            column-for="Grouping"
            label-indent="0"
            show-value="true"
            show-label="true"
            show-counter="true"
            show-filter="true"
            show-toggle="true"></ax-group-column>
</ax-group-header>
`,
            footerDef:
                `<ax-group expression="dataItem.deliveryCountry" order-by="deliveryCountryInvariant" label="Country">
    <ax-group-footer 
        show-label="true"
        show-value="true"
        label="Country:"
        label-indent="200"
        background-color="#4267b2"
        show-counter="false">
    </ax-group-footer>
</ax-group>`,
            footerFullRow:
                `<ax-group expression="dataItem.deliveryCountry" order-by="deliveryCountryInvariant" label="Country">
    <ax-group-footer label="Total for country:">
        <ax-group-display label-indent="100">
            <div ng-bind="dataItem.footerLabel + ':'" class="group-label"></div>
            <div ng-bind="dataItem.value" class="group-value"></div>
        </ax-group-display>
    </ax-group-footer>
</ax-group>`,
            footerInGrouping:`<ax-group-footer label="Country:">
    <ax-group-column
            column-for="Grouping"
            label-indent="100"
            show-value="true"
            show-label="true">
    </ax-group-column>
</ax-group-footer>
`,
            allLevelsCalculations:
`<ax-groups>
    <ax-all-levels-calculations show-on="header">
        <ax-calculation column="Value" name="value-min" aggregate-type="min"></ax-calculation>
        <ax-calculation column="Value" name="value-max" aggregate-type="max"></ax-calculation>
        <ax-calculation column="Value" name="value-sum" aggregate-type="sum"></ax-calculation>
        <ax-calculation column="Value" expression="dataItem.Value*0.19" name="value-tva" aggregate-type="sum" display-label="tva"></ax-calculation>
    </ax-all-levels-calculations>
</ax-groups>`,
            calculationTemplate:
                `<ax-group expression="dataItem.deliveryCountry" order-by="deliveryCountryInvariant" label="Country" show-calculations-on="footer" >
    <ax-calculation column="Value" name="value-min" aggregate-type="min"></ax-calculation>
    <ax-calculation column="Value" name="value-max" aggregate-type="max"></ax-calculation>
    <ax-calculation column="Value" name="value-sum" aggregate-type="sum"></ax-calculation>
    <ax-calculation column="Value" expression="dataItem.Value*0.19" name="value-tva" aggregate-type="sum" display-label="tva"></ax-calculation>
</ax-group>`,
            customCalcCss:
`<style>
    .calculation-result.value-tva , 
    .calculation-result.value-min, 
    .calculation-result.value-max {
        width: 65px !important;
    }
    .calculation-result.value-sum{
        width:80px !important;
    }
    tr[level='0'] .calculation-result.value-sum,
    .calculation-result.value-value-with-taxes  {
        width: 100% !important;
    }
</style>`,
            customCalcResult:
                `<ax-group header-indent="0"
          expression="dataItem.deliveryCountry"
          order-by="deliveryCountry"
          hidden-columns="4"
          display-name="Country"
          footer-display-name="Total value for:">
    <ax-calculation column="Value" show-on="false" name="value-cnt" show-on="footer" aggregate-type="count"></ax-calculation>
    <ax-calculation column="Value" show-on="false" name="value-min" show-on="footer" aggregate-type="min"></ax-calculation>
    <ax-calculation column="Value" show-on="false" name="value-max" show-on="footer" aggregate-type="max"></ax-calculation>
    <ax-calculation column="Value" name="value-sum" show-on="footer" aggregate-type="sum">
        <ax-calculation-result style="width:100%;font-weight: normal;text-align: center;display: block">
            <div class="inline">
                Count:<span style="font-weight:bold;margin-right:5px;margin-left:3px" ng-bind="dataItem.calculations['value-cnt']"></span>
                Min:<span style="font-weight:bold;margin-right:5px;margin-left:3px" ng-bind="dataItem.calculations['value-min']"></span>
                Max:<span style="font-weight:bold;margin-right:5px;margin-left:3px" ng-bind="dataItem.calculations['value-max']"></span>
                Sum:<span style="font-weight:bold;margin-right:5px;margin-left:3px" ng-bind="dataItem.calculations['value-sum']"></span>
            </div>
        </ax-calculation-result>
    </ax-calculation>
</ax-group>`,
            customCalcHml:
                `<ax-group expression="true">
    <ax-calculation   show-on="false" 
                            name="employeesWithErrors"
                            initial-value="''"
                            aggregate-type="custom" 
                            aggregate-obj="$ctrl.$parent.customCalculation1"></ax-calculation>
</ax-group>`,
            customCalcJs:
                `$scope.customCalculation1 = {
    name: 'employeesWithErrors',
    initialValue: function() { return ''; },
    iteratorFn: function(dataItem, returnValue) {
        if (dataItem.RowCssClasses !== '' && dataItem.RowCssClasses !== null) {
            returnValue += (returnValue ? "," : "") + dataItem.EmployeeName;
        }
        return returnValue;
    },
    returnFn: function(returnValue) {
        returnValue = returnValue || 'No errors!';
        return returnValue;
    }
}`,
            customCalcDisplay:
                `<div ng-bind="customCalculation1.result()"></div>`
        };
    }
}());