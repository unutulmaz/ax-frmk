(function () {
	'use strict';

	angular.module('App').controller('resetPasswordController', LoginController);

	LoginController.$inject = ['$scope', 'authService', "axDataStore", "$timeout", "$location"];

	function LoginController($scope, authService, dataStore, $timeout, location) {
		var vm = $scope;
		console.log("params", location.$$search);
		vm.loginInfo = {id: location.$$search.id};

		vm.savePassword = function () {
			if (vm.loginInfo.parola !== vm.loginInfo.confirmare) angular.element("[name=parola]").focus();
			else{
				vm.loginWorking = true;
				authService.savePassword(vm.loginInfo, function (response) {
					vm.loginWorking = false;
					if (!response.status)
						authService.goLogin();
				});
			}
		};
	}
})();