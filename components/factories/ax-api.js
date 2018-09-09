(function () {
	angular.module("App").factory("axApi", factory);
	factory.$inject = ["$http", "notify", "axDataStore", 'axApiConfig', "$location"];

	function factory($http, notify, dataStore, axApiConfig,$location) {
		// console.log("base? " ,$location.$$absUrl, $location);
		return function (config) {
			var api = {
				config: {
					defaultLoaderSelector: "#right-pane",
					notAuthorizedCallback: null,
					serviceFailedCallback: null,
					webroot: "",
					prefix: "",
					suffix: "",
					controller: "",
					actions: {
						new: { url: "new", method: "get" },
						edit: { url: "", method: "get" },
						create: { url: "", method: "post" },
						update: { url: "", method: "put" },
						delete: { url: "", method: "delete" },
						getList: { url: "", method: "get" }
					},
					messages: {
						serviceFailed: "Internal server error.",
						errorStatus: {
							'-1': "Data service failed! Server is down!"
						}
					}
				},
				$notify: notify,
				$http: $http,
				setConfig: function (config) {
					angular.extend(this.config, config);
					if (config.getUrl) this.getUrl = config.getUrl;
				},
				getUrl: function (action, id) {
					var url = (this.config.webroot ? this.config.webroot + "/" : "")// jshint ignore:line
						+ (this.config.prefix ? this.config.prefix + "/" : "")// jshint ignore:line
						+ (this.config.controller ? this.config.controller : "")// jshint ignore:line
						+ (this.config.actions[action].url ? '/' + this.config.actions[action].url : '')// jshint ignore:line
						+ (id ? '/' + id.toString() : '')// jshint ignore:line
						+ (this.config.suffix ? this.config.suffix : '');// jshint ignore:line
					return url;
				},
				getCustomActionUrl: function (action, id, endAction) {
					var url = (this.config.webroot ? this.config.webroot + "/" : "")// jshint ignore:line
						+ (this.config.prefix ? this.config.prefix + "/" : "")// jshint ignore:line
						+ (this.config.controller ? this.config.controller : "")// jshint ignore:line
						+ (action ? '/' + action : '')// jshint ignore:line
						+ (id ? '/' + id.toString() : '')// jshint ignore:line
						+ (endAction ? '/' + endAction : '')// jshint ignore:line
						+ (this.config.suffix ? this.config.suffix : '');// jshint ignore:line
					return url;
				},
				getListAction: function (apiArgs, loaderSelector) {
					return this[this.config.actions.getList.method](this.getUrl('getList'), apiArgs || {}, loaderSelector, apiArgs.removeSpinner);
				},
				editAction: function (id, apiArgs, loaderSelector) {
					if (id === undefined || id === null) throw 'No Id value provided for $dataConnector edit action';
					return this[this.config.actions.edit.method](this.getUrl('edit', id), apiArgs, loaderSelector);
				},
				saveAction: function (item, apiArgs, loaderSelector) {
					var id = item[this.config.idField];
					apiArgs = apiArgs || {};
					item = this.sanitize(item, apiArgs.$$permitted_params || []);
					var args = {
						item: item,
						extraArgs: apiArgs
					};
					return (this.isNewRecord(id)) ? this.createAction(args, loaderSelector) : this.updateAction(id, args, loaderSelector);
				},
				newAction: function (apiArgs, loaderSelector) {
					return this[this.config.actions.new.method](this.getUrl('new'), apiArgs, loaderSelector);
				},
				createAction: function (apiArgs, loaderSelector) {
					return this[this.config.actions.create.method](this.getUrl('create'), apiArgs, loaderSelector);
				},
				updateAction: function (id, apiArgs, loaderSelector) {
					return this[this.config.actions.update.method](this.getUrl('update', id), apiArgs, loaderSelector);
				},
				deleteAction: function (id, apiArgs, loaderSelector) {
					return this[this.config.actions.delete.method](this.getUrl('delete', id), apiArgs, loaderSelector);
				},
				action: function (action, method, apiArgs, loaderSelector) {
					return this[method](this.getCustomActionUrl(action), apiArgs, loaderSelector);
				},
				getLoader: function (loaderSelector) {
					if (loaderSelector === "no") return { remove: angular.noop };
					else return dataStore.loader(loaderSelector || this.config.defaultLoaderSelector);
				},
				serviceFailed: function (error) {
					console.error("Api error", error);
					if (error && error.status == 401 && this.config.notAuthorizedCallback) this.config.notAuthorizedCallback();
					else if (this.config.serviceFailedCallback) this.config.serviceFailedCallback(error);
					else {
						let message = api.config.messages.serviceFailed;
						if (error && error.status && this.config.messages.errorStatus[error.status.toString()]) message = this.config.messages.errorStatus[error.status.toString()];
						else if (error && error.statusText) message = error.statusText + (angular.isString(error.data1)?("<br>"+error.data):"");
						else if (error && error.message) message = error.message;
						else if (angular.isString(error)) message = error;
						if (error.status !== 200) notify.error(message, { timeOut: 0, width: "600px" });
					}
					return error.data;
				},
				sanitize: function (data, permitted_params) {
					var item = angular.copy(data);
					if (permitted_params && permitted_params.length > 0) {
						for (let attr in item) {
							if (item.hasOwnProperty(attr)) {
								if (permitted_params.indexOf(attr) === -1) delete item[attr];
							}
						}
						delete item.$$permitted_params;
					} else {
						delete item.$$uid;
						delete item.__proto__; // jshint ignore:line
					}
					return item;
				},
				isNewRecord: function (id) {
					if (angular.isObject(id)) id = id[this.config.idField];
					if (id === null || id === "" || id === 0 || id === undefined) return true;
					else return false;
				},
				get: function (url, params, loaderSelector, removeSpinner) {
					var loader = !removeSpinner ? this.getLoader(loaderSelector) : null;
					if (this.config.httpConfig) params = angular.extend(this.config.httpConfig, params);
					return $http.get(url, { params: params } || {}).then(function (response) {
						if (angular.isString(response.data)) throw response.data;
						response.data.loader = loader;
						if (response.data.status) {
							return response.data;
						} else throw response;

					}).catch(function (response) {
						if (removeSpinner) removeSpinner();
						if (loader) loader.remove();
						return api.serviceFailed(response);
					});
				},
				post: function (url, params, loaderSelector, config) {
					var loader = this.getLoader(loaderSelector);
					if (this.config.httpConfig) params = angular.extend(this.config.httpConfig, params);
					return $http.post(url, params || {}, config
					).then(function (response) {
						if (loaderSelector !== 'no') response.data.loader = loader;
						return response.data;
					}).catch(function (response) {
						loader.remove();
						return api.serviceFailed(response);
					});
				},
				put: function (url, params, loaderSelector) {
					var loader = this.getLoader(loaderSelector);
					if (this.config.httpConfig) params = angular.extend(this.config.httpConfig, params);
					return $http.put(url, params || {}).then(function (response) {
						response.data.loader = loader;
						return response.data;
					}).catch(function (response) {
						loader.remove();
						return api.serviceFailed(response);
					});
				},
				'delete': function (url, params, loaderSelector) {
					var loader = this.getLoader(loaderSelector);
					if (this.config.httpConfig) params = angular.extend(this.config.httpConfig, params);
					return $http.delete(url, params || {}).then(function (response) {
						response.data.loader = loader;
						return response.data;
					}).catch(function (response) {
						loader.remove();
						return api.serviceFailed(response);
					});
				}

			};
			if (axApiConfig) api.setConfig(new axApiConfig());
			if (config) api.setConfig(config);
			return api;
		};
	}

	angular.module("App")
		.factory('apiAction',
		["axApi", function ($api) {
			return function (controller, action, method, apiArgs, loaderSelector) {
				var api = new $api({ controller: controller });
				return api.action(action, method, apiArgs, loaderSelector);
			};
		}]);
	angular.module("App")
		.factory('axApiAction',
		["axApi", function ($api) {
			return function (controller, action, method, apiArgs, loaderSelector) {
				var api = new $api({ controller: controller });
				return api.action(action, method, apiArgs, loaderSelector);
			};
		}]);
}());
