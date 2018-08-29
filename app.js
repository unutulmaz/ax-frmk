(function () {
	window.app = angular.module("App", modules);
	angular.module("App").controller("mainCtrl", mainCtrl);
	mainCtrl.$inject = ["$scope", "axDataStore", "authService", "$localStorage", "logger", "apiAction", "$injector"];

	function mainCtrl($scope, dataStore, authService, $storage, notify, apiAction, $injector) {
		$scope.dataStore = dataStore;
		$scope.authService = authService;
		$scope.mainMenu = {};
		$scope.locationReload = function () {
			let url = window.origin + "?v=" + Math.random() + window.location.hash;
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
		$locationProvider.html5Mode(false).hashPrefix('!');
		//compatibility with angular 1.6;
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
					}
				});
		};

		$stateProvider
			.state("main",
				{
					url: "/",
					resolve: {
						promiseObj: ["authService",
							function (authService) {
								var userLoaded = authService.userLoaded();
								// console.log("router promise user:", userLoaded);
								if (!userLoaded) {
									return authService.getUserInfo().then(function (data) {
										//console.log("getUserInfo", data);
										authService.promiseExecuted = true;
										authService.goToStorageRoute("main");
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
	runBlock.$inject = ['$rootScope', '$state', "axDataStore", 'authService', 'logger', "$injector", "$localStorage", "$timeout"];

	function runBlock($rootScope, $state, dataStore, authService, notify, $injector, $storage, $timeout) {
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
			}
			dataStore.loadingFinish = true;
		};
		dataStore.loadingFinish = false;
		$rootScope.$on('$stateChangeStart',
			function (e, toState, toParams, fromState, fromParams) {
				if (!authService.promiseExecuted) return;
				var authenticated = authService.isAuthenticated();
				// console.log("stateChange", authenticated, $storage.user, toState);
				if (!authenticated && toState.name === "reset-password" && !axAuthConfig.allowAnonymous) ;
				else if (!authenticated && toState.name !== "login" && !axAuthConfig.allowAnonymous) $state.go("login");
				else if (authenticated && toState.name === "login") authService.goToStorageRoute("main");
				else authService.goToStorageRoute(toState.name);
			});
		if (typeof appRunExtend === "function") appRunExtend($rootScope, $injector);

	}
}());
