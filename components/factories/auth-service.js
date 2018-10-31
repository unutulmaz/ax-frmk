(function () {
	angular.module("App").factory('authService', authService);
	authService.$inject = ['$http', '$localStorage', '$state', 'axDataStore', 'notify', "axDataSet"];

	function authService($http, $storage, $state, dataStore, notify, dataSet) {
		function restorePreviousValues(response) {
			dataStore.leftPaneCollapsed = $storage.user ? $storage.user.leftPaneCollapsed : false;
			if (axAuthConfig.restorePreviousValues) axAuthConfig.restorePreviousValues(dataStore, $storage, response, dataSet);
		}

		var service = {};
		service = {
			login: function login(userInfo, callback) {
				$http.post(axAuthConfig.urls.login, JSON.stringify(userInfo))
					.then(function (response) {
						if (response.data.status) {
							service.routesLoaded = false;
							service.authenticate(response.data);
							service.goMain(service.user);
						}
						else {
							notify.error(response.data.errors);
						}
						if (callback) callback(response.data); // , service.user
					}, function (response) {
						console.error(response.data);
						notify.error(response.statusText || "Server is down!");
					});
			},
			resetPassword: function login(userInfo, callback) {
				$http.post(axAuthConfig.urls.resetPassword, {email: userInfo.email})
					.then(function (response) {
						if (response.data.status) {
							notify.success("An email was sent to your address with a link for reset password!");
						}
						else {
							notify.error(response.data.errors);
						}
						if (callback) callback(response.data); // , service.user
					}, function (response) {
						console.error(response);
						notify.error(response.statusText || "Server is down!");
					});
			},
			savePassword: function login(userInfo, callback) {
				$http.post(axAuthConfig.urls.savePassword, userInfo)
					.then(function (response) {
						if (response.data.status) {
							service.authenticate(response.data);
							service.goMain(service.user);
						}
						else {
							notify.error(response.data.errors);
						}
						if (callback) callback(response.data); // , service.user
					}, function (response) {
						console.error(response.data);
						notify.error(response.statusText || "Server is down!");
					});
			},
			logoff: function logoff(callback) {
				$http.post(axAuthConfig.urls.logoff)
					.then(function (response) {
						service.clear();
						callback(response.data);
					}, function (response) {
						notify.error(response.statusText || "Server is down!");
					});
			},

			authenticate: function authenticate(response) {
				//console.log("authenticating", $storage);
				$storage.isAuthenticated = true;
				if (!response.menus) console.error("Nu exista response.extra.menus in getUserInfo");
				dataStore.menus = response.menus;
				dataStore.currentRole = (dataStore.menus.length === 0) ? {RoleId: 0, RoleName: "No role"} : {RoleId: dataStore.menus[0].RoleId, RoleName: dataStore.menus[0].RoleName};
				restorePreviousValues(response);
				$storage.user = {
					info: response.data,
					currentRole: dataStore.currentRole,
					theme: applicationInfo.theme,
					leftPaneCollapsed: dataStore.leftPaneCollapsed,
					currentRoute: $storage.user ? $storage.user.currentRoute : ""
				};
				if (axAuthConfig.saveStorageUser) axAuthConfig.saveStorageUser($storage.user, dataStore);
				dataStore.setMenu(dataStore.currentRole);
				service.user = $storage.user;
				dataStore.user = service.user;
			},
			userLoaded: function userLoaded() {
				if (!dataStore.user && !dataStore.loadInProgress) return false;
				return dataStore.loadInProgress || ($storage.user && $storage.user.info && $storage.user.info.UserName);
			},
			clear: function clear() {
				$storage.isAuthenticated = false;
				delete $storage.user;
				if (axAuthConfig.logoff) axAuthConfig.logoff(dataStore);
			},
			isAuthenticated: function isAuthenticated() {
				if ($storage.isAuthenticated || axAuthConfig.allowAnonymous) {
					service.user = $storage.user;
					return true;
				} else {
					return false;
				}
			},
			getUserInfo: function getUserInfo(goToState) {
				dataStore.loadInProgress = true;
				dataStore.isDevelopment();
				let params = $storage.user ? $storage.user.info : null;
				let queryString = window.location.search;
				return $http.post(axAuthConfig.urls.getUserInfo+queryString, params)
					.then(function (response) {
						if (response.data !== null && response.data.data && response.data.data.UserName !== null) {
							service.authenticate(response.data);
							dataStore.loadInProgress = false;
							if (!response.data.extra) console.log("No backend version returned from server", response.data);
							else console.log("getUserInfo: backend vers:", response.data.extra.version, "local version: ", applicationInfo.version);
							if (response.data.extra.version) {
								var backendVersion = response.data.extra.version;
								if (backendVersion !== applicationInfo.version && !$storage.wrongVersion) {
									console.error("se executa refresh la schimbare de versiune!");
									$storage.wrongVersion = true;
									applicationInfo.version = Math.random();
									window.location.href = axUtils.addVersion(window.location.href);
									window.location.reload(true);
									return;
								} else if (goToState) $state.go(goToState);
								if ($storage.wrongVersion) console.error('Backend Version: ' + backendVersion + ' not match Client side Version: ' + applicationInfo.version);
								$storage.wrongVersion = false;
							} else if (goToState) $state.go(goToState);
						} else {
							console.error("getUserInfo error", response.data.errors ? response.data.errors : response.data);
							dataStore.loadInProgress = false;
							service.goLogin();
						}
					})
					.catch(function (response) {
						if (response.status !== 401) notify.error(response.message || response.statusText || "Server is down!", {timeOut: 0, width: "600px"});
						dataStore.loadInProgress = false;
						service.goLogin();
					});
			},
			goMain: function goMain(user) {
				dataStore.user = user;
				service.go("main");
			},
			goLogin: function goLogin() {
				service.clear();
				if (!axAuthConfig.allowAnonymous) $state.go("login");
			},
			logout: function logout() {
				service.clear();
				service.logoff(function (response) {
					if (response.status) {
						service.goLogin();
					}
				});
			},
			go: function go(route) {
				$state.go(route);
			}
		};
		return service;
	}
})();