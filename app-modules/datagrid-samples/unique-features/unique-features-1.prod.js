(function () {
	angular.module("App").controller("uniqueFeatures1Ctrl", controller);
	controller.$inject = ['$scope', "apiAction", "axDataAdapter", "axDataStore", "$stateParams", "$timeout", "axDataSet", "$element"];

	function controller($scope, apiAction, $adapter, dataStore, stateParams, $timeout, dataSet, $element) {
		let initialConfig = {
			json: {
				json: true,
				action: function (limit) {
					return "data" + limit + ".json";
				},
				adapter: {
					conversions: {
						date: {
							type: "date",
							inputFormat: "YYYY-MM-DDTHH:mm:ss.sssZ"
						},
						createdAt: {
							type: "datetime",
							inputFormat: "YYYY-MM-DDTHH:mm:ss.sssZ", //format of string input value
						},
						value: {type: "float"},
						number: {type: "integer"},
						insideUE: {type: "boolean"}
					},
					parsingCollection: true,
					invariant: ["customer", "deliveryCity", "deliveryCountry"]
				}
			}
		};
		let config = initialConfig.json;
		//creates an adapter for converting column data type from string to date, datetime, boolean, integer or float
		//creates columns for sorting and filtering without diacritics (accents) or non-alphanumeric characters
		var adapter = $adapter(config.adapter);
		$scope.timings = {
			onOpen: function () {
				this.msg = $scope.datatable1.timeStampLog;
				this.openFinish = true;
			}
		};
		//ax-table config object. With this object you can invoke all axTableController methods, or get properties
		$scope.datatable1 = {
			timeStamp: dataStore.timeStamp,
			//controller for countries edit popup
			getCitiesForCountry: function (datasource, countryId) {
				if (!datasource) return [];
				if (!countryId) return datasource;
				let filtered = datasource.filter(function (item) {
					return item.countryId === countryId;
				}, this);
				return filtered;
			},
			clearCity: function (country, dataItem) {
				if (!$scope.cities) return;
				let city = $scope.cities.findObject(dataItem.deliveryCityId, "id");
				if (city && country && country.id === city.countryId) return;
				dataItem.deliveryCityId = null;
				dataItem.deliveryCity = "";
				dataItem.deliveryCityInvariant = "";
			},
			loadDataPopup: {
				select: function (limit) {
					let button = angular.element(".load-data > .btn-spinner").removeClass("fa-refresh").addClass("fa-spinner fa-pulse fa-fw");
					var removeSpinner = function () {
						button.addClass("fa-refresh").removeClass("fa-spinner fa-pulse fa-fw");
					};
					$scope.loadData(limit, removeSpinner);
					this.close();
				}
			},
			loadData: function (limit) {
				let button = angular.element("[button-type=load-data] > .btn-spinner").removeClass("fa-refresh").addClass("fa-spinner fa-pulse fa-fw");
				var removeSpinner = function () {
					button.addClass("fa-refresh").removeClass("fa-spinner fa-pulse fa-fw");
				};
				$scope.loadData(limit);
			},
			dataAdapter: adapter,
			getMaxOrderID() {
				var data = this.$ctrl.getCollection("initial");
				var maxOrder = 0;
				for (let i = 0; i < data.length; i++) {
					maxOrder = Math.max(maxOrder, data[i].number);
				}
				return maxOrder;
			},
			customTooltipMethod(fieldName) {
				switch (fieldName) {
					case "value":
						return "Other method to define tooltip!";
				}
			},
			//custom method to retrieve tooltip text for input controls (with tooltip attribute)
			getTooltipFor(fieldName) {
				switch (fieldName) {
					case "value":
						return "Something useful information in html <strong>format</strong>!";
					case "deliveryCity":
						return `Customer Name, Delivery Country and Delivery City has 'invariant-field',<br> this mean a field with no accents which can be used for sort, filter or grouping.
<br>See <strong>Invariant data column</strong> topic for more info.`;
				}
			},
			//this method decides when user presses undo button, if it removes item from collection (if isNewRecord() === true) or not (if isNewRecord() === false)
			isNewRecord(dataItem) {
				return dataItem.number === this.lastOrderId;
			},
			//this method creates an empty object when user presses Add button
			emptyItem: function () {
				var currentDataItem = this.currentItem;// this is current selected item, if it exists
				var newOrderId = this.getMaxOrderID() + 1;
				this.lastOrderId = newOrderId;
				let newDate = new Date();
				return {number: newOrderId, "createdAt": new Date(), "date": newDate};
			},
			//method invoked on save dataItem if you want something custom 
			validate(dataItem) {
				// console.log("validate item", dataItem);
				if (!this.$ctrl.validateEachField(dataItem)) {
					// method to add a global error message which user can read from gutter column (first column)
					this.$ctrl.addGlobalError("This is custom global error message as html!<br>", "", dataItem);
					return false;
				} else this.$ctrl.addGlobalError("This is custom global error message as html!This grid doesn't save data!<br>", "", dataItem);
					return false;
			},
			//method invoked on blur input control in column
			validateField(fieldName, dataItem) {
				let value = dataItem[fieldName];
				// console.log("validate field", fieldName, value);
				switch (fieldName) {
					case "number":
					case "date":
					case "createdAt":
						if (value === undefined || value === null || value === "") {
							//method to add error to column
							this.$ctrl.addFieldError(fieldName, "Field is required", dataItem);
							return false;
						}
						break;
					case "deliveryCountryId":
						if (value === undefined || value === null || value === "") {
							//method to add error to column
							this.$ctrl.addFieldError(fieldName, "Field is required", dataItem);
							return false;
						}
						let country = $scope.countries.findObject(value, "id");
						dataItem.deliveryCountry = country.name;
						dataItem.deliveryCountryInvariant = country.nameInvariant;
						break;
					case "deliveryCityId":
						if (value === undefined || value === null || value === "") {
							//method to add error to column
							this.$ctrl.addFieldError(fieldName, "Field is required", dataItem);
							return false;
						}
						let city = $scope.cities.findObject(value, "id");
						dataItem.deliveryCity = city.name;
						dataItem.deliveryCityInvariant = city.nameInvariant;
						break;
					case "createdBy":
					case "customerCode":
					case "customerId":
						if (value === undefined || value === null || value === "") {
							//method to add error to column
							this.$ctrl.addFieldError(fieldName, "Field is required", dataItem);
							return false;
						}
						//trim strings and replace " with '
						dataItem[fieldName] = value.cleaning();
						break;
					case "value":
						if (value === undefined || value === null || value === "") {
							//method to add error to column
							this.$ctrl.addFieldError(fieldName, "Field is required", dataItem);
							return false;
						}
						break;
				}
				return true;
			}
		};
		$scope.dataStore = dataStore;
		$scope.loadData = function (limit, removeSpinner) {
			$scope.datatable1.timeStamp("clear");
			$scope.datatable1.timeStamp("start", 'datasource loaded');
			// if it's stored in cache take it, else loads from server
			if (config.json && dataSet["data" + limit])
				$timeout(function () {
					if ($scope.datatable1.$ctrl) $scope.datatable1.$ctrl.dataLoaded = false;
					if (dataSet["data" + limit].distinctValues) $scope.distinctValues = dataSet["data" + limit].distinctValues;
					$scope.datatable1.data = dataSet["data" + limit].items;
					if (removeSpinner) removeSpinner();
				});
			else
			// factory for quick access to a server action controller. returns a promise and handles errors
				apiAction('api/data', config.action(limit), 'get', false, removeSpinner ? "no" : "", removeSpinner).then(function (response) {
					if (!response) return;
					$scope.datatable1.timeStamp(false, 'datasource loaded', 'loaded data from backend');
					if ($scope.datatable1.$ctrl) $scope.datatable1.$ctrl.dataLoaded = false;
					dataSet["data" + limit] = response;
					if (response.distinctValues) $scope.distinctValues = response.distinctValues;
					$scope.datatable1.data = response.items;
					if (removeSpinner) removeSpinner();
					if (response.loader) response.loader.remove();
				});
		};
		$scope.loadData(100);
		$scope.$watch("datatable1.$ctrl", function (value) {
			if (!value) return;
			$scope.editRow = $scope.datatable1.$ctrl.attrs.editRow;
		});

		//retrieves cities data collection for dropdown-list control;
		apiAction('api/data', 'getCities.php', 'get', {}, "no").then(function (response) {
			if (!response) return;
			let adapter = $adapter({
				invariant: ["city"]
			});
			$scope.cities = adapter.parseCollection(response.items);

		});
		//retrieves countries data collection for dropdown-list control;
		apiAction('api/data', 'getCountries.php', 'get', {}, "no").then(function (response) {
			if (!response) return;
			$scope.countries = response.items;
			let adapter = $adapter({
				invariant: ["country"]
			});
			$scope.countries = adapter.parseCollection(response.items);

		});
		$element.on("$destroy", function () {
			// console.log("view controller destroy");
			// $scope.datatable1.data.length=0;
		});
	}
}());