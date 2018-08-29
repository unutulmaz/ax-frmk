(function () {
	angular.module("App").directive('axUrl', ["$sce", function ($sce) {
		return {
			restrict: 'A',
			replace: true,
			link: function (scope, element, attrs) {
				if (attrs.axUrl) {
					var url = $sce.trustAsResourceUrl(scope.$eval(attrs.axUrl));
					element.setAttribute(attrs.urlType, url);
				}
			}
		};
	}]);
}());