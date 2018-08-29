(function () {
	angular.module("App").controller("testApiController", controller);
	controller.$inject = ['$scope', "apiAction", "axDataStore", "ngDialogOpen", "$localStorage"];

	function controller($scope, apiAction, dataStore, ngDialogOpen, storage) {
		var apiArgs = {
			roleId: dataStore.currentRole.RoleId,
			ouId: dataStore.currentRole.OuId,
		};
		$scope.form1 = {
			clear: function () {
				this.$ctrl.datasource = {
					controller: "coutries",
					action: "getList",
					method: "get",
					response: {},
					args: JSON.stringify(apiArgs)
				};
			},
			data: {
				controller: "countries",
				action: "getList",
				method: "get",
				response: {},
				args: JSON.stringify(apiArgs)
			}
		};
		$scope.tree = {
			nodeMaximize: function ($event, nodeKey, nodeValue) {
				$event.stopPropagation();
				this.currentNode = nodeValue;
				let template = angular.element(this.template);
				let newTemplate = createElement("ax-json-tree-view", {
					config: "options.scope.tree",
					object: "options.scope.tree.currentNode",
					"start-expanded": true,
					"root-name": "'" + nodeKey + "'"
				}, template.html());
				ngDialogOpen({ template: newTemplate.outerHTML + "<div class='ngdialog-close'></div>", plain: true, scope: $scope, className: "json-tree-maximize", appendTo: "#json-viewer" });

			},
			previewFormatter: function (scope) {
				var isArray = angular.isArray(scope.nodeValue);
				scope.preview = isArray ? '[ ' : '{';
				axUtils.forKeys(scope.nodeValue, function jsonNodeDirectiveLinkForKeys(key, value) {
					if (isArray) {
						scope.preview += "'" + value + "'" + ', ';
					} else {
						scope.preview += '<strong>' + key + '</strong>: ' + (value === "" ? '""' : value) + ', ';
					}
				});
				scope.preview = scope.preview.substring(0, scope.preview.length - (scope.preview.length > 2 ? 2 : 0)) + (isArray ? ' ]' : '}');
			}
		};
		$scope.run = function () {
			//storage.testApi = $scope.form1.data;
			if (storage.testApi) delete storage.testApi.response;
			var data = $scope.form1.data;
			var apiArgs = JSON.parse(data.args);
			$scope.form1.data.response = undefined;
			$scope.form1.data.html = undefined;
			apiAction(data.controller, data.action, data.method, apiArgs)
				.then(function (response) {
					console.log("raspuns server", response || "no response");
					if (!response) {
						$scope.form1.data.html = "no response";
						return;
					} else if (angular.isString(response)) {
						$scope.form1.data.html = response;
						return;
					} else if (response.loader) {
						response.loader.remove();
						delete response.loader;
					}
					$scope.form1.data.response = response;
				});
		};
	}
}());