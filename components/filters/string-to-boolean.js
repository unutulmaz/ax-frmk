(function (angular) {

    angular.module("App").directive('stringToBoolean', function () {
        return {
            require: 'ngModel',
            link: function (scope, element, attrs, ngModel) {
                ngModel.$parsers.push(function (value) {
                    return value? 1: 0;
                });
                ngModel.$formatters.push(function (value) {
                    if (!value) return false;
                    else if (angular.isNumber(value)) return value===1;
                    else return parseInt(value) === 1 || value.toLowerCase()=== 'true';
                });
            }
        };
    });
})(angular);
