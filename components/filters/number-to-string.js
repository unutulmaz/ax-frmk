(function (angular) {

    angular.module("App").directive('numberToString', function () {
        return {
            require: 'ngModel',
            link: function (scope, element, attrs, ngModel) {
                ngModel.$parsers.push(function (value) {
                    return value;
                });
                ngModel.$formatters.push(function (value) {
                    return '' + value;
                });
            }
        };
    });
})(angular);
