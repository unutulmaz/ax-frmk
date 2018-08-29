(function (angular) {

    angular.module("App").directive('stringToNumber', function () {
        return {
            require: 'ngModel',
            link: function (scope, element, attrs, ngModel) {
                ngModel.$parsers.push(function (value) {
                    if (value === null) return null;
                    else return '' + value;
                });
                ngModel.$formatters.push(function (value) {
                    if (!angular.isDefined(value)) return null;
                    else if (angular.isNumber(value)) return value;
                    else return parseFloat(value) ;
                });
            }
        };
    });
})(angular);
