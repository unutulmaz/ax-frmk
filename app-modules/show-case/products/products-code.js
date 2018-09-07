(function () {
	angular.module("App").controller("productsCodeCtrl", controller);
	controller.$inject = ['$scope', "axDataAdapter", "$timeout", "axDataStore"];

	function controller($scope, $adapter, $timeout, axDataStore) {
		$scope.dataStore = axDataStore;
		$scope.category = $scope.$parent.launcher ? $scope.$parent.launcher.dataItem : null;
		$scope.editingMode = $scope.$parent.launcher ? "popup" : ($scope.$parent.$ctrl && $scope.$parent.$ctrl.attributes && $scope.$parent.$ctrl.attributes.config.includes("$$editor.form") ? "editor" : "page");
		if (!$scope.$parent.launcher) $scope.$parent.launcher = {openFinish: false};
		var dataTable1 = productsClass.dataTable($adapter, $scope);
		angular.extend($scope.$parent.launcher,
			{
				showButtons: $scope.$parent.launcher.openFinish,
				dataTable1: dataTable1,
			});

		$scope.productsCategoriesEdit = productsCategoriesClass.popup(
			$adapter,
			{
				get: function () {
					return $scope.productsCategories;
				},
				set: function (datasource) {
					$scope.productsCategories = datasource;
				}
			},
			dataTable1,
			{
				id: "categoryId",
				name: "category",
				invariant: "categoryInvariant"
			},
			"dataTable1",
			$timeout);

		if ($scope.editingMode === "editor") {
			$scope.$parent.$ctrl.config.refreshFormCallback = function (dataItem) {
				$scope.category = dataItem;
				if (!dataTable1.$ctrl) return; //becuase of ng-if $scope.dataTable1.$ctrl is not existing yet
				if (!dataItem) dataTable1.$ctrl.datasourceSet([]);
				else dataTable1.$ctrl.loadData();
			};
			// in this moment refreshForm it's already executed on initialization
			$scope.$parent.$ctrl.config.refreshFormCallback($scope.$parent.$ctrl.config.dataItem);
		}
	}

	window.productsClass = {
		dataTable: function ($adapter, $scope) {
			return {
				dataAdapter: $adapter({
					conversions: {
						price: {type: "float"}
					},
					invariant: ["name"]
				}),
				isNewRecord(dataItem) {
					return !dataItem.id;
				},
				itemCustomFilter: function (item) {
					return $scope.category ? $scope.category.id === item.categoryId : true;
				},
				createCallback: function (dataItem) {
					let takeFrom = $scope.category ? $scope.category : this.currentItem ? this.currentItem : null;
					if (takeFrom) {
						dataItem.categoryId = $scope.category ? takeFrom.id : takeFrom.categoryId;
						dataItem.category = $scope.category ? takeFrom.name : takeFrom.category;
						dataItem.categoryInvariant = $scope.category ? takeFrom.nameInvariant : takeFrom.categoryInvariant;
						if (this.currentItem) dataItem.unit = this.currentItem.unit;
					}
				},
				canAdd: function () {
					return $scope.editingMode === "page" ? true : $scope.category && $scope.category.id;
				},
				validateField(fieldName, dataItem) {
					let value = dataItem[fieldName];
					//console.log("field validation", fieldName, dataItem);
					switch (fieldName) {
						case "categoryId":
							if (value === undefined || value === null || value === "") {
								//method to add error to column
								this.$ctrl.addFieldError(fieldName, "Field is required", dataItem);
								return false;
							}
							break;
						case "price":
							if (value === undefined || value === null || value === "") {
								//method to add error to column
								this.$ctrl.addFieldError(fieldName, "Field is required", dataItem);
								return false;
							}
							break;
						case "unit":
						case "name":
							if (value === undefined || value === null || value === "") {
								//method to add error to column
								this.$ctrl.addFieldError(fieldName, "Field is required", dataItem);
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
					//update categories dropdown datasource with changes, this can be done even when current record in parent ax-table is not in editing mode.
					datasource.set(this[dataTableConfigName].$ctrl.datasource);
				},
				//this is enabled only in editing mode for parent ax-table 
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