(function (angular) {
	app.directive('stringToDate', directive);
	directive.$inject = ["$window"];
	function directive($window) {
		return {
			require: 'ngModel',
			link: function (scope, element, attrs, ngModel) {
				var moment = $window.moment;
				var dateFormat = attrs.stringToDate;
				ngModel.$formatters.push(formatter);
				//ngModel.$parsers.push(parser);

				function parser(modelValue) {
					console.log("modelValue", modelValue);
					var momentValue = moment(modelValue, dateFormat, true);
					var valid = momentValue.isValid();
					var retValue = valid ? momentValue.format(dateFormat) : null;
					ngModel.$setValidity('datetime', true);
					return momentValue.toDate();
				}

				function formatter(viewValue) {
					var retValue;
					if (angular.isDefined(viewValue)) {
						var momentValue = moment(viewValue);
						retValue = momentValue.isValid() ? momentValue.toDate(dateFormat) : undefined;
					} else retValue = undefined;
					console.log("string-to-date", viewValue, retValue);
					return retValue;
				}
			}
		};
	}
	app.directive('localDate', ['$parse', function ($parse) {
		var directive = {
			restrict: 'A',
			require: ['ngModel'],
			link: link
		};
		return directive;

		function link(scope, element, attr, ctrls) {
			var ngModelController = ctrls[0];

			// called with a JavaScript Date object when picked from the datepicker
			ngModelController.$parsers.push(function (viewValue) {
				// undo the timezone adjustment we did during the formatting
				viewValue.setMinutes(viewValue.getMinutes() - viewValue.getTimezoneOffset());
				// we just want a local date in ISO format
				return viewValue.toISOString().substring(0, 10);
			});

			// called with a 'yyyy-mm-dd' string to format
			ngModelController.$formatters.push(function (modelValue) {
				if (!modelValue) {
					return undefined;
				}
				// date constructor will apply timezone deviations from UTC (i.e. if locale is behind UTC 'dt' will be one day behind)
				var dt = new Date(modelValue);
				// 'undo' the timezone offset again (so we end up on the original date again)
				dt.setMinutes(dt.getMinutes() + dt.getTimezoneOffset());
				return dt;
			});
		}
	}]);

})(window.angular);