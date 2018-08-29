(function (angular) {
    angular.module("App").directive('errSrc', directive);
    directive.$inject = [];
    function directive() {
			return {
				link: function (scope, element, attrs) {
					var defaultSrc = attrs.src;
					element.bind('error', function () {
						if (attrs.errSrc) {
							element.attr('src', attrs.errSrc);
						}
						else if (attrs.src) {
							element.attr('src', defaultSrc);
						}
					});
				}
			};
    }
})(angular);