(function () {
	angular.module("App").controller("customersCodeCtrl", controller);
	controller.$inject = ['$scope', "axDataAdapter", "$timeout", "axDataSet", "axDataStore"];

	function controller($scope, $adapter, $timeout, dataSet, axDataStore) {
		$scope.dataStore = axDataStore;
		if (!$scope.$parent.launcher) $scope.$parent.launcher = {openFinish: false};
		$scope.dataSet = dataSet;
		angular.extend($scope.$parent.launcher,
			{
				showButtons: $scope.$parent.launcher.openFinish,
				dataTable1: customersClass.dataTable($adapter, $scope),
			});
		$scope.editingMode = $scope.$parent.launcher ? "popup" : ($scope.$parent.$ctrl && $scope.$parent.$ctrl.attributes && $scope.$parent.$ctrl.attributes.config.includes("$$editor.form") ? "editor" : "page");
		$scope.countriesEdit = countriesClass.popup(
			$adapter,
			{
				get: function () {
					return $scope.dataSet.countries;
				},
				set: function (datasource) {
					$scope.dataSet.countries = datasource;
				}
			},
			$scope.$parent.launcher.dataTable1,
			{
				id: "countryId",
				name: "country",
				invariant: "countryInvariant"
			},
			"dataTable1",
			$timeout);
		$scope.getDataItemCountry = function (dataItem) {
			if (!dataItem.countryId) return undefined;
			return {
				id: dataItem.countryId,
				name: dataItem.country,
				nameInvariant: dataItem.countryInvariant
			};
		};
		$scope.getCitiesForCountry = function (datasource, countryId) {
			if (!datasource) return [];
			if (!countryId) return datasource;
			let filtered = datasource.filter(function (item) {
				return item.countryId === countryId;
			}, this);
			return filtered;
		};
		$scope.citiesEdit = citiesClass.popup(
			$adapter,
			{
				get: function () {
					return $scope.dataSet.cities;
				},
				set: function (datasource) {
					$scope.dataSet.cities = datasource;
				}
			},
			$scope.$parent.launcher.dataTable1,
			{
				id: "cityId",
				name: "city",
				invariant: "cityInvariant"
			},
			"dataTable1",
			$timeout);

	}

	window.customersClass = {
		dataTable: function ($adapter, $scope) {
			return {
				dataAdapter: $adapter({
					invariant: ["name", "country", "city"]
				}),
				isNewRecord(dataItem) {
					return !dataItem.id;
				},
				canAdd: function () {
					return true;
				},
				validateField(fieldName, dataItem) {
					let value = dataItem[fieldName];
					switch (fieldName) {
						case "name":
							if (value === undefined || value === null || value === "") {
								this.$ctrl.addFieldError(fieldName, "Field is required", dataItem);
								return false;
							} else dataItem[fieldName] = value.trim().toTitleCase();
							break;
					}
					return true;
				}
			};
		},
		popup: function ($adapter, datasource, dataTableParent, destination, dataTableConfigName, $timeout) {
			return {
				showButtons: true,
				onOpen: function () {
					// you can use link-popup, not only in editRow===editor, but also with inline and inline-cell edit-row]
					if (dataTableParent.$ctrl.attrs.editRow === "editor") {
						this.currentItem = dataTableParent.$ctrl.$$grid.$$editor.form.$ctrl.datasource;
						this.readOnly = dataTableParent.$ctrl.$$grid.$$editor.form.$ctrl.readOnly;
					} else //this is for edit-row=inline or inline-cell
					{
						this.currentItem = dataTableParent.$ctrl.currentItem;
						this.readOnly = false;
					}
					this.currentSelection = datasource.get().findObject(this.currentItem[destination.id], "id");
					let popup = this;
					this.initialSelection = angular.copy(this.currentSelection);
					this.openFinish = true;
				},
				onClose: function () {
					//update countries dropdown datasource with changes 
					datasource.set(this[dataTableConfigName].$ctrl.datasource);
				},
				confirm: function () {
					//update countries dropdown datasource with changes
					let currentItem = this[dataTableConfigName].$ctrl.currentItem;
					// depend on what you need you can take from catalog more than id property (name, invariant column, etc)
					// $timeout it's needed for wait to execute autocomplete wacth datasource;
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