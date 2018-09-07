(function () {
	angular.module("App").controller("inlineEditingCtrl", controller);
	controller.$inject = ['$scope', "apiAction", "axDataAdapter", "axDataSet", "$timeout"];

	function controller($scope, apiAction, $adapter, dataSet, $timeout) {
		$scope.dataSet = dataSet;
		let adapter = $adapter({
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
			//create a new column in data collection, which can be sortable and filterable - this it's the most efficient and flexible way
			extend: function (dataItem) {
				this.customerFullAddress = (this.deliveryCity ? (this.deliveryCity.trim() + " - ") : "") + this.deliveryAddress;
			},
			invariant: ["customer", "deliveryCity", "deliveryCountry"]
		});

		$scope.datatable1 = {
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
					case "Value":
						return "input-number is disabled when checkbox is checked!";
				}
			},
			//custom method to retrive tooltip text for input controls (with tooltip attribute)
			getTooltipFor(fieldName) {
				switch (fieldName) {
					case "Value":
						return "Something usefull information in html <strong>format</strong>!";
				}
			},
			//this method decide when user press undo button, if remove item from collection (if isNewRecord() === true) or not (if isNewRecord() === false)
			isNewRecord(dataItem) {
				return dataItem.number === this.lastOrderId;
			},
			//this method create an empty object when user press Add button
			emptyItem: function () {
				var currentDataItem = this.currentItem;// this is current selected item, if exist
				var newOrderId = this.getMaxOrderID() + 1;
				this.lastOrderId = newOrderId;
				let newDate = new Date();
				return {number: newOrderId, "createdAt": new Date(), "date": newDate};
			},
			//method invoked on save dataItem
			validate(dataItem) {
				console.log("validate item", dataItem);
				if (!this.$ctrl.validateEachField(dataItem)) {
					// method to add a global error message which user can read from gutter column (first column)
				}
				this.$ctrl.addGlobalError("This is a test custom global error message!", "", dataItem);
				return false;
			},
			//method invoked on blur input control in column
			validateField(fieldName, dataItem) {
				let value = dataItem[fieldName];
				console.log("validate field", fieldName, value);
				switch (fieldName) {
					case "customerId":
						if (value === undefined || value === null || value === "") {
							//method to add error to column
						}
						this.$ctrl.addFieldError(fieldName, "Sample field error message: Field is required", dataItem);
						return false;
						break;
					case "Value":
						if (value === undefined || value === null || value === "") {
							//method to add error to column
							this.$ctrl.addFieldError(fieldName, "Field is required", dataItem);
							return false;
						}
						if (value > 1000000) {
							this.$ctrl.addFieldError(fieldName, "Value must be less then 5000", dataItem);
							return false;
						}
						break;
				}
				return true;
			}
		};
		$scope.customersEdit = customersClass.popup(
			$adapter,
			{
				get: function () {
					return $scope.dataSet.customers;
				},
				set: function (datasource) {
					$scope.dataSet.customers = datasource;
				}
			},
			$scope.datatable1,
			{
				id: "customerId",
				name: "customer",
				invariant: "customerInvariant"
			},
			"dataTable1",
			$timeout);

		$scope.loadData = function (removeSpinner) {
			apiAction('api/data', 'data100.json', 'get', {}, "no", removeSpinner).then(function (response) {
				if (!response) return;
				$scope.data = adapter.parseCollection(response.items);
				if (removeSpinner) removeSpinner();
			});
		};
		apiAction('customers', 'getList', 'get', {}, "no").then(function (response) {
			if (!response) return;
			$scope.dataSet.customers = response.data;
			$scope.dataSet.cities = response.cities;
			$scope.dataSet.countries = response.countries;
		});

		$scope.loadData();
	}
}());