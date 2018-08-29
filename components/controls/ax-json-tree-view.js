(function (window, angular) {
	angular.module('ax.components').component('axJsonTreeView',
		{
			bindings: {
				object: '=',
				startExpanded: '&?',
				rootName: '&?',
				config: '=?'
			},
			template: template
		});
	template.$inject = ["$element", "$attrs"];

	function template($element, $attrs) {
		let initial = $element[0].outerHTML;
		var template = $element.html().replaceAll("ax-json-tree-view-node-template", "ax-json-tree-view-node");
		var root = createElement("ax-json-tree-view-node", {
			"node-key": "$ctrl.rootName() || 'Object'",
			"node-value": "$ctrl.object",
			"config":"$ctrl.config",
			"start-expanded": "$ctrl.startExpanded()"
		}, template);
		root.nodeTemplate = template;
		root.initialTemplate = initial;
		return root;
	}

	angular.module('ax.components').directive('axJsonTreeViewNode', ['axTVRecursiveDirectiveHelper', function treeViewNodeDirective(axTVRecursiveDirectiveHelper) {
		return {
			restrict: 'E',
			scope: {
				nodeKey: '=',
				nodeValue: '=',
				config: '=?',
				startExpanded: '&?'
			},
			compile: function treeViewNodeDirectiveCompile(element) {
				return axTVRecursiveDirectiveHelper.compile(element, this);
			},
			template: function ($element, $attrs) {
				var template;
				if ($element[0].nodeTemplate) {
					template = angular.element($element[0].nodeTemplate);
					template.find("ax-json-tree-view-node").html($element[0].nodeTemplate.replaceAll("ax-json-tree-view-node", "ax-json-tree-view-node-template"));
				} else {
					var html = $element.html().replaceAll("ax-json-tree-view-node-template", "ax-json-tree-view-node");
					template = angular.element(html);
					template.find("ax-json-tree-view-node").html(html.replaceAll("ax-json-tree-view-node", "ax-json-tree-view-node-template"));
				}
				return template;
			},
			pre: function treeViewNodeDirectiveLink(scope, elem, attrs) {
				//Object.defineProperty(scope, "rootParent", {
				//	get() {
				//		return scope.$parent.$ctrl ? scope.$parent.$parent : scope.$parent.rootParent;
				//	}
				//});//jshint ignore:line

				// Set node-value's type as Class for CSS styling

				if (elem[0].initialTemplate && !scope.config.template) {
					elem.addClass('root-node');
					let template = elem[0].initialTemplate;
					Object.defineProperty(scope.config, "template", { get() { return template; } });
				}

				elem.addClass(utils.whatClass(scope.nodeValue).toLowerCase());
				elem.addClass((scope.nodeKey + "-node").toLowerCase());
				if (utils.is(scope.nodeValue, 'Object') || utils.is(scope.nodeValue, 'Array')) {
					scope.isExpandable = true;
					// Add expandable class for CSS usage
					elem.addClass('expandable');
					// Setup preview text
					if (scope.config && scope.config.previewFormatter) scope.config.previewFormatter(scope);
					if (scope.startExpanded && scope.startExpanded()) {
						scope.shouldRender = true;
						elem.addClass('expanded');
					}
					//Setup isExpanded state handling
					scope.isExpanded = scope.startExpanded ? scope.startExpanded() : false;
					scope.toggleExpanded = function treeViewNodeDirectiveToggleExpanded() {
						scope.isExpanded = !scope.isExpanded;
						if (scope.isExpanded) {
							elem.addClass('expanded');
						} else {
							elem.removeClass('expanded');
						}
						// For delaying subnode render until requested
						scope.shouldRender = true;
					};
				} else {
					scope.isExpandable = false;
					// Add expandable class for CSS usage
					elem.addClass('not-expandable');
				}
			}
		};
	}]);

	var utils = {
    /* See link for possible type values to check against.
     * http://stackoverflow.com/questions/4622952/json-object-containing-array
     *
     * Value               Class      Type
     * -------------------------------------
     * "foo"               String     string
     * new String("foo")   String     object
     * 1.2                 Number     number
     * new Number(1.2)     Number     object
     * true                Boolean    boolean
     * new Boolean(true)   Boolean    object
     * new Date()          Date       object
     * new Error()         Error      object
     * [1,2,3]             Array      object
     * new Array(1, 2, 3)  Array      object
     * new Function("")    Function   function
     * /abc/g              RegExp     object (function in Nitro/V8)
     * new RegExp("meow")  RegExp     object (function in Nitro/V8)
     * {}                  Object     object
     * new Object()        Object     object
     */
		is: function is(obj, clazz) {
			return Object.prototype.toString.call(obj).slice(8, -1) === clazz;
		},

		// See above for possible values
		whatClass: function whatClass(obj) {
			return Object.prototype.toString.call(obj).slice(8, -1);
		},
	};
})(window, angular);

