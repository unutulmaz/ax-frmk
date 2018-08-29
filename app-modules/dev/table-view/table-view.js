(function() {
    angular.module("App").controller("tableViewController", controller);
    controller.$inject = ['$scope', "apiAction", "$timeout", "$filter"];

    function controller($scope, apiAction, $timeout, $filter) {
    	var axTableConfig = function() {

    		var config = {
    			defaultAttrs: {
    				customizableDataGrouping: true,
    				freezeColumnsEnabled: true,
    				customizableFreezedColumns: true,
    				hideFiltersRowEnabled: true,
    				columnsAutofitEnabled: true,
    			}

    		};
    		return config;
    	};

        apiAction('dev', 'GetObjectsAndColumns', 'get', {}).then(function(response) {
            if (!response) return;
            response.loader.remove();
            $scope.objects = response.data.items;
        });
        $scope.selectObject = {
            onClose: function() {
                if (this.table.config.table == this.selected) return;
                this.table.config.table = this.selected;
                $scope.getTableData(this.table);
            },
            onOpen: function(params) {
                var dropdown = this;
                this.table = params[1];
                this.selected = this.table.config.table;
                this.objects = $scope.objects;
                dropdown.openFinish = true;
            }
        };
        $scope.getTableData = function(table) {
            var tableName = table.config.table.name;
            apiAction('dev', 'getTableData', 'get', { tableName: tableName }).then(function(response) {
                if (!response) return;
                response.loader.remove();
                table.config.data = response.data.items;
                table.$template.element.initial.find('export').attr('file-name', tableName);
                var datasource = table.attrs.config + ".data";
                table.$template.createDynamicColumns(table,datasource, response.data.items);
            });
        };

    }
}());