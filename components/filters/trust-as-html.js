(function() {

    angular.module("App").filter('trustAsHtml', ["$sce", function($sce) {
        return function(text) {
            return $sce.trustAsHtml(text);
        };
    }]);
}());

//Sample
// <div class="errors" role="form-error" ng-bind-html="settings.errors|trustAsHtml"></div>
