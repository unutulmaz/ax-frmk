(function () {
	angular.module("App").controller("columnFilterMenuTabsCtrl", controller);
	controller.$inject = ['$scope'];

	function controller($scope) {
		$scope.code = {
			simple:
`<ax-column bind-to="value" filter-menu="number" header="Value" width="140px" ></ax-column>
<ax-column bind-to="value" header="Value" width="140px" >
    <ax-column-filter-menu data-type="number"></ax-column-filter-menu>
</ax-column>
`,
            filterMenuDefs:
`filters: {
            menu: function (element) {
                var type = element.getAttribute("data-type");
                var defaultMenu = this.menus[type];
                if (!defaultMenu) return element;
                else return defaultMenu(element);
            },
            multiselectDistinctValues(menu) {
                createElement("ax-column-filter", {
                    type: "dropdown-list-distinctvalues",
                    "selectable-rows": "multiple",
                    "label": "Multiselect from distinct values"
                }, "", menu);
            },
            inputValue(menu, type, showInPopup, popupWidth) {
                createElement("ax-column-filter", {
                    type: type,
                    "show-config": "true",
                    showInPopup: showInPopup? "true": "false",
                    popupWidth: popupWidth?popupWidth+"px":"",
                    "label": "Filter by input value"
                }, "", menu);
            },
            menus: {
                string: function (menu) {
                    if (menu.innerHTML.trim() !== "") return menu;
                    config.filters.multiselectDistinctValues(menu);
                    config.filters.inputValue(menu, "text");
                    return menu;
                },
                text: function (menu) {
                    return config.filters.menus.string(menu);
                },
                boolean: function (menu) {
                    if (menu.innerHTML.trim() !== "") return menu;
                    if (!menu.hasAttribute("convert-type")) menu.setAttribute("convert-type", "boolean");
                    config.filters.multiselectDistinctValues(menu);
                    return menu;
                },
                number: function (menu) {
                    if (menu.innerHTML.trim() !== "") return menu;
                    config.filters.multiselectDistinctValues(menu);
                    config.filters.inputValue(menu, "number", true, 280);
                    return menu;
                },
                date: function (menu) {
                    if (menu.innerHTML.trim() !== "") return menu;
                    if (!menu.hasAttribute("convert-type")) menu.setAttribute("convert-type", "date");
                    if (!menu.hasAttribute("convert-input-format")) menu.setAttribute("convert-input-format", "yyyy-MM-ddThh:mm:ss");
                    if (!menu.hasAttribute("convert-display-format")) menu.setAttribute("convert-display-format", axDateFormat);
                    config.filters.multiselectDistinctValues(menu);
                    config.filters.inputValue(menu, "date", true);
                    return menu;
                },
                datetime: function (menu) {
                    if (menu.innerHTML.trim() !== "") return menu;
                    if (!menu.hasAttribute("convert-type")) menu.setAttribute("convert-type", "datetime");
                    if (!menu.hasAttribute("convert-input-format")) menu.setAttribute("convert-input-format", "yyyy-MM-ddThh:mm:ss");
                    if (!menu.hasAttribute("convert-display-format")) menu.setAttribute("convert-display-format", axDateTimeFormat);
                    config.filters.multiselectDistinctValues(menu);
                    config.filters.inputValue(menu, "datetime", true);
                    return menu;
                }
            }
        }`,
			customHtml:
`<ax-column-filter-menu data-type="custom">
    <ax-column-filter filter-type="custom" label="Option2">
        <button role="column-filter"
                class="form-control btn"
                placeholder="option filter 2"
                ng-click="$ctrl.$parent.customFilter.option2.setValue(1);$ctrl.filterApply()"
                ng-disabled="$ctrl.getCollection('initial').length==0"
                style="width: 100%;margin-right:10px;background-color: lightseagreen;" tabindex="0">
            Has word Road
        </button>
        <button role="column-filter"
                class="form-control btn"
                placeholder="option filter 2"
                ng-click="$ctrl.$parent.customFilter.option2.setValue(2);$ctrl.filterApply()"
                ng-disabled="$ctrl.getCollection('initial').length==0"
                style="width: 100%;margin-right:25px;background-color: lightsalmon;" tabindex="0">
            Something Else
        </button>
        <button class="btn icon fa fa-eraser"
                style="position: absolute;right:0;height:22px;line-height:22px"
                ng-click="$ctrl.$parent.customFilter.option2.clear($event)"></button>
    </ax-column-filter>
    <ax-column-filter filter-type="custom" label="Option1">
        <input type="text"
               ng-model="$ctrl.$parent.customFilter.option1.value"
               role="column-filter"
               class="form-control"
               placeholder="option filter 1"
               ng-change="$ctrl.filterApply()"
               ng-disabled="$ctrl.getCollection('initial').length==0"
               style="width: 100%;margin-right:25px" tabindex="0">
        </input>
        <button class="btn icon fa fa-eraser"
                style="position: absolute;right:0;height:22px;line-height:22px"
                ng-click="$ctrl.$parent.customFilter.option1.clear($event)"></button>
    </ax-column-filter>
</ax-column-filter-menu>`,
			customJs:
`$scope.customFilter = {
    option1: {
        value: "",
        clear: function ($event) {
            $scope.customFilter.option1.value = undefined;
            if ($event) {
                $event.stopPropagation();
                $scope.datatable1.$ctrl.filterApply();
            }
        },
        apply: function (dataItem) {
            if (!angular.isDefined($scope.customFilter.option1.value)) return true;
            let value = $scope.customFilter.option1.value.toLowerCase();
            let address = (dataItem.deliveryCity + ' ' + dataItem.deliveryAddress).toLowerCase();
            if (address.indexOf(value) === -1) return false;
            return true;
        }
    },
    option2: {
        value: undefined,
        setValue: function (value) {
            this.value = value;
        },
        clear: function ($event) {
            $scope.customFilter.option2.setValue(undefined);
            if ($event) {
                $event.stopPropagation();
                $scope.datatable1.$ctrl.filterApply();
            }
        },
        apply: function (dataItem) {
            var value = $scope.customFilter.option2.value;
            if (!angular.isDefined(value)) return true;
            let address = (dataItem.deliveryCity + ' ' + dataItem.deliveryAddress).toLowerCase();
            if (value === 1) if (address.indexOf('road') === -1) return false;
            if (value === 2) if (address.indexOf('road') > -1) return false;
            return true;
        }
    }
}
;
$scope.datatable1 = {
    //method invoked from $ctrl.filterApply method
    itemCustomFilter: function (dataItem) {
        //here you can have more custom filters, each one tested for false value,
        // else will check the rest of filters
        if (!$scope.customFilter.option1.apply(dataItem)) return false;
        if (!$scope.customFilter.option2.apply(dataItem)) return false;
        return true;
    },
    //method invoked from $ctrl.clearAllFilters method
    itemCustomClear: function () {
        $scope.customFilter.option1.clear();
        $scope.customFilter.option2.clear();
    }
};`
		};
	}
}());