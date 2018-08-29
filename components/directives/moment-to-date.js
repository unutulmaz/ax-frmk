(function() {
    angular.module("App").directive('momentToDate', directive);
    directive.$inject = ["$window", "$parse"];
    function directive($window, $parse) {
        return {
            require: 'ngModel',
            link: function(scope, element, attrs, ngModel) {
                var moment = $window.moment;
                var dateFormat = attrs.momentToDate;
                ngModel.$formatters.push(formatter);
                ngModel.$parsers.push(parser);

                function parser(modelValue) {
                    var momentValue = moment(modelValue);
                    var valid = momentValue.isValid();
                    ngModel.$setValidity('datetime', valid);
                    var retValue = valid ? momentValue : modelValue;
                    return retValue;
                }

                function formatter(viewValue) {
                    var retValue;
                    if (angular.isDefined(viewValue)) {
                        var momentValue = moment(viewValue);
                        var valid = momentValue.isValid();
                        retValue = valid ? momentValue.toDate(dateFormat) : viewValue;

                    } else retValue = undefined;
                    //console.log("formatter", attrs.ngModel, viewValue, retValue);
                    return retValue;
                }

            }
        };
    }
}());