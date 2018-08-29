(function () {
	angular.module("App").controller("customersDetailsCtrl", customersDetailsCtrl);
	customersDetailsCtrl.$inject = ['$scope', "axDataAdapter", "apiAction", "axDataSet", "$timeout"];

	function customersDetailsCtrl($scope, $adapter, apiAction, dataSet, $timeout) {
		var extendApiArgs = function () {
			if ($scope.customer.id === 0) return {};
			else return {customerId: $scope.customer.id};
		};
		var createCallback = function (dataItem) {
			let takeFrom = $scope.customer ? $scope.customer : this.currentItem ? this.currentItem : null;
			if (takeFrom) {
				dataItem.customerId = $scope.customer ? takeFrom.id : takeFrom.customerId;
				dataItem.customer = $scope.customer ? takeFrom.name : takeFrom.customer;
				dataItem.customerInvariant = $scope.customer ? takeFrom.nameInvariant : takeFrom.customerInvariant;
			}
		};
		var createCtrl = function ($scope) {
			return {
				loadDataApiArgs: extendApiArgs,
				createCallback: createCallback,
				canAdd: function () {
					return this.$ctrl.$parent.$parent.customer && this.$ctrl.$parent.$parent.customer.id > 0;
				}
			};
		};
		$scope.dataSet = dataSet;
		$scope.phones = createCtrl($scope);
		$scope.emails = createCtrl($scope);
		$scope.accounts = createCtrl($scope);
		$scope.addresses = createCtrl($scope);
		//console.log("load controller", $scope.$id)
		//details are shown in editor
		if ($scope.$parent.$ctrl.$validateForm) {
			$scope.$watch("$parent.$ctrl.datasource", function (customer) {
				$scope.customer = customer;
				if (customer && customer.id)
					apiAction('customers', 'getItemDetails', 'post', {item: customer}, "no").then(function (response) {
						if (!response || !$scope.phones.$ctrl) return;
						$scope.phones.$ctrl.datasourceSet(response.data.phones);
						$scope.emails.$ctrl.datasourceSet(response.data.emails);
						$scope.accounts.$ctrl.datasourceSet(response.data.accounts);
						$scope.addresses.$ctrl.datasourceSet(response.data.addresses);

					});
				else {
					if ($scope.phones.$ctrl.controllerLoaded) $scope.phones.$ctrl.datasourceSet([]);
					if ($scope.emails.$ctrl.controllerLoaded) $scope.emails.$ctrl.datasourceSet([]);
					if ($scope.accounts.$ctrl.controllerLoaded) $scope.accounts.$ctrl.datasourceSet([]);
					if ($scope.addresses.$ctrl.controllerLoaded) $scope.addresses.$ctrl.datasourceSet([]);
				}
			});
			var parent = $scope.$parent.$ctrl.dataTable ? $scope.$parent.$ctrl : $scope.$parent.$ctrl.$parent.$parent.$parent;
			let editor = $scope.$parent.$parent.$parent.grid.$$editor;
			editor.form.refreshFormCallback = function () {
				if (!$scope.getCitiesForCountry) {
					$scope.getCitiesForCountry = parent.$parent.getCitiesForCountry;
					$scope.getDataItemCountry = parent.$parent.getDataItemCountry;
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
						$scope.addresses,
						{
							id: "countryId",
							name: "country",
							invariant: "countryInvariant"
						},
						"dataTable1",
						$timeout);

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
						$scope.addresses,
						{
							id: "cityId",
							name: "city",
							invariant: "cityInvariant"
						},
						"dataTable1",
						$timeout);
				}
				if ($scope.phones.$ctrl) $scope.phones.$ctrl.inlineEditing = false;
				if ($scope.emails.$ctrl) $scope.emails.$ctrl.inlineEditing = false;
				if ($scope.accounts.$ctrl) $scope.accounts.$ctrl.inlineEditing = false;
				if ($scope.addresses.$ctrl) $scope.addresses.$ctrl.inlineEditing = false;
			};
			editor.form.refreshFormCallback();
		} else if ($scope.$parent.launcher) { //details are shown in popup
			$scope.customer = $scope.$parent.popup.openParams[1];
			$scope.serverResponse = null;
			apiAction('customers', 'getItemDetails', 'post', {item: $scope.customer}, "no").then(function (response) {
				if (!response) return;
				$scope.serverResponse = response.data;
			});
			$scope.$watch(function () {
				return $scope.serverResponse
					&& $scope.phones.$ctrl //jshint ignore:line
					&& $scope.emails.$ctrl //jshint ignore:line
					&& $scope.accounts.$ctrl //jshint ignore:line
					&& $scope.addresses.$ctrl //jshint ignore:line
			}, function (value) {
				if (!value) return;
				$scope.phones.$ctrl.datasourceSet($scope.serverResponse.phones);
				$scope.emails.$ctrl.datasourceSet($scope.serverResponse.emails);
				$scope.accounts.$ctrl.datasourceSet($scope.serverResponse.accounts);
				$scope.addresses.$ctrl.datasourceSet($scope.serverResponse.addresses);
			});
			let parent = $scope.launcher.$parent.$ctrl;
			$scope.getCitiesForCountry = parent.$parent.getCitiesForCountry;
			$scope.getDataItemCountry = parent.$parent.getDataItemCountry;
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
				$scope.addresses,
				{
					id: "countryId",
					name: "country",
					invariant: "countryInvariant"
				},
				"dataTable1",
				$timeout);

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
				$scope.addresses,
				{
					id: "cityId",
					name: "city",
					invariant: "cityInvariant"
				},
				"dataTable1",
				$timeout);
		}
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