function axPopup($element, $attrs, templateFactory, $timeout, $document, $window, $dataStore) {
	var popupObj = {};
	popupObj = {
		uid: $attrs.uid || axUtils.Guid(),
		template: "",
		templateUrl: "ax-popup",
		openSteps: {4: 'startPositioning', 5: "finish"},
		getTemplate: function (templateUrl) {
			var popup = this;

			templateFactory.getTemplate(templateUrl)
				.then(function (response) {
					popup.template = response.data;
				});
		},
		onClose: angular.noop,
		post: function (scope, element, attrs, $compile) {
			popupObj = this;
			this.$compile = $compile;
			scope.dataStore = $dataStore;
			this.popupScope = scope;
			if (scope.$parent.dropdown.ctrl) this.popupScope.launcher = scope.$parent.dropdown.ctrl;
			this.attrs = attrs;
			this.popupElement = element;
			this.disableAnimation = attrs.disableAnimation === 'true' || false;


			var close = function popupClose(event, disableAnimation) {
				if (angular.isObject(event) && event.type === "click") event.stopPropagation();
				popupObj.close(false, disableAnimation);
			};
			if (this.launcher.ctrl.onClose) this.onClose = function () {
				this.launcher.ctrl.onClose(arguments);
			};
			this.launcher.ctrl.close = close;
			this.popupScope.popupClose = close;
			this.popupScope.popup = this;
			this.popupScope.popupClickStopPropagation = function popupClickStopProp($event) {
				$event.stopPropagation();
			};

			if (attrs.closeOnDestroy !== "false") {
				element.on("$destroy", popupObj.onDestroy);
				scope.$on("$destroy", popupObj.onDestroy);
			}
			documentClickClosure = function (event) {
				popupObj.documentClick(event);
			};
			onWindowResizeClosure = function (event) {
				popupObj.onWindowResize(event);
			};
			bindParentClosure = function (event) {
				popupObj.bindParent(angular.element(event.currentTarget));
			};
			this.open();
		},
		onDestroy: function () {
			if (!popupObj || !popupObj.popupScope || !popupObj.popupElement || popupObj.openStep === 6) return;
			if (popupObj.openStep === 5) popupObj.close(true);
			else {
				popupObj.openFinish = false;
				$document.off('click', documentClickClosure);
				angular.element(window).unbind("resize", onWindowResizeClosure);
				popupObj.popupElement.unbind().remove();
				dropdownsStack.remove(popupObj);
				popupObj.isOpen = false;
				popupObj.popupScope.$ctrl = null;
				popupObj.popupScope.$destroy();
				popupObj.popupScope = null;
				delete popupObj.popupScope;
				delete popupObj.popupElement;
			}
			// console.log("popup destroy");
		},
		open: function () {
			popupObj = this;
			this.popupElement.css('display', 'block');
			this.popupElement.find('[role=table-header] thead').css('visibility', 'hidden');
			this.setPosition();
			popupObj.openStep = 4;
			// $dataStore.timeStamp(false, "popup-open", "open-step=4");
			var openTimeout = function () {
				var popupElement = popupObj.findPopup();
				popupObj.popupDirection = popupObj.popupDirection || 'down';
				popupObj.popupHeight = popupElement.height();
				popupObj.popupWidth = popupElement.outerWidth();
				popupObj.checkParentsWithScroll(function ($parent) {
					//popupObj.checkDirection($parent);
					$parent.bind('scroll', $parent, bindParentClosure);
				});

				popupObj.fitToWindow();
				popupElement.css("visibility", "");
				if (!popupObj.disableAnimation) popupElement.slideShow(popupObj.popupDirection === 'down' ? "top" : "bottom", 300);

				if (popupObj.attrs.closeOnBlur === "true") {
					$document.on('click', documentClickClosure);
					popupElement.on("click",
						function (event) {
							documentClickClosure(event);
						});
				}

				popupObj.$toggleButton.find('button').addClass("opened");
				//$dataStore.timeStamp(false, 'openStep=5');
				popupObj.openStep = 5;
				if (popupObj.buttonClasses) {
					popupObj.$toggleButton.find('.dropdown-toggle').attr("class", popupObj.buttonClasses);
				}
				popupObj.$toggleButton.addClass("popup-opened");
				if (!popupElement.hasClass('popup-table')) {
					popupObj.popupScope.axTrapFocus = new axTrapFocus(popupElement, popupObj.popupScope);
					popupObj.popupScope.axTrapFocus.autoFocus();
				}

				if (popupObj.scope.dropdown && popupObj.scope.dropdown.ctrl.onOpenFinish) {
					try {
						popupObj.scope.dropdown.ctrl.onOpenFinish();
						dropdownsStack.add(popupObj);
					} catch (err) {
						console.error("Error onOpenFinish popup", err);
					}
				} else dropdownsStack.add(popupObj);
			};
			$timeout(openTimeout);

			popupObj.popupScope.$watchCollection(function () {
				var position = popupObj.$toggleButton && popupObj.openStep === 5 ? popupObj.$toggleButton.offset() : {top: null, left: null};
				return position;
			}, function (newOffset, oldOffset) {
				if (!popupObj.$toggleButton || popupObj.openStep !== 5) return;
				var toggleButtonIsVisible = popupObj.$toggleButton.is(":visible");
				var popupIsVisbile = popupObj.popupElement.is(":visible");
				if (toggleButtonIsVisible && !popupIsVisbile) popupObj.popupElement.show();
				if (!toggleButtonIsVisible && popupIsVisbile) popupObj.popupElement.hide();


				popupObj.setPosition();
				//popupObj.checkParentsWithScroll(function(parent) { popupObj.checkDirection(parent); });
				popupObj.fitToWindow();
			});
			popupObj.setPosition();
			angular.element(window).bind("resize", onWindowResizeClosure);
		},
		close: function (documentClickPressed, disableAnimation) {
			//console.log("closing", documentClickPressed, disableAnimation);
			if (this.openStep !== 5) return;
			if (this.launcher.ctrl.keepOpened) return;
			popupObj.openStep = 6;
			popupObj = this;
			this.onClose();
			if (this.popupScope.axTrapFocus) {
				this.popupScope.axTrapFocus.destroy();
				delete this.popupScope.axTrapFocus;
			}
			$document.off('click', documentClickClosure);
			angular.element(window).unbind("resize", onWindowResizeClosure);
			this.checkParentsWithScroll(function (parent) {
				parent.unbind('scroll', bindParentClosure);
			});

			var finalizeClosing = function () {
				//console.log('final closing');
				popupObj.openFinish = false;
				popupObj.openStep = false;
				if (!popupObj.scope.dropdown) return;
				popupObj.$toggleButton.removeClass("popup-opened");
				var popupElement = popupObj.findPopup();
				popupObj.$toggleButton.find('button').removeClass('opened');
				if (!popupElement) return;
				if (!documentClickPressed && !popupElement.hasClass('dropdown-popup-menu')) {
					//console.log('focus', popupObj.$toggleButton.find("button"));
					popupObj.$toggleButton.find(popupObj.isAutocomplete ? "input" : ".dropdown-toggle").focus();
				}
				popupObj.scope.dropdown.ctrl.openFinish = false;
				popupObj.onDestroy();
			};
			dropdownsStack.closePopupsFor(popupObj.popupElement);
			if (popupObj.disableAnimation || disableAnimation) {
				finalizeClosing();
				return;
			}
			var popupElement = popupObj.findPopup();
			if (popupElement.length > 0)
				popupElement.slideHide(popupObj.popupDirection === 'down' ? "top" : "bottom", 300, finalizeClosing);
		},
		documentClick: function (event, fromPropup) {
			var popupObj = this;
			var parents = angular.element(event.target).closest("[uid=" + popupObj.uid + "]");
			var parentFound = parents.length > 0;
			if (!parentFound) {
				$document.off('click', documentClickClosure);
				popupObj.popupScope.$apply(function () {
					popupObj.close(true);
				});
			} else {
				var isCloseBtn = angular.element(event.target).hasClass('ngdialog-close');
				if (isCloseBtn) {
					event.stopPropagation();
					this.close();
				}
			}
		},
		findButton: function () {
			return this.$toggleButton;
		},
		findPopup: function () {
			return this.popupElement;
		},
		parentHasScroll: function (parent) {
			var hasXScroll = parent[0].clientWidth < parent[0].scrollWidth &&
				["scroll", "auto"].indexOf(parent.css("overflow-x")) > -1;
			var hasYScroll = parent[0].clientHeight < parent[0].scrollHeight &&
				["scroll", "auto"].indexOf(parent.css("overflow-y")) > -1;
			var hasScroll = (hasXScroll || hasYScroll) && ["THEAD"].indexOf(parent[0].tagName) === -1;
			return hasScroll;
		},
		onWindowResize: function () {
			var popupObj = this;
			this.popupScope.$apply(function () {
				popupObj.checkParentsWithScroll(function (parent) {
					popupObj.checkPopupState(parent);
				});
				popupObj.fitToWindow();

			});
		},
		checkPopupState: function (parent) {
			var popupElement = this.findPopup();
			var togglePosition = this.$toggleButton.offset();
			var isVisible = popupElement.is(":visible");
			if (parent.currentTarget) parent = angular.element(parent.currentTarget);
			this.setPosition();
			if (togglePosition.top < parent.offset().top ||
				parent.offset().top + parseInt(parent.height()) <
				togglePosition.top + this.toggleHeight ||
				parent.offset().left > togglePosition.left ||
				parent.offset().left + parseInt(parent.outerWidth()) <
				togglePosition.left + this.toggleWidth) {
				if (isVisible) popupElement.hide();
			} else {
				if (!isVisible) popupElement.show();
			}
			//this.checkDirection(parent);
		},
		// checkDirection: function (parent) {
		// 	var popupElement = this.findPopup();
		// 	var top = parseInt(popupElement.css('top'));
		// 	var left = parseInt(popupElement.css('left'));
		// 	if (parent.offset().top + parent.height() < top + this.toggleHeight + popupElement.outerHeight() ||
		// 		window.innerHeight < top + popupElement.outerHeight()) {
		// 		top = this.$toggleButton.offset().top - popupElement.outerHeight();
		// 		this.popupDirection = 'up';
		// 	}
		// 	if (window.innerWidth < left + popupElement.outerWidth()) {
		// 		left = window.innerWidth - popupElement.outerWidth();
		// 	}
		// 	this.popupElement.css({top: top + 'px', left: left + 'px'});
		// },
		fitToWindow: function () {
			var popupElement = this.findPopup();
			var top = parseInt(popupElement.css('top'));
			if (top < 0) {
				if (this.popupDirection === "up") {
					this.popupDirection = "down";
					top = this.$toggleButton.offset().top + this.$toggleButton.height();
					popupElement.css({'top': top, 'bottom': ""});
				}

			}
			var initial = parseInt(popupElement.css('left'));
			var left = popupElement[0].style.right ? "" : parseInt(popupElement.css('left'));
			if (window.innerHeight < top + popupElement.outerHeight()) {
				if (popupElement.outerHeight() < this.$toggleButton.offset().top) {
					top = this.$toggleButton.offset().top - popupElement.outerHeight();
					this.popupDirection = 'up';
				} else {
					top = Math.max(0, window.innerHeight - popupElement.outerHeight());
					this.popupDirection = 'down';
				}
			}
			if (window.innerWidth < left + popupElement.outerWidth()) {
				left = window.innerWidth - popupElement.outerWidth();
				initial = left;
			}
			left = Math.max(0, left);
			if (left >= initial || !parseInt(popupElement.css('left'))) this.popupElement.css({left: left + 'px'});
			if (this.popupDirection === "down") this.popupElement.css({top: top + 'px'});
		},
		setPosition: function (attrs) {
			var togglePosition = this.$toggleButton.offset();
			if (!togglePosition) return;
			var left, top, right, bottom;
			if (attrs) angular.extend(this.attrs, attrs);
			top = togglePosition.top + this.toggleHeight + parseInt(this.attrs.popupRelativeTop || 0);
			top = angular.isDefined(this.attrs.popupAbsoluteTop) ? parseInt(this.attrs.popupAbsoluteTop) : top;
			if (this.attrs.popupAbsoluteBottom) bottom = parseInt(this.attrs.popupAbsoluteBottom);
			if (this.attrs.popupAbsoluteRight) {
				right = parseInt(this.attrs.popupAbsoluteRight);
				left = "";
			}
			else {
				left = togglePosition.left + parseInt(this.attrs.popupRelativeLeft || 0);
				left = angular.isDefined(this.attrs.popupAbsoluteLeft) ? parseInt(this.attrs.popupAbsoluteLeft) : left;
			}
			if (this.popupDirection === "down")
				this.popupElement.css({top: top + 'px', bottom: bottom + 'px', left: (right ? "" : (left + 'px')), right: right + 'px'});
			else {
				bottom = (window.innerHeight - this.$toggleButton.offset().top);
				this.popupElement.css({bottom: bottom + 'px', top: "", left: (right ? "" : (left + 'px')), right: right + 'px'});
			}
			var self = this;
			if (attrs) $timeout(function () {
				self.fitToWindow();
			});
		},
		bindParent: function (parent) {
			var popupObj = this;
			if (!this.popupScope) return;
			this.popupScope.$apply(function () {
				popupObj.checkPopupState(parent);
			});
		},
		checkParentsWithScroll: function (callback) {
			var parents = this.$toggleButton.parents();
			for (var i = 0; i < parents.length; i++) {
				var parent = angular.element(parents[i]);
				if (this.parentHasScroll(parent)) callback(parent);

			}
		}
	};
	if (!$attrs.templateUrl) popupObj.template = $element.html();
	var documentClickClosure = function (event, fromPropup) {
		popupObj.documentClick(event, fromPropup);
	};
	//var documentClickPreventDefault = function(event) {
	//    event.preventDefault();
	//    event.stopPropagation();
	//    event.stopImmediatePropagation();
	//};
	var onWindowResizeClosure = function (event) {
		popupObj.onWindowResize(event);
	};
	var bindParentClosure = function (event) {
		popupObj.bindParent(angular.element(event.currentTarget));
	};
	return popupObj;
}