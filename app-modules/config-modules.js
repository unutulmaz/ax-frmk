var maxMobileWidth = 900;
var leftPanelWidth = 300;
var applicationInfo = {
	"name": "AngularJS AxFramework",
	"version": "1.0.3",
	"copyright":"",
	"type": "",
	"theme": {},
	"themes": [
		{
			default: false,
			name: "Bootstrap Normal",
			dimensions: {
				url: "components/themes/ax-theme.dimensions.normal.css",
				class: "dimensions-normal",
				rowDataHeight: 28,
				iconButtonWidth: 32,
				leftPanelWidth: 320,
				maxMobileWidth: maxMobileWidth
			},
			appearance: {
				url: "components/themes/ax-theme.appearance.bootstrap-1.css",
				class: "bootstrap1-theme"
			},
			baseOn: "bootstrap4",
		},
		{
			default: false,
			name: "Bootstrap Large",
			dimensions: {
				url: "components/themes/ax-theme.dimensions.large.css",
				class: "dimensions-large",
				rowDataHeight: 32,
				iconButtonWidth: 40,
				leftPanelWidth: 350,
				maxMobileWidth: maxMobileWidth
			},
			appearance: {
				url: "components/themes/ax-theme.appearance.bootstrap-1.css",
				class: "bootstrap1-theme"
			},
			baseOn: "bootstrap4",
		},
		{
			default: true,
			name: "Flat Normal",
			dimensions: {
				url: "components/themes/ax-theme.dimensions.normal.css",
				class: "dimensions-normal",
				rowDataHeight: 28,
				iconButtonWidth: 32,
				leftPanelWidth: 320,
				maxMobileWidth: maxMobileWidth
			},
			appearance: {
				url: "components/themes/ax-theme.appearance.bootstrap-flat.css",
				class: "bootstrap1-theme"
			},
			baseOn: "bootstrap4",
		},
		{
			default: false,
			name: "Flat large",
			dimensions: {
				url: "components/themes/ax-theme.dimensions.large.css",
				class: "dimensions-large",
				rowDataHeight: 32,
				iconButtonWidth: 40,
				leftPanelWidth: 350,
				maxMobileWidth: maxMobileWidth
			},
			appearance: {
				url: "components/themes/ax-theme.appearance.bootstrap-flat.css",
				class: "bootstrap1-theme"
			},
			baseOn: "bootstrap4",
		},
	]
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
	decimals: 2
};

var pagesTemplates = {
	"not-found": "app-modules/home.html",
	loadExtraRoutes: function ($stateProvider) {
		// $stateProvider.stateAsEmptyPage("docs/overview", "/docs/overview/:type","app-modules/show-case/overview/datagrid-samples.html");
	}
};

var changeAppStyle = function (dataStore) {
	dataStore.isMobileDevice = angular.element(window.document).width() <= maxMobileWidth;
	if (dataStore.isMobileDevice) dataStore.leftPaneCollapsed = true;
	angular.element(window.document).find("body").removeClass("is-mobile");
	if (dataStore.isMobileDevice) angular.element(window.document).find("body").addClass("is-mobile");
};
var mainCtrlExtend = function ($scope, $injector) {
	let dataStore = $injector.get("axDataStore");
	let $storage = $injector.get("$localStorage");
	let $timeout = $injector.get("$timeout");
	dataStore.maxMobileWidth = maxMobileWidth;
	dataStore.isMobileDevice = false;
	$scope.leftPaneToggle = function leftPaneToggle(value) {
		let right = angular.element("#right-pane").length ? angular.element("#right-pane") : null;
		if (value === undefined) value = dataStore.leftPaneCollapsed;
		if (value) {
			dataStore.leftPaneCollapsed = false;
			$timeout(function () {
				let left = angular.element("#left-pane, #copyright");
				changeAppStyle(dataStore);
				if (left.length) {
					left.width(dataStore.isMobileDevice ? 0 : applicationInfo.theme.dimensions.leftPanelWidth);
					left.slideShow("left", 500, function () {
						if ($storage.user) $storage.user.leftPaneCollapsed = dataStore.leftPaneCollapsed;
						dataStore.rightPanelCssLeft = dataStore.isMobileDevice ? 0 : applicationInfo.theme.dimensions.leftPanelWidth;
						$timeout(function () {
							axUtils.triggerWindowResize();
						});
					}, right, true);
				}
			}, 300);
		} else {
			let left = angular.element("#left-pane, #copyright");
			if (left.length)
				left.slideHide("left", 500, function () {
					changeAppStyle(dataStore);
					if (dataStore.isMobileDevice) dataStore.leftPaneCollapsed = true;
					left.width(0);
					dataStore.rightPanelCssLeft = 0;
					dataStore.leftPaneCollapsed = true;
					if ($storage.user) $storage.user.leftPaneCollapsed = dataStore.leftPaneCollapsed;
					$timeout(function () {
						axUtils.triggerWindowResize();
					});
				}, right);
		}

	};

	changeAppStyle(dataStore);
	axUtils.addEventListener(window, 'resize', function () {
		changeAppStyle(dataStore);
	});
	mediaStyles(maxMobileWidth);
	if (!dataStore.leftPaneCollapsed) $timeout(function () {
		$scope.leftPaneToggle(dataStore.leftPaneCollapsed !== true);
	});
};
var changeTheme = function (theme, $rootScope, $injector) {
	// console.log("change theme", theme);
	switch (theme.name) {
		case "Bootstrap":
			break;
		default:
	}
};