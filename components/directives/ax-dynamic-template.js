(function () {
	/**
	 * Angular directive for injecting html code anywhere
	 */
	let axDynamicTemplate = function ($compile) {
		return {
			restrict: 'A',
			replace: true,
			link: function (scope, element, attrs) {
				let attrName = this.name;
				let attrScope = attrName + "Scope";
				scope.$watch(attrs[attrName], function (htmlReceived) {
					//var htmlToInject = axElement.compile(htmlReceived);
					var compileScope = attrs[attrScope] ? scope.$eval(attrs[attrScope]) : scope;
					// console.log("compile", attrs.axDynamicTemplateUrl);
					element.html(htmlReceived || "");
					$compile(element.contents())(compileScope);
				});
			}
		};
	};
	angular.module("App").directive('bindHtmlCompile', ["$compile", axDynamicTemplate]);
	angular.module("App").directive('axDynamicTemplate', ["$compile", axDynamicTemplate]);
	angular.module("App").directive('axDynamicTemplateUrl', ["$compile", "templateFactory", function ($compile, templateFactory) {
		return {
			restrict: 'A',
			replace: true,
			link: function (scope, element, attrs) {
				var callBack = function (htmlReceived) {
					var compileScope = attrs.axDynamicTemplateScope ? scope.$eval(attrs.axDynamicTemplateScope) : scope;
					// console.log("compile", attrs.axDynamicTemplateUrl);
					element.html(htmlReceived || "");
					$compile(element.contents())(compileScope);
				};

				if (attrs.axDynamicTemplateUrl) {
					var url = scope.$eval(attrs.axDynamicTemplateUrl);
					// console.log("url", url);
					delete attrs.axDynamicTemplate;
					templateFactory.getTemplate(url).then(function (response) {
						callBack(response.data);
					});

				}
			}
		};
	}]);
}());