(function () {
	angular.module("App").controller("columnEditorCtrl", controller);
	controller.$inject = ['$scope'];

	function controller($scope) {
		$scope.code = {
			buitInTemplate1:
				`<ax-column-editor colspan="2"
	style="width:100%;height:300px"
   ax-dynamic-template-url="'/app-modules/demo-app/catalogs/customers-details.html'">
</ax-column-editor>`,
			buitInTemplate2:
				`<ax-column-editor colspan="2" style="width:100%;height:300px">
   <div ng-controller="citiesCodeCtrl">
		<ax-table config="launcher.dataTable1"
				  order-by="nameInvariant"
				  item-id-field="id"
				  api-controller="cities"
				  apply-changes-on-save="false"
				  auto-focus="false"
				  customizable-freezed-columns="false"
				  customizable-config="false"
				  customizable-edit-mode="false"
				  columns-autofit-enabled="false"
				  style="left:0px;right:0px;top:0px;bottom:0px;">
		  <ax-column header="Country"
						 bind-to="countryId"
						 sortable="countryInvariant"
						 show-header="false"
						 hidden-column
						 width="300px">
		  </ax-column>
		  <ax-column header="City"
						 hideable="false"
						 bind-to="name"
						 show-header="false"
						 sortable="nameInvariant"
						 width="320px">
		  </ax-column>
		</ax-table>
	</div>
</ax-column-editor>`,
			custom:
				`<ax-column-edit type="custom" tooltip="$ctrl.customTooltipMethod('Value')" >
    <input type="number" class="form-control" has-input="true" style="width:100%"
       ng-focus="$ctrl.objectHasFocus($event, $parent.$parent.dataItem, 'Value');"
       ng-blur="$ctrl.$validateField('Value', $parent.$parent.dataItem) "
       ng-model="dataItem.Value">
</ax-column-edit>`,
			objectHasFocus: `objectHasFocus(event, dataItem, fieldName) {
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
			validateField: ` $validateField(fieldName, dataItem) {
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