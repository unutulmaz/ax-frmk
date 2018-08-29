(function () {
	angular.module("App")
		.factory("templateFactory",
			["$templateCache", "$http", "$q", function ($templateCache, $http, $q) {
				return {
					getTemplate: function (templateUrl) {
						function getData(resp) {
							var deferred = $q.defer();
							if (true) {
								deferred.resolve({data: resp});
							} else {
								deferred.reject(resp);
							}
							return deferred.promise;
						}

						var APP_ENV = angular.element("#APP_ENV_CONSTANT").text().toUpperCase();
						var version = "v=" + applicationInfo.version;
						if (templateUrl.indexOf(version) === -1) templateUrl = axUtils.addVersion(templateUrl);
						if (APP_ENV !== undefined && APP_ENV == 'PRODUCTION') {
							var stripped_template = templateUrl.replace("src/", '');
							var resp = $templateCache.get(stripped_template);
							if (resp === undefined) {
								return $http.get(templateUrl);
							} else {
								return getData(resp);
							}
						} else {
							return $http.get(templateUrl);
						}
					}
				};
			}
			]);

}());