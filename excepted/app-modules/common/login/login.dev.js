(function () {
	'use strict';

	angular.module('App').controller('LoginController', LoginController);

	LoginController.$inject = ['$scope', 'authService', "axDataStore", "$timeout"];

	function LoginController($scope, authService, dataStore, $timeout) {
		var vm = $scope;


		vm.loginInfo = {email: "ascentix.uat@gmail.com", "parola": "test"};
		vm.ctrl = {
			login: function () {
				authService.login(vm.loginInfo, function (response) {
					if (!response.status)
						$timeout(function () {
							angular.element("#username").focus();
						}, 300);
				});
			},
			resetPassword: function () {
				if (!vm.loginInfo.email) {
					angular.element("[name=email]").focus();
					return;
				}
				vm.loginWorking = true;
				authService.resetPassword(vm.loginInfo, function (response) {
					vm.loginWorking = false;
					if (!response.status)
						$timeout(function () {
							angular.element("#username").focus();
						}, 300);
				});
			},
			getFullSystemName: function () {
				return dataStore.getFullSystemName();
			}
		};
	}
})();