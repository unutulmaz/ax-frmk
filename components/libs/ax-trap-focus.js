class axTrapFocus {
	constructor($element, $scope) {

		this.$element = $element;
		if ($element.length === 0) {
			console.error('axTrapFocus has no element to attach:', $element);
			return;
		}
		//if (!$element.isConnected) return;
		this.$scope = $scope;
		this.focusableElementsSelector = focusableElements;
		if ($element.hasClass('popup-table')) this.focusableElementsSelector = '[role=table-scroller] tr';
		var axTrapFocus = this;
		$element.bind('keydown',
			function trapEvent(event) {
				axTrapFocus.onTrapFocusKeydown(event, axTrapFocus, axTrapFocus.$scope);
			});
		return this;
	}

	destroy() {
		this.$element.unbind();
	}

	focusToElement(element) {
		if (element.tabIndex === -1) {
			let focusable = this.getFocusableElements(angular.element(element));
			if (focusable.length === 0) return;
			focusable[0].focus();
		} else element.focus();
		//console.log('axtrap-focus', document.activeElement);
		return;
	}

	onTrapFocusKeydown(event, self, $scope) {
		var moveNext = event.keyCode === keyCodes.Tab && event.shiftKey === false;
		var movePrevious = event.keyCode === keyCodes.Tab && event.shiftKey === true;
		//console.log("trap focus", event, moveNext, movePrevious);
		if (moveNext || movePrevious) {
			event.preventDefault();
			event.stopPropagation();
			self.handleTab(event, movePrevious);
		} else if (event.keyCode === keyCodes.Escape) {
			//console.log("trap focus", this, $scope);
			if ($scope.popupClose) {
				event.preventDefault();
				event.stopPropagation();
				$scope.popupClose();
			} else if ($scope.$parent.closeThisDialog) {
				event.preventDefault();
				event.stopPropagation();
				$scope.$parent.closeThisDialog();
			}
		} else if (event.keyCode === keyCodes.Enter) {
			var buttons = angular.element(document.activeElement).closest("button");
			if (buttons.length == 1) {
				event.preventDefault();
				event.stopPropagation();
				buttons.click();
			} else if (event.shiftKey === false) {
				event.preventDefault();
				event.stopPropagation();
				self.handleTab(event, false);
			} else if (event.shiftKey === true) {
				event.preventDefault();
				event.stopPropagation();
				self.handleTab(event, true);
			}
		}
		if (this.keyboardHandleCallback) this.keyboardHandleCallback(event);
	}

	handleTab(event, backward) {
		var focusableElements = this.getFocusableElements(this.$element);
		//console.log("-----------------------------------------------------------", focusableElements);
		if (focusableElements.length === 0) {
			if (document.activeElement) {
				document.activeElement.blur();
			}
			return;
		}

		var currentFocus = angular.element(document.activeElement);
		if (currentFocus.length > 0) currentFocus = currentFocus[0];
		else currentFocus = document.activeElement;
		//console.log("current focus", currentFocus);
		//console.log("focusable", focusableElements);
		var focusIndex = -1;
		for (var i = 0; i < focusableElements.length; i++) {
			if (focusableElements[i] === currentFocus) {
				focusIndex = i;
				break;
			}
		}
		//console.log("focus: ", focusIndex);
		var isFocusIndexUnknown = (focusIndex === -1);
		var isFirstElementFocused = (focusIndex === 0);
		var isLastElementFocused = (focusIndex === focusableElements.length - 1);
		//console.log("isFirst", isFirstElementFocused, "is Last:", isLastElementFocused, focusIndex);
		if (backward) {
			if (isFocusIndexUnknown || isFirstElementFocused) {
				this.focusToElement(focusableElements[focusableElements.length - 1]);
			} else {
				this.focusToElement(focusableElements[focusIndex - 1]);
			}
		} else {
			if (isFocusIndexUnknown || isLastElementFocused) {
				this.focusToElement(focusableElements[0]);
			} else {
				this.focusToElement(focusableElements[focusIndex + 1]);
			}
		}
		//console.log('currentFocus', angular.element(document.activeElement));

		event.preventDefault();
		event.stopPropagation();
	}

	autoFocus() {
		var viewElement = this.$element[0];
		var currentFocus = angular.element(document.activeElement);
		let focused = false;
		if (currentFocus.length > 0) {
			let parents = currentFocus.parents();
			for (let i = 0; i < parents.length; i++) {
				if (parents[i] !== viewElement) continue;
				focused = true;
				return false;
			}
		}
		if (focused) return;
		//console.log("autofocus", viewElement);
		// Browser's (Chrome 40, Forefix 37, IE 11) don't appear to honor autofocus on the dialog, but we should
		var autoFocusEl = viewElement.querySelector('*[autofocus]:not([disabled])');
		if (autoFocusEl !== null) {
			//console.log("autofocus", autoFocusEl);
			this.focusToElement(autoFocusEl);
			return;
		}
		var focusableElements = this.getFocusableElements(this.$element);
		//console.log("autofocus", focusableElements);
		if (focusableElements.length > 0) {
			this.focusToElement(focusableElements[0]);
			return;
		}

		var contentElements = this.filterVisibleElements(viewElement.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,div'));

		if (contentElements.length > 0) {
			var contentElement = contentElements[0];
			//angular.element(contentElement).attr('tabindex', '-1').css('outline', '0');
			contentElement.focus();
			//console.log('autofocus to content', contentElement);
		}
	}

	getFocusableElements($element, querySelector) {
		var viewElement = this.$element[0];
		let columns = $(viewElement).find("[column-index]").sort(function (a, b) {
			return +parseInt(a.getAttribute('column-index')) - parseInt(b.getAttribute('column-index'));
		});
		let rawElements = [];
		let focusableElementsSelector = querySelector || this.focusableElementsSelector;
		if (!viewElement.hasAttribute("tab-order-by-index"))
			rawElements = $(viewElement).find(focusableElementsSelector);
		else rawElements = $(viewElement).find(focusableElementsSelector).sort(function (a, b) {
			return +parseInt(a.getAttribute('tabindex')) - parseInt(b.getAttribute('tabindex'));
		});
		//console.log("rawElements", rawElements);
		var focusableElements = this.filterVisibleElements(rawElements);
		if (!this.loaded) {
			angular.element(focusableElements).focus(function () {
				//console.log("element got focus", this);
			}).blur(function () {
				//console.log("element loose focus", this);
			});
			this.loaded = true;
		}
		//console.log("fcousable", focusableElements);
		return focusableElements;
	}

	filterTabbableElements(elements) {
		var tabbableFocusableElements = [];

		for (var i = 0; i < elements.length; i++) {
			var el = elements[i];

			if (angular.element(el).attr('tabindex') !== '-1') {
				tabbableFocusableElements.push(el);
			}
		}

		return tabbableFocusableElements;
	}

	filterVisibleElements(elements) {
		var visibleFocusableElements = [];
		for (var i = 0; i < elements.length; i++) {
			var el = elements[i];
			var tabView = angular.element(el).closest("ax-tab-view:not(.active)");
			if (!angular.element(el).is(":visible")) continue;
			if (tabView.length > 0) continue;
			if (el.offsetWidth > 0 || el.offsetHeight > 0) {
				visibleFocusableElements.push(el);
			}
		}
		return visibleFocusableElements;
	}
}