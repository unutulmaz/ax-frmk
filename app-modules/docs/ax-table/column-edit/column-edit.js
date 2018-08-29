(function () {
    angular.module("App").controller("columnEditCtrl", controller);
    controller.$inject = ['$scope'];

    function controller($scope) {
        $scope.code = {
            buitInTemplate1:
                `<ax-column bind-to="insideUE" header="Inside UE" width="100px" view-type="boolean-checkbox" edit-type="checkbox"></ax-column>`,
            buitInTemplate2:
                `<ax-column bind-to="value" header="Value" width="100px" view-type="number">
    <ax-column-edit type="dropdown-list"
        datasource="$ctrl.$parent.cities"
        item-id-field="city"
        show-search="true"
        ng-disabled="dataItem.insideUE" 
        tooltip="Something helpful information for user!"></ax-column-edit>
</ax-column>`,
            custom:
                `<ax-column-edit type="custom" tooltip="$ctrl.customTooltipMethod('Value')" >
    <input type="number" class="form-control" has-input="true" style="width:100%"
       ng-focus="$ctrl.objectHasFocus($event, $parent.$parent.dataItem, 'Value');"
       ng-blur="$ctrl.$validateField('Value', $parent.$parent.dataItem) "
       ng-model="dataItem.Value">
</ax-column-edit>`,
            objectHasFocus:`objectHasFocus(event, dataItem, fieldName) {
    if (!event) return;
        let currentTd = angular.element(event.target).closest("td");
        this.currentColumnIndex = currentTd.attr('tabindex');
        this.currentTrElement = angular.element(event.target).closest("tr");
        if (!this.getClone(dataItem)) this.createClone(dataItem);
        this.currentField = fieldName;
        angular.element(event.target).closest("table").find('.form-control.hasFocus').removeClass("hasFocus");
        angular.element(event.target).closest(".form-control").addClass("hasFocus");
        if (currentTd.hasClass("has-error")) {
            this.$timeout(function () {
                currentTd.find("[error-for]").trigger("mouseenter");
            });
        }
}`,
			  validateField:` $validateField(fieldName, dataItem) {
    //clear precedent field error
    this.clearFieldError(dataItem, fieldName);
    // if your backend provide metadata information about columns - is used for columns validation
    if (this.columns && this.columns[fieldName]) {
        var attribs = this.columns[fieldName].attribs;
        var errorMessage;
        if ("Required" in attribs && (dataItem[fieldName] === null || dataItem[fieldName] === ""))
            errorMessage = fieldName + " field is required.";
        if ("MaxLength" in attribs && dataItem[fieldName] && dataItem[fieldName].length > attribs.MaxLength)
            errorMessage = fieldName + " field must have a maximum length of '" + attribs.MaxLength + "'.";
        if ("MinLength" in attribs && dataItem[fieldName] && dataItem[fieldName].length < attribs.MinLength)
            errorMessage = fieldName + " field must have a minimum length of '" + attribs.MinLength + "'.";
        if (errorMessage) {
            this.$ctrl.addFieldError(fieldName, errorMessage, dataItem);
            return true;
        }
    }
    var returnValue = true;
    //invoked custom validateField method
    if (angular.isFunction(this.validateField)) returnValue = this.validateField(dataItem, fieldName);
    //if dataAdapter exist, dataAdapter.parseItem method is invoked
    if (this.dataAdapter && returnValue) this.dataAdapter.parseItem(dataItem);
    return returnValue;
}`
        };
    }
}());