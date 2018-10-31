(function (window, angular) {
	var module = angular.module('ax.components');
	module.directive('column', function () {
		return {
			template: template,
			scope: false
		}
	});
	template.$inject = ["$element"];

	function template($element) {

		$element.addCssText("display:flex;flex-direction:column");
	}

})(window, angular);