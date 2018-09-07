(function () {
	angular.module("App").controller("invoicesCodeCtrl", controller);
	controller.$inject = ['$scope', "axDataAdapter", "$timeout", "axDataSet", "axDataStore"];

	function controller($scope, $adapter, $timeout, dataSet, axDataStore) {
		$scope.dataStore = axDataStore;
		$scope.dataSet = dataSet;
		$scope.invoices = invoicesClass.dataTable($adapter, $scope);
		//$scope.invoices.dateFrom = "2017-01-11";
		$scope.invoices.dateTo = moment("2017-01-11 02:00:00").toDate();
		$scope.invoices.loadDataApiArgs = function () {
			let args = {limit: 100};
			// if ($scope.invoices.dateFrom) args.from = moment($scope.invoices.dateFrom).format("YYYY-MM-DD");
			// if ($scope.invoices.dateTo) args.to = moment($scope.invoices.dateTo).format("YYYY-MM-DD");
			return args;
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
			$scope.invoices,
			{
				id: "customerId",
				name: "customer",
				invariant: "customerInvariant"
			},
			"dataTable1",
			$timeout);
		$scope.delivery = {
			addressesEdit: {
				dataSet: dataSet,
				dataTable1: {
					loadDataApiArgs: function () {
						return {customerId: this.$ctrl.$parent.launcher.customer.id};
					},
					createCallback: function (dataItem) {
						dataItem.customerId = this.$ctrl.$parent.launcher.customer.id;
					}
				},
				getCitiesForCountry: function (datasource, countryId) {
					if (!datasource) return [];
					if (!countryId) return datasource;
					let filtered = datasource.filter(function (item) {
						return item.countryId === countryId;
					}, this);
					//console.log("cities for country ", dataItem, filtered);
					return filtered;
				},
				getDataItemCountry: function (dataItem) {
					if (!dataItem.countryId) return undefined;
					return {
						id: dataItem.countryId,
						name: dataItem.country,
						nameInvariant: dataItem.countryInvariant
					};
				},
				onOpen: function (params) {
					//get popup open-params declarared with getDataItemCustomer
					this.customer = params[1];
					this.invoice = params[2];
					let dataTableParent = $scope.invoices;
					if (dataTableParent.$ctrl.attrs.editRow === "editor") {
						this.currentItem = dataTableParent.$ctrl.$$grid.$$editor.form.$ctrl.datasource;
						this.readOnly = dataTableParent.$ctrl.$$grid.$$editor.form.$ctrl.readOnly;
					} else //this is for edit-row=inline or inline-cell
					{
						this.currentItem = dataTableParent.$ctrl.currentItem;
						this.readOnly = false;
					}
					this.initialSelection = this.invoice.deliveryAddressId;
					this.currentSelection = this.invoice.deliveryAddressId;
					this.openFinish = true;
				},
				saveChanged: function (selected) {
					this.invoice.deliveryAddressId = selected.id;
					this.invoice.deliveryCountryId = selected.countryId;
					this.invoice.deliveryCountry = selected.country;
					this.invoice.deliveryCountryInvariant = selected.countryInvariant;
					this.invoice.deliveryCityId = selected.cityId;
					this.invoice.deliveryCity = selected.city;
					this.invoice.deliveryCityInvariant = selected.cityInvariant;
					this.invoice.deliveryAddress = selected.address;
				},
				confirm: function () {
					$scope.dataSet.customersAddresses = this.dataTable1.$ctrl.datasource;
					let selected = this.dataTable1.$ctrl.currentItem;
					let self = this;
					if (selected.id === this.invoice.deliveryAddressId) {
						this.invoice.deliveryAddressId = -1;
						// for autocomplete refresh needed if changes are made inside the invoice delivery address
						$timeout(function () {
							self.saveChanged(selected);
						});
					} else this.saveChanged(selected);
					this.close();
				}
			},
			getDataItemCustomer: function (invoice) {
				return {
					id: invoice.customerId,
					name: invoice.customer,
					nameInvariant: invoice.customerInvariant
				};
			},
			getAddressesForCustomer: function (datasource, customerId) {
				// console.log("getDataItemCountry ", arguments);
				if (!datasource) return [];
				if (!customerId) return datasource;
				let filtered = datasource.filter(function (item) {
					return item.customerId === customerId;
				}, this);
				//console.log("cities for country ", dataItem, filtered);
				return filtered;
			},
			customerChanged(customer, dataItem) {
				if (customer) this.getSelectedAddress({}, dataItem);
			},
			getSelectedAddress: function (address, dataItem) {
				//console.log("Address", address, arguments);
				if (!address) return;
				dataItem.deliveryAddressId = address.id;
				dataItem.deliveryCountryId = address.countryId;
				dataItem.deliveryCountry = address.country;
				dataItem.deliveryCountryInvariant = address.countryInvariant;
				dataItem.deliveryCityId = address.cityId;
				dataItem.deliveryCity = address.city;
				dataItem.deliveryCityInvariant = address.cityInvariant;
				dataItem.deliveryAddress = address.address;
			}
		};
		$scope.delivery.addressesEdit.countriesEdit = countriesClass.popup(
			$adapter,
			{
				get: function () {
					return $scope.dataSet.countries;
				},
				set: function (datasource) {
					$scope.dataSet.countries = datasource;
				}
			},
			$scope.delivery.addressesEdit.dataTable1,
			{
				id: "countryId",
				name: "country",
				invariant: "countryInvariant"
			},
			"dataTable1",
			$timeout);
		$scope.delivery.addressesEdit.citiesEdit = citiesClass.popup(
			$adapter,
			{
				get: function () {
					return $scope.dataSet.cities;
				},
				set: function (datasource) {
					$scope.dataSet.cities = datasource;
				}
			},
			$scope.delivery.addressesEdit.dataTable1,
			{
				id: "cityId",
				name: "city",
				invariant: "cityInvariant"
			},
			"dataTable1",
			$timeout);
	}

	window.invoicesClass = {
		dataTable: function ($adapter, $scope) {
			return {
				dataAdapter: $adapter({
					conversions: {
						date: {
							type: "date",
							inputFormat: "YYYY-MM-DD"
						},
						createdAt: {
							type: "datetime",
							inputFormat: "YYYY-MM-DD HH:mm:ss", //format of string input value
						},

						number: {type: "integer"},
						value: {type: "float"},
						insideUE: {type: "boolean"}
					},
					extend: function () {
						this.supplierName = "Easy Software srl";
						this.supplierCountry = "Romania";
						this.deliveryCity = "Bucharest";
						this.supplierAddress = "3 Constantin Radulescu-Motru street";
					}
				}),
				isNewRecord(dataItem) {
					return !dataItem.id;
				},
				getMaxInvoiceNumber() {
					var data = this.$ctrl.getCollection("initial");
					var maxOrder = 0;
					data.each(function (item) {
						maxOrder = Math.max(maxOrder, item.number);
					}, this);
					return maxOrder;
				},
				createCallback: function (dataItem) {
					dataItem.number = this.getMaxInvoiceNumber() + 1;
					dataItem.date = new Date();
					dataItem.id = 0;
					return dataItem;
				},
				exportCfg: {
					item: {
						footerData: function (dataItem) {
							return {
								currierName: dataItem.createdBy,
								currierCI: "PH 034590",
								autoID: "B 293044",
								deliveryDate: dataItem.createdAt
							};
						},
						headerData: function (dataItem) {
							let url = window.origin + '/app-modules/show-case/assets/SiglaEasySoftware.png';
							//url = encodeURIComponent(url);
							// console.log("url", url);
							return {
								imageUrl: url
							};
						},
						formOutput: function (exportType, popup, dataItem) {
							//build your own: popup.html(myHtml) or change current output;
							if (exportType === "xls") {
								popup.find("ax-form>table>tbody>tr>td[column-index='0']").each(function (i, td) {
									if (td.getAttribute("role") === "label") return;
									if (td.getAttribute("colspan") === "2") td.setAttribute("colspan", 3);
									if (td.getAttribute("role") === "input") td.setAttribute("colspan", 2);
								});
								popup.find("ax-form td[column-index='0'] ax-form-section>table>tbody>tr>td[column-index='0']").each(function (i, td) {
									if (td.getAttribute("role") === "label") return;
									if (td.getAttribute("role") === "input") td.setAttribute("colspan", 2);
								});
							}
							//remove form total field from export output
							popup.find("ax-form td[control-for='value']").html("");
						},
						detailsOutput: function (exportType, table, detailName) {
							//table.find(">tbody>colgroup>col").each(function(i, col) {
							//    if (i === 0) col.style.width = "50px";
							//    if (i === 1) col.style.width = "130px";
							//    if (i === 2) col.style.width = "350px";
							//    if (i === 3) col.style.width = "100px";
							//    if (i === 4) col.style.width = "100px";
							//    if (i === 5) col.style.width = "100px";
							//    if (i === 6) col.style.width = "142pt";
							//    col.style["mso-width-source"] = "userset";
							//    //console.log("details col", col, i);
							//});

						}
					}
				},
				validateField(fieldName, dataItem) {
					let value = dataItem[fieldName];
					//console.log("field validation", fieldName, dataItem);
					switch (fieldName) {
						case "customerId":
						case "countryId":
						case "date":
						case "number":
							if (value === undefined || value === null || value === "") {
								//method to add error to column
								this.$ctrl.addFieldError(fieldName, "Field is required", dataItem);
								return false;
							}
							break;
						case "deliveryAddress":
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
				},
				details: {
					dataAdapter: $adapter({
						conversions: {
							position: {type: "integer"},
							productPrice: {type: "float"},
							quantity: {type: "float"},
							discount: {type: "float"},
							discountValue: {type: "float"}
						},
						extend: function (dataItem) {
							this.value = (this.quantity * this.productPrice).round(2);
						}
					}),
					createCallback: function (dataItem) {
						if (this.$ctrl.currentItem) {
							dataItem.discount = this.$ctrl.currentItem.discount;
						}
						let data = this.$ctrl.datasourceGet();
						var maxOrder = 0;
						data.each(function (item) {
							maxOrder = Math.max(maxOrder, item.position);
						}, this);
						dataItem.position = maxOrder + 1;
					},
					loadDataApiArgs: function () {
						return {invoiceId: this.$ctrl.parentItem && !this.$ctrl.parentItem.isGroupItem ? this.$ctrl.parentItem.id : 0};
					},
					updateInvoiceTotal: function () {

					},
					validateField(fieldName, dataItem) {
						let value = dataItem[fieldName];
						switch (fieldName) {
							case "productPrice":
							case "quantity":
							case "productId":
								//on loading total is getting from database, when editing needed to update value in form
								this.$ctrl.parentEditPopupCalculationUpdate([{calculation: "value", field: "value"}]);
								break;
						}
						return true;
					},
					deleteCallback: function () {
						this.$ctrl.parentEditPopupCalculationUpdate([{calculation: "value", field: "value"}]);
					},
					getProduct: function (selected, invoiceDetails) {
						if (!invoiceDetails) return;
						if (!selected) selected = {};
						invoiceDetails.productCode = selected.code;
						invoiceDetails.productName = selected.name;
						invoiceDetails.productCategory = selected.category;
						invoiceDetails.productUnit = selected.unit;
						invoiceDetails.productPrice = selected.price;
						invoiceDetails = this.dataAdapter.parseItem(invoiceDetails);
					}
				}
			};
		}
	};
}());