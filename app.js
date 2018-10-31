(function () {
	window.app = angular.module("App", modules);
	angular.module("App").controller("mainCtrl", mainCtrl);
	mainCtrl.$inject = ["$scope", "axDataStore", "authService", "$localStorage", "notify", "apiAction", "$injector", "axDataSet"];

	function mainCtrl($scope, dataStore, authService, $storage, notify, apiAction, $injector, dataSet) {
		$scope.dataStore = dataStore;
		$scope.dataSet = dataSet;
		$scope.authService = authService;
		$scope.mainMenu = {};
		$scope.theme = {
			list: applicationInfo.themes,
			current: applicationInfo.theme,
			onChange: function () {
				console.log("seleted", this.current);
				$storage.user.theme = this.current;
				$scope.locationReload();
			}
		};

		$scope.locationReload = function () {
			// let url = window.origin + "?v=" + Math.random() + window.location.hash;
			let url = window.origin + window.location.hash;
			window.location.reload(true);
			window.location.href = url;
		};
		$scope.currentUser = {
			logout: function () {
				this.close();
				authService.logout();
			},
		};

		if (typeof mainCtrlExtend === "function") mainCtrlExtend($scope, $injector);
	}

	angular.module("App").config(["$compileProvider", "$locationProvider", "$injector", function ($compileProvider, $locationProvider, $injector) {
		$compileProvider.debugInfoEnabled(true); //required for angular.element().scope() - drag&drop, etc;
		$locationProvider.html5Mode(false).hashPrefix('!');
		//compatibility with angular 1.6 - do not upgrade to 1.7, ax-frmk will not work;
		if ($compileProvider.preAssignBindingsEnabled) $compileProvider.preAssignBindingsEnabled(true);
		if (typeof appConfigExtend === "function") appConfigExtend($compileProvider, $locationProvider, $injector);
	}]);
	angular.module("App").config(routerConfig);
	routerConfig.$inject = ['$stateProvider', '$urlRouterProvider'];

	function routerConfig($stateProvider, $urlRouterProvider) {
		$urlRouterProvider.otherwise('/');
		$stateProvider.stateAsMainContent = function (name, route, urlTemplate) {
			this.state(name,
				{
					parent: "main",
					url: route,
					views: {
						'content@main': {
							templateUrl: urlTemplate
						}
					}
				});
		};
		$stateProvider.stateAsEmptyPage = function (name, route, urlTemplate) {
			this.state(name,
				{
					url: route,
					views: {
						'empty-page': {
							templateUrl: urlTemplate
						}
					},
					resolve: {
						promiseObj: ["authService",
							function (authService) {
								// console.log("router promise user:", userLoaded);
								if (!authService.promiseExecuted) {
									return authService.getUserInfo().then(function (data) {
										//console.log("getUserInfo", data);
										authService.promiseExecuted = true;
										// authService.go(route);
										console.log('route', name);
										if (authService.isAuthenticated()) authService.goToStorageRoute('main');
									});
								}
							}]
					},
				});
		};

		$stateProvider
			.state("main",
				{
					url: "/",
					resolve: {
						promiseObj: ["authService",
							function (authService) {
								// console.log("router promise user:", userLoaded);
								if (!authService.promiseExecuted) {
									return authService.getUserInfo().then(function (data) {
										//console.log("getUserInfo", data);
										authService.promiseExecuted = true;
										console.log('route',  name);
										if (authService.isAuthenticated()) authService.goToStorageRoute('main');

									});
								}
							}]
					},
					views: {
						"main": {
							templateUrl: 'app-modules/common/main/main.html',
							controller: 'mainCtrl'
						},
						"content@main": {
							templateUrl: 'app-modules/common/main/home.html'
						}
					}
				});
		if (!axAuthConfig.allowAnonymous) $stateProvider.stateAsEmptyPage("login", "/login", 'app-modules/common/login/login.html');

		axAuthConfig.routesLoaded = false;
		axAuthConfig.loadUserRoutes = function (menu, callback) {
			// that mean  when you change current User Role, you need to reload app.
			if (axAuthConfig.routesLoaded) return;
			axAuthConfig.routesLoaded = true;
			var loadRoutes = function (items) {
				for (let i = 0; i < items.length; i++) {
					let item = items[i];
					if (item.route !== "" && item.templateUrl !== "") $stateProvider.stateAsMainContent(item.route, item.route, item.templateUrl);
					if (item.items) loadRoutes(item.items);
				}
			};
			loadRoutes(menu);
			if (callback) callback();
		};
		if (pagesTemplates) {
			if (pagesTemplates.loadExtraRoutes) pagesTemplates.loadExtraRoutes($stateProvider, applicationInfo.version);
			$.each(pagesTemplates,
				function (route, templateUrl) {
					if (route === "" || route === "loadExtraRoutes") return;
					$stateProvider.stateAsMainContent(route, route, templateUrl);
				});
		}
	}

	angular.module("App").run(runBlock);
	runBlock.$inject = ['$rootScope', '$state', "axDataStore", 'authService', 'notify', "$injector", "$localStorage", "$timeout"];

	function runBlock($rootScope, $state, dataStore, authService, notify, $injector, $storage, $timeout) {
		dataStore.changeTheme = function (theme) {
			let link = angular.element(window.document).find("head > link[theme]");
			let add = false;
			theme = applicationInfo.themes.findObject(theme.name, "name");
			if (!theme) theme = applicationInfo.themes.findObject(true, "default");
			if (link.length === 0 || link.getAttribute("href") !== theme.url) add = true;
			if (add && link.length > 0) link.remove();
			if (add) {
				angular.element(window.document).find("head").append(createElement("link", {rel: "stylesheet", theme: "dimensions", href: theme.dimensions.url}));
				angular.element(window.document).find("head").append(createElement("link", {rel: "stylesheet", theme: "appearance", href: theme.appearance.url}));
				angular.element(window.document).find("body").attr("class", theme.dimensions.class + " " + theme.appearance.class);
			}
			if (dataStore.theme) dataStore.theme.current = theme;
			if ($storage.user) $storage.user.theme = theme;
			applicationInfo.theme = theme;
			if (typeof changeTheme === "function") changeTheme(theme, $rootScope, $injector);
			if (typeof dynamicStyles === "function") dynamicStyles(theme);
		};
		// console.log("run bloc", dataStore, $storage);
		dataStore.changeTheme($storage.user && $storage.user.theme ? $storage.user.theme : applicationInfo.theme);
		$rootScope.angular = angular;
		$rootScope.$on('$stateNotFound',
			function (event, unfoundState, fromState, fromParams) {
				console.error("rootState state not found", unfoundState.to);
				$state.go(pagesTemplates.notFound || "main");
			});
		$rootScope.$on('$stateChangeError',
			function (event, toState, toParams, fromState, fromParams, error) {
				console.error("rootState change error", toState.url, error);
				if (error.status === -1) notify.error("Access route error: Data service failed! Server is down!");
				if (error.status === 404) $state.go(pagesTemplates.notFound || "main");
			});
		authService.goToStorageRoute = function (route) {
			//console.log("stateChange", route);
			if (!dataStore.loadingFinish && ($storage.user && ($storage.user.currentRoute && $storage.user.currentRoute !== "login") || route)) {
				if ($storage.user) {
					route = route === "main" ? ($storage.user.currentRoute && $storage.user.currentRoute !== "login" ? $storage.user.currentRoute : route) : route;
					delete $storage.user.currentRoute;
				}
				$timeout(function () {
					//console.log("route", route, dataStore.mainNavbar, );
					if (dataStore.mainNavbar && dataStore.mainNavbar.$ctrl) {
						let node = dataStore.mainNavbar.$ctrl.findNode(route, "route");
						if (node) node.$ctrl.expandParents(node);
					}
					$state.go(route);
				}, 300);
			} else {
				if (!$storage.user) $storage.user = {};
				$storage.user.currentRoute = route;
				// $state.go(route);
			}
			dataStore.loadingFinish = true;
		};
		dataStore.loadingFinish = false;
		$rootScope.$on('$stateChangeStart',
			function (e, toState, toParams, fromState, fromParams) {
				if (!authService.promiseExecuted) return;
				var authenticated = authService.isAuthenticated();
				// console.log("stateChange", authenticated, $storage.user, toState);
				if (!authenticated && (toState.name === "reset-password" || toState.name === "login")) ;
				else if (!authenticated && toState.name !== "login") $state.go("login");
				else if (authenticated && toState.name === "login") authService.goToStorageRoute("main");
				else authService.goToStorageRoute(toState.name);
			});
		if (typeof appRunExtend === "function") appRunExtend($rootScope, $injector);

	}
}());
