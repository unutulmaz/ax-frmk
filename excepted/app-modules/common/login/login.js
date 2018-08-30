(function () {
	'use strict';

	angular.module('App').controller('LoginController', LoginController);

	LoginController.$inject = ['$scope', 'apiAction', "axDataStore", "$timeout", "logger"];

	function LoginController($scope, apiAction, dataStore, $timeout, $notify) {
		var vm = this;


		vm.loginInfo = {};

		vm.login = function () {
			if (!vm.loginInfo.email) return angular.element("[name=email]").focus();
			vm.loginWorking = true;
			let params = angular.copy(vm.loginInfo);
			apiAction('account', 'sendLink', 'post', params, "").then(function (response) {
				if (!response.status) {
					let message = "";
					if (response.message) {
						message = "Reason: " + response.message.replace("\r\nClient -> Server: QUIT", "");
					} else if (response.errors) {
						message = "Reason: ";
						for (let field in response.errors) {
							message += field + ": " + response.errors[field].join("<br>");
						}
					}
					$notify.error("Email wasn't sent.<br>" + message);
					$timeout(function () {
						angular.element("[name=lastName").focus();
					}, 300);
				}
				else {
					$notify.success("Email was sent to address: " + vm.loginInfo.email + "<br>Please check spam folder too, and use only Chrome browser!!!");
				}
				console.log(response);
				if (response.loader) response.loader.remove();
				vm.loginWorking = false;
			}).catch(function (response) {
				vm.loginWorking = false;
				console.log("error", response);
				let message = response.message.replace("\r\nClient -> Server: QUIT", "");
				$notify.error("Email wasn't sent. Reason : " + message);
			});
		};
		vm.getFullSystemName = function () {
			return dataStore.getFullSystemName();
		};
	}
})();