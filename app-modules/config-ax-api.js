const API_TYPE = "php";
console.warn("ax-api-config API_TYPE:", API_TYPE);

(function () {
	angular.module("App").factory("axApiConfig", factory);
	factory.$inject = ["authService"];

	function factory(authService) {
		return function () {
			var config = {
				defaultLoaderSelector: "#right-pane",
				notAuthorizedCallback: function () {
					authService.goLogin();
				},
				serviceFailedCallback: null,
				webroot: "",
				prefix: "",
				suffix: "",
				controller: "",
				getUrl: function (action, id) {
					var url = (this.config.webroot ? this.config.webroot + "/" : "")// jshint ignore:line
						+ (this.config.prefix ? this.config.prefix + "/" : "")// jshint ignore:line
						+ (this.config.controller ? this.config.controller : "")// jshint ignore:line
						+ (this.config.actions[action].url ? '/' + this.config.actions[action].url : '')// jshint ignore:line
						+ (id ? '?id=' + id.toString() : '')// jshint ignore:line
						+ (this.config.suffix ? this.config.suffix : '');// jshint ignore:line
					return url;
				},
				actions: {
					new: {url: "new", method: "get"},
					edit: {url: "getItem", method: "get"},
					create: {url: "create", method: "post"},
					update: {url: "update", method: "post"},
					delete: {url: "delete", method: "get"},
					getList: {url: "getList", method: "get"}
				},
				messages: {
					serviceFailed: "Internal server error.",
					errorStatus: {
						'-1': "Data service failed! Server is down!"
					}
				}
			};
			return config;
		};
	}
}());
