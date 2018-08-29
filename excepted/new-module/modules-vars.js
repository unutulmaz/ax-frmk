var applicationInfo = {
	"name": "New app",
	"version": "1.0.0",
	"type": ""
};
if (typeof window === 'undefined') {
	module.exports = applicationInfo;
} else {
	document.title = applicationInfo.name + " " + applicationInfo.version;
}
var axDateTimeFormat = "dd.MM.yyyy HH:mm:ss";
var axDateFormat = "dd.MM.yyyy";
var axDtLimits = -1;
var axLocale = "ro-RO";
var axNumberFormat = {
	style: "decimal",
	locale: axLocale,
	grouping: "true",
	decimals: 0
};

var pagesTemplates = {
	loadExtraRoutes: function ($stateProvider) {
		$stateProvider.stateAsMainContent("profile", "profile", "app-modules/reunion/users/profile.html");
		$stateProvider.stateAsEmptyPage("reset-password", "/resetare-parola", 'app-modules/common/login/reset-password.html');
		$stateProvider.stateAsEmptyPage("locatie", "/locatie/:id", 'app-modules/etr/locations/public.html'); //inject $stateParams in view controller tyo find id value
	}
};


var leftPanelWidth = 300;
var mainCtrlExtend = function ($scope, $injector) {
	let dataStore = $injector.get("axDataStore");
	let $storage = $injector.get("$localStorage");
	let $timeout = $injector.get("$timeout");
	$scope.leftPaneToggle = function leftPaneToggle(value) {
		let right = angular.element("#right-pane");
		if (value === undefined) value = dataStore.leftPaneCollapsed;
		if (value) {
			dataStore.leftPaneCollapsed = false;
			$timeout(function () {
				let left = angular.element("#left-pane, #copyright");
				if (left.length > 0) {
					left.width(leftPanelWidth);
					left.slideShow("left", 500, function () {
						if ($storage.user) $storage.user.leftPaneCollapsed = dataStore.leftPaneCollapsed;
						dataStore.rightPanelCssLeft = leftPanelWidth;
						$timeout(axUtils.triggerWindowResize);
					}, right, true);
				}
			}, 300);
		} else {
			let left = angular.element("#left-pane,#copyright");
			if (left.length > 0)
				left.slideHide("left", 500, function () {
					left.width(0);
					dataStore.rightPanelCssLeft = 0;
					dataStore.leftPaneCollapsed = true;
					if ($storage.user) $storage.user.leftPaneCollapsed = dataStore.leftPaneCollapsed;
					$timeout(axUtils.triggerWindowResize);
				}, right);
		}

	};
	if (!dataStore.leftPaneCollapsed) $timeout(function () {
		$scope.leftPaneToggle(dataStore.leftPaneCollapsed === undefined ? true : dataStore.leftPaneCollapsed === false);
	});
};
var appConfigExtended = function appConfigExtended($compileProvider, $locationProvider, $injector) {

};
var appRunExtend = function appRunExtend($rootScope, $injector) {

};