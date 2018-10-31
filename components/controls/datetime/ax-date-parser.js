(function (angular) {
	app.directive('axDateParser', directive);
	directive.$inject = ["$window", "uibDateParser"];
	function directive($window, dateParser) {
		return {
			require: 'ngModel',
			link: function (scope, element, attrs, ngModel) {
				var moment = $window.moment;
				var dateFormat = attrs.uibDatepickerPopup;
				ngModel.$formatters.push(formatter);
				ngModel.$parsers.push(parser);
				if (!angular.isObject(ngModel.$modelValue)) ngModel.$modelValue = moment(ngModel.$modelValue);

				function parser(modelValue) {
					var momentValue = moment(modelValue, dateFormat, true);
                    var retValue = momentValue.toDate();
                    // var retValue = dateParser.convertTimezoneToLocal(momentValue.toDate(), "utc", false);
					//retValue = moment(retValue).format("YYYY-MM-DD");
					console.log("parser", modelValue, retValue);
					return retValue;
				}
				function formatter(viewValue) {
					var retValue;
					if (angular.isDefined(viewValue)) {
						var momentValue = moment(viewValue);
						//var valid = momentValue.isValid();
						//retValue = valid ? momentValue.utc().toDate(dateFormat) : undefined;
                        retValue = momentValue.toDate();
						// if (attrs.type === "date") retValue = dateParser.convertTimezoneToLocal(momentValue.toDate(), "utc", false);
						// else retValue = momentValue.toDate();


						//if (retValue != viewValue) {
						//	ngModel.$setValidity('date', true);
						//	ngModel.$setViewValue(retValue);
						//	//ngModel.$render();
						//}
					} else {
						retValue = undefined;
						ngModel.$setValidity('date', false);
					}
					console.log("formatter", viewValue, retValue);
					return retValue;
				}
			}
		};
	}

})(window.angular);