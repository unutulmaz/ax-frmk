(function () {
	angular.module("App").controller("citiesCodeCtrl", controller);
	controller.$inject = ['$scope', "axDataAdapter", "$timeout", "axDataStore", "$element"];

	function controller($scope, $adapter, $timeout, axDataStore, $element) {
		$scope.dataStore = axDataStore;
		$scope.country = $scope.$parent.launcher ? $scope.$parent.launcher.dataItem : null;
		$scope.editingMode = $scope.$parent.launcher ? "popup" : ($scope.$parent.$ctrl && $scope.$parent.$ctrl.attributes && $scope.$parent.$ctrl.attributes.config.includes("$$editor.form") ? "editor" : "page");
		//console.log("editingMode", $scope.editingMode)
		if (!$scope.$parent.launcher) $scope.$parent.launcher = {openFinish: false};
		var dataTable1 = citiesClass.dataTable($adapter, $scope);
		angular.extend($scope.$parent.launcher,
			{
				showButtons: $scope.$parent.launcher.openFinish,
				dataTable1: dataTable1,
			});

		$scope.countriesEdit = countriesClass.popup(
			$adapter,
			{
				get: function () {
					return $scope.countries;
				},
				set: function (datasource) {
					$scope.countries = datasource;
				}
			},
			dataTable1,
			{
				id: "countryId",
				name: "country",
				invariant: "countryInvariant"
			},
			"dataTable1",
			$timeout);

		if ($scope.editingMode === "editor") {
			$scope.$parent.$ctrl.config.refreshFormCallback = function (dataItem) {
				$scope.country = dataItem;
				if (!dataTable1.$ctrl || !dataTable1.$ctrl.controllerLoaded) return; //because of ax-editor ng-if $scope.dataTable1.$ctrl is not existing yet and must wait until controlelr is fully loaded (2 digest cycles)
				//console.log("dataItem", dataItem);
				if (!dataItem) dataTable1.$ctrl.datasourceSet([]);
				else dataTable1.$ctrl.loadData();
			};
			// in this moment refreshForm it's already executed on initialization
			$scope.$parent.$ctrl.config.refreshFormCallback($scope.$parent.$ctrl.config.dataItem);
		}
	}

	window.citiesClass = {
		dataTable: function ($adapter, $scope) {
			return {
				dataAdapter: $adapter({
					invariant: ["name"]
				}),
				isNewRecord(dataItem) {
					return !dataItem.id;
				},
				itemCustomFilter: function (item) {
					return $scope.country ? $scope.country.id === item.countryId : true;

				},
				createCallback: function (dataItem) {
					let takeFrom = $scope.country ? $scope.country : this.currentItem ? this.currentItem : null;
					if (takeFrom) {
						dataItem.countryId = $scope.country ? takeFrom.id : takeFrom.countryId;
						dataItem.country = $scope.country ? takeFrom.name : takeFrom.country;
						dataItem.countryInvariant = $scope.country ? takeFrom.nameInvariant : takeFrom.countryInvariant;
					}
				},
				canAdd: function () {
					return $scope.editingMode === "page" ? true : $scope.country && $scope.country.id;
				},
				validateField(fieldName, dataItem) {
					let value = dataItem[fieldName];
					//console.log("field validation", fieldName, dataItem);
					switch (fieldName) {
						case "countryId":
							if (value === undefined || value === null || value === "") {
								//method to add error to column
								this.$ctrl.addFieldError(fieldName, "Field is required", dataItem);
								return false;
							}
							break;
						case "name":
							if (value === undefined || value === null || value === "") {
								//method to add error to column
								this.$ctrl.addFieldError(fieldName, "Field is required", dataItem);
								//console.log("field error", fieldName, dataItem);
								return false;
							}
							//cleaning is a string prototype method for trim() and replace " => '. " character is not allowed to be contained in strings
							dataItem[fieldName] = value.cleaning();
							break;
					}
					return true;
				}
			};
		},
		popup: function ($adapter, datasource, dataTableParent, destination, dataTableConfigName, $timeout) {
			return {
				showButtons: true,
				onOpen: function (params) {
					this.dataItem = params[1];
					//console.log("get cities for country", this.dataItem);
					// you can use link-popup, not only in editRow===editor, but also with inline and inline-cell edit-row]
					if (dataTableParent.$ctrl.attrs.editRow === "editor") {
						this.currentItem = dataTableParent.$ctrl.$$grid.$$editor.form.$ctrl.datasource;
						this.readOnly = dataTableParent.$ctrl.$$grid.$$editor.form.$ctrl.readOnly;
					} else //this is for edit-row=inline or inline-cell
					{
						this.currentItem = dataTableParent.$ctrl.currentItem;
						this.readOnly = false;
					}
					this.currentSelection = this.currentItem[destination.id];
					let popup = this;
					this.initialSelection = this.currentSelection;
					this.openFinish = true;
				},
				onClose: function () {
					//update countries dropdown datasource with changes, this can be done even when current record in parent table is not in editing mode.
					datasource.set(this[dataTableConfigName].$ctrl.datasource);
				},
				//this is enabled only in editing mode for parent table 
				confirm: function () {
					// depend on what you need you can take from catalog more than id property (name, invariant column, etc)
					// $timeout it's needed for wait to execute autocomplete wacth datasource;
					let currentItem = this[dataTableConfigName].$ctrl.currentItem;
					let self = this;
					$timeout(function () {
						//console.log("popup select", currentItem);
						self.currentItem[destination.id] = currentItem.id;
						if (destination.name) self.currentItem[destination.name] = currentItem.name;
						if (destination.invariant) self.currentItem[destination.invariant] = currentItem.nameInvariant;
					});
					this.close();
				}
			};
		}
	};
}());