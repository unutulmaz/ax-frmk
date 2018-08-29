(function() {
    angular.module("App").filter('startFrom', filter);
    filter.$inject = [];
    function filter() {
        return function(input, start) {
            if (!input) return [];
            start = +start;
            return input.slice(start);
        };
    }

}());
