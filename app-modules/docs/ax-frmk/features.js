(function () {
	angular.module("App").controller("featuresCtrl", controller);
	controller.$inject = ['$scope'];

	function controller($scope) {
		$scope.images = {
			path: "app-modules/images/",
			items: [
				{url: 'Table config and predefined profiles.png', description: ""},
				{url: 'Table config group properties.png', description: ""},
				{url: 'Changing editing mode.png', description: ""},
				{url: 'Column freezind.png', description: ""},
				{url: 'Column menu - filter menu.png', description: ""},
				{url: 'Column menu - hidden columns.png', description: ""},
				{url: 'Column menu ordering.png', description: ""},
				{url: 'Editing in editor.png', description: ""},
				{url: 'Editing inline mode.png', description: ""},
				{url: 'Editing inline mode (excel like).png', description: ""},
				{url: 'Filter by grouping values.png', description: ""},
				{url: 'Filter by multiple column values.png', description: ""},
				{url: 'Filter by value.png', description: ""},
				{url: 'Filter with multiselect.png', description: ""},
				{url: 'Grouping records with fixed group header.png', description: ""},
				{url: 'Headers structure.png', description: ""},
				{url: 'Pivot table config and predefined profiles.png', description: ""},
				{url: 'Pivot table result.png', description: ""},
				{url: 'Show case - Customers.png', description: ""},
				{url: 'Show case - Invoice editing1.png', description: ""},
				{url: 'Show case - Invoice editing2.png', description: ""},
				{url: 'Show case - Invoice excel export.png', description: ""},
				{url: 'Show case - Invoice html export.png', description: ""},
				{url: 'Show case - Invoices list (master-details).png', description: ""},
			]
		}

	}
}());