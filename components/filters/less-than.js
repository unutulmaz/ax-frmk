(function() {
    angular.module("App").filter('lessThan', function() {
        return function(data, field, value) {
            var filtred = [];
            for (var i = 0; i < data.length; i++) {
                if (data[i][field] < value) filtred.push(data[i]);
            }
            return filtred;
        };
    });
}());
