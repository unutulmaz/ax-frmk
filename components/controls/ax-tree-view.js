(function (window, angular) {
	angular.module('ax.components').component('axTreeView',
		{
			bindings: {
				datasource: '=',
				startExpanded: '&?',
				children: '@',
				config: '=?'
			},
			template: template,
			controller: controller
		});
	template.$inject = ["$element", "$attrs"];

	function template($element, $attrs) {
		if (!$attrs.children) throw "No children attribute set for ax-tree-view!";
		var template = $element.html().replaceAll("ax-tree-view-node-template", "ax-tree-view-node");
		var root = createElement("ax-tree-view-node", {
			node: "$ctrl.datasource",
			"config": "$ctrl.config",
			"children": $attrs.children,
			"is-root": "true",
			"start-expanded": "$ctrl.startExpanded()"
		}, template);
		root.nodeTemplate = template;
		return root;
	}
	controller.$inject = ["$scope", "$element", "$attrs", "$timeout", "$compile"];
	function controller($scope, $element, $attrs, $timeout, $compile) {
		$scope.$ctrl.nodeList = [];
		$scope.$ctrl.findNode = function (value, columnToSerach) {
			return $scope.$ctrl.nodeList.findObject(value, columnToSerach);
		};
		$scope.$ctrl.expandParents = function (node) {
			let parent = node.$parent;
			while (parent) {
				parent.showItems = true;
				parent = parent.$parent;
			}
		};
		$scope.$ctrl.addChildren = function (parent, child) {
			if (!parent[$attrs.children]) parent[$attrs.children] = [];
			parent[$attrs.children].push(child);
			childExtend(child, parent);
		};
		let childExtend = function (child, parent) {
			if (!child.hasOwnProperty("$ctrl")) {
				Object.defineProperty(child, "$ctrl", {
					get() { return $scope.$ctrl; }
				});//jshint ignore:line
			}
			child.$parent = parent;
			child.$level = parent.isRoot ? 0: parent.$level + 1 ;
			$scope.$ctrl.nodeList.push(child);
		};
		let scanChildren = function (children, parent) {
			if (!children) return;
			if (!angular.isArray(children)) console.error($attrs.children + " must be an array", children);
			else
				children.each(function (child, i) {
					childExtend(child, parent);
					scanChildren(child[$attrs.children], child);
				});
		};
		$scope.$watch("$ctrl.datasource", function (data) {
			//console.log("data", data);
			if (!data) return;
			scanChildren(data[$attrs.children], data);
			//console.log("nodelist", $scope.$ctrl.nodeList);
			data.$ctrl = $scope.$ctrl;
		});
	}
	angular.module('ax.components').directive('axTreeViewNode', ['axTVRecursiveDirectiveHelper', function treeViewNodeDirective(axTVRecursiveDirectiveHelper) {
		return {
			restrict: 'E',
			scope: {
				node: '=',
				children: '@',
				config: '=?',
				startExpanded: '&?'
			},
			compile: function treeViewNodeDirectiveCompile(elem) {
				return axTVRecursiveDirectiveHelper.compile(elem, this);
			},
			template: function ($element, $attrs) {
				var template, nodeTemplate;
				if ($element[0].nodeTemplate) {
					template = angular.element($element[0].nodeTemplate);
					nodeTemplate = template.find("ax-tree-view-node").html($element[0].nodeTemplate.replaceAll("ax-tree-view-node", "ax-tree-view-node-template"));
				} else {
					var html = $element.html().replaceAll("ax-tree-view-node-template", "ax-tree-view-node");
					template = angular.element(html);
					nodeTemplate = template.find("ax-tree-view-node").html(html.replaceAll("ax-tree-view-node", "ax-tree-view-node-template"));
				}
				if ($attrs.config) nodeTemplate.attr("config", "$parent.config");
				nodeTemplate.attr("children", "children");
				return template;
			},
			pre: function treeViewNodeDirectiveLink(scope, elem, attrs) {
				if (!scope.hasOwnProperty("parentScope"))
					Object.defineProperty(scope, "parentScope", {
						get() {
							return scope.$parent.parentScope ? scope.$parent.parentScope : scope.$parent.$parent;
						}
					});//jshint ignore:line
				//console.log("ctrl", scope.node.$ctrl.nodeList);
				// console.log("parent", scope.node.parent);
				// Set value's type as Class for CSS styling
				if (scope.config && scope.config.nodeInit) scope.config.nodeInit(scope);
				var children = scope.node ? scope.node[attrs.children] : [];
				// da dude
				//if (children && children.length > 0) {
				//	console.log("is expandable", scope.node);
				//	scope.isExpandable = true;
				//	// Add expandable class for CSS usage
				//	elem.addClass('expandable');
				//	// Setup preview text
				//	if (scope.startExpanded && scope.startExpanded()) {
				//		scope.shouldRender = true;
				//		elem.addClass('expanded');
				//	}
				//	//Setup isExpanded state handling
				//	scope.isExpanded = scope.startExpanded ? scope.startExpanded() : false;
				//	scope.toggleExpanded = function treeViewNodeDirectiveToggleExpanded() {
				//		scope.isExpanded = !scope.isExpanded;
				//		if (scope.isExpanded) {
				//			elem.addClass('expanded');
				//		} else {
				//			elem.removeClass('expanded');
				//		}
				//		// For delaying subnode render until requested
				//		scope.shouldRender = true;
				//	};
				//} else {
				//	console.log("not expandable", scope.node);
				//	scope.isExpandable = false;
				//	//Add expandable class for CSS usage
				//	elem.addClass('not-expandable');
				//}
				// console.log("node", scope.node, scope.isExpandable );
			}
		};
	}]);

	angular.module('ax.components')
		.factory('axTVRecursiveDirectiveHelper', ['$compile', function RecursiveDirectiveHelper($compile) {
			return {
				/**
				 * Manually compiles the element, fixing the recursion loop.
				 * @param element
				 * @param [link] A post-link function, or an object with function(s) registered via pre and post properties.
				 * @returns An object containing the linking functions.
				 */
				compile: function RecursiveDirectiveHelperCompile(element, link) {
					// Normalize the link parameter
					if (angular.isFunction(link)) {
						link = {
							post: link
						};
					}

					// Break the recursion loop by removing the contents
					var contents = element.contents().remove();
					var compiledContents;
					return {
						pre: (link && link.pre) ? link.pre : null,
						/**
						 * Compiles and re-adds the contents
						 */
						post: function RecursiveDirectiveHelperCompilePost(scope, element) {
							// Compile the contents
							if (!compiledContents) {
								compiledContents = $compile(contents);
							}
							// Re-add the compiled contents to the element
							compiledContents(scope, function (clone) {
								element.append(clone);
							});

							// Call the post-linking function, if any
							if (link && link.post) {
								link.post.apply(null, arguments);
							}
						}
					};
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

		// Iterate over an objects keyset
		forKeys: function forKeys(obj, f) {
			for (var key in obj) {
				if (obj.hasOwnProperty(key) && typeof obj[key] !== 'function') {
					if (f(key, obj[key])) {
						break;
					}
				}
			}
		}
	};
})(window, angular);

