var axAuthConfig = {
	allowAnonymous: true,
	urls: {
		login: "account/login",
		logoff: "account/logoff",
		getUserInfo: "account/getUserInfo"
	},
	loadRoutesFromMenu: true,
	restorePreviousValues: function (dataStore, $storage, response) {
	},
	saveStorageUser: function (user, dataStore) {
	}
};
