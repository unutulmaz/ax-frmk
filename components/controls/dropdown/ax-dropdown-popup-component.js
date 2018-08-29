(function () {
	var module = angular.module('ax.components');
	window.dropdownsStack = {
		items: [],
		currentId: 1,
		nextId: function () {
			this.currentId++;
			return this.currentId;
		},
		add: function (popup) {

			popup.id = this.nextId();
			if (popup.attrs.dontRegisterToStack !== undefined) return;
			this.items.push({id: popup.id, popup: popup});
		},
		closePopupsFor: function (element, callback) {
			//console.log("closing popups for", element);
			let itemsClosing = false;
			this.items.each(function (item) {
				if (!item) return;
				item.popup.$toggleButton.parents().each(function (i, parent) {
					if (parent !== element[0]) return;
					itemsClosing = true;
					item.popup.close(true, false);
					return false;
				});
			}, this);
			//if (itemsClosing && callback) setTimeout(callback, 500);
			//else if (callback) callback();

			if (callback) callback();
		},
		remove: function (popup) {
			this.items.removeObject(popup.id, "id");
		}
	};

	module.component('axDropdownPopup', {
		bindings: {
			ngDisabled: '&',
			ngReadonly: '&',
			ngFocus: '&',
			ngBlur: '&',
			btnText: "&",
			ctrl: '=?'
		},
		bindToController: false,
		controllerAs: 'dropdown',
		template: ["$element", "$attrs", 'templateFactory',
			function axDropdownPopupTemplate($element, $attrs, templateFactory) {
				$attrs.template = new axDropdownPopup(null, $element, $attrs, templateFactory);
				return $attrs.template.toggleButton.template;
			}],
		controller: ["$element", "$scope", "$attrs", 'templateFactory', '$compile', '$timeout', '$document', 'axDataStore', "uibDateParser",
			function axDropdownPopupController($element, $scope, $attrs, templateFactory, $compile, $timeout, $document, dataStore, dateParser) {
				$attrs.template = new axDropdownPopup($attrs.template.popup.template, $element, $attrs, templateFactory, $compile, $timeout, $document, dataStore, dateParser);
				//pt. ce o fi asta????? - probabil referinta la axTableCtrl
				if ($scope.$parent.$ctrl && !$scope.$ctrl) $scope.$ctrl = $scope.$parent.$ctrl;
				let self = this;
				if (!this.ctrl) this.ctrl = {};
				// console.log("Ctrl", this.ctrl, $attrs.ctrl, $scope.$parent.$eval($attrs.ctrl));
				if (!this.ctrl.parents) this.ctrl.parents = {};
				this.ctrl.uid = $attrs.template.uid;
				$element.find('.dropdown-toggle').attr('uid', this.uid);
				this.ctrl.parents[this.ctrl.uid] = function () {
					return $scope ? $scope.$parent : null;
				};
				// this.ctrl.parent = function () {
				// 	return this.parents[this.uid]();
				// };
				// console.log("ax-dropdown-popup", $attrs.ctrl)
				if (!angular.isDefined(this.ctrl.$parent)) Object.defineProperty(this.ctrl, "$parent", {
					get() {
						return this.parents[this.uid]();
					}
				});
				$attrs.template = angular.extend(this, $attrs.template);
				$attrs.template.post($scope, $attrs.$$element);
				$element.on("$destroy", function () {
					// console.log("destroying popup", $element, self, $attrs.ctrl);
					$scope.$ctrl = null;
					// self.ctrl = null;
					$scope.$destroy();
					$scope = null;
				});

			}]
	});
}());


(function () {
	var module = angular.module('ax.components');
	module.component('axPopup', {
		bindings: {
			launcher: '=?'
		},
		bindToController: true,
		template: ["$element", "$attrs", 'templateFactory', '$timeout', '$document', '$window', 'axDataStore',
			function ngPopupTemplate($element, $attrs, templateFactory, $timeout, $document, $window, dataStore) {
				var originalElement = angular.copy($element);
				$attrs.template = new axPopup($element, $attrs, templateFactory, $timeout, $document, $window, dataStore);
				$attrs.template.originalElement = originalElement;
				$attrs.template.linkedElement = $element;
				return $attrs.template.template;
			}],
		controller: ["$scope", "$attrs", "$compile",
			function ngPopupController($scope, $attrs, $compile) {
				$attrs.template = angular.extend(this, $attrs.template);
				if (this.launcher) {
					$attrs.template = angular.extend(this.launcher.popup, $attrs.template);
					if (this.launcher.$toggleButton) this.$toggleButton = this.launcher.$toggleButton;
				}
				$attrs.template.post($scope, $attrs.$$element, $attrs, $compile);
			}]
	});

}());

