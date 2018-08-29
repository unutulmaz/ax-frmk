(function (window, angular) {

	angular.module("App").directive('axScroller', directive);
	directive.$inject = ["$window", "$timeout", "axDataStore"];

	function directive($window, $timeout, axDataStore) {
		return {
			restrict: 'A',
			// priority: 1,
			scope: false,
			compile: function (tElement, attrs) {
				if (attrs.axScroller === "false") return;
				tElement.originalContent = tElement.html();
				var scroller = {
					setStyle: function () {
						tElement.css({'overflow': 'hidden'});
					},
					hScrollbarArrow: function () {
						return axDataStore.scrollerArrowWidth();
					},
					createHorizontalScrollbar: function (host) {
						var width = (scroller.hScrollbarArrow() - 1);
						var leftSide = createElement('div',
							{
								role: "toolbar-left",
								class: "inline",
								style: "position:absolute !important;top:0;bottom:0;left:0;padding-left:5px;width:auto;padding-right:" + width + "px"
							});
						//leftSide.style.width = "";
						//leftSide.style.cssText += "width:auto!important;"
						var leftSideWrapper = createElement('div',
							{
								role: "toolbar-wrapper",
								style: "position:relative !important;width:auto;display:inline-flex;vertical-align:middle"
							});
						var leftArrow = createElement('span',
							{
								role: 'left-arrow',
								class: 'fa fa-caret-left',
								style: 'text-align:center;position:absolute;top:0;right:0;width:' + width + 'px;'
							});

						var hasLeftContent = false;
						let popup = createElement("ax-dropdown-popup",
							{
								btnClass: "btn icon scroller-bars-btn",
								dontRegisterToStack: "",
								popupClass: "scroller-popup-menu",
								caretClass: "fa fa-bars",
								style: "margin: auto 0;"
							}, "");
						popup.setAttribute("ng-if", "!isWideEnough");
						let popupContent = createElement("div", {
							ngIf: "true",
							ngClick: "$event.stopPropagation()",
							ngInit: "$ctrl=launcher.$parent.$ctrl"
						});
						createElement("div", {class: "ngdialog-close", ngClick: "launcher.close()"}, "", popupContent);
						tElement.find('>*[toolbar=left]').each(function (index, element) {
							element.removeAttribute("toolbar");
							createElement("div", {class: "scroller-menu-option"}, element.outerHTML, popupContent);
							if (tElement.hasAttribute("min-width")) {
								let ngIf = element.hasAttribute("ng-if") ? (element.getAttribute("ng-if") + " && ") : "";
								ngIf += "isWideEnough";
								element.setAttribute("ng-if", ngIf);
							}
							leftSideWrapper.appendChild(element);
							hasLeftContent = true;
						});
						if (!hasLeftContent) leftSide.style['padding-left'] = "0px";

						tElement.find('>*').not('[toolbar]').each(function (index, element) {

							createElement("div", {class: "scroller-menu-option"}, element.outerHTML, popupContent);
							if (tElement.hasAttribute("min-width")) {
								let ngIf = element.hasAttribute("ng-if") ? (element.getAttribute("ng-if") + " && ") : "";
								ngIf += "isWideEnough";
								element.setAttribute("ng-if", ngIf);
							}
						});
						width = (scroller.hScrollbarArrow() - 1);
						var rightSide = createElement('div',
							{
								role: "toolbar-right",
								class: "inline",
								style: "position:absolute !important;top:0;bottom:0;right:0;width:auto!important;padding-left:" + (width + 10) + 'px'
							});
						var rightSideWrapper = createElement('div',
							{
								role: "toolbar-wrapper",
								style: "position:relative !important;width:auto"
							});
						var rightArrow = createElement('span',
							{
								role: 'right-arrow',
								class: 'fa fa-caret-right',
								style: 'text-align:center;position:absolute;top:0;left:0px;bottom:0;width:' + width + 'px;'
							});
						var hasRightContent = false;
						tElement.find('>*[toolbar=right]').each(function (index, element) {
							createElement("div", {class: "scroller-menu-option"}, element.outerHTML, popupContent);
							element.removeAttribute("toolbar");
							rightSideWrapper.appendChild(element);
							if (tElement.hasAttribute("min-width")) {
								let ngIf = element.hasAttribute("ng-if") ? (element.getAttribute("ng-if") + " && ") : "";
								ngIf += "isWideEnough";
								element.setAttribute("ng-if", ngIf);
							}
							hasRightContent = true;
						});
						if (!hasRightContent) rightSide.style['padding-left'] = (width + 10) + "px";
						rightSide.appendChild(rightSideWrapper);
						rightSide.appendChild(rightArrow);

						popup.appendChild(popupContent);
						if (tElement.hasAttribute("min-width")) leftSideWrapper.innerHTML = popup.outerHTML + leftSideWrapper.innerHTML;
						leftSide.appendChild(leftSideWrapper);
						leftSide.appendChild(leftArrow);
						angular.element(host).find(">div>div[role=scroller-content]>*[toolbar]").remove();
						if (tElement.hasAttribute("min-width"))
							angular.element(host).find(">div>div[role=scroller-content]>*").each(function (i, element) {
								let ngIf = element.hasAttribute("ng-if") ? (element.getAttribute("ng-if") + " && ") : "";
								ngIf += "isWideEnough";
								element.setAttribute("ng-if", ngIf);
							});
						host.appendChild(leftSide);
						host.appendChild(rightSide);

					},
					createWrapper: function () {
						var div = createElement('div', {style: "position:relative !important;width:100%;height:100%;overflow:hidden"});
						tElement.html(div.outerHTML);
					},
					createContainer: function () {
						var container = createElement('div', {
							role: 'scroller-container',
							style: 'overflow:hidden !important;position:relative;width:auto !important;padding-left:5px !important;padding-right:' + scroller.hScrollbarArrow() + 'px !important',

						});
						var content = createElement('div', {
							role: 'scroller-content',
							style: "margin-top:0px;width:initial !important;",
							class: tElement[0].classList + " inline"
						});
						content.innerHTML = tElement.originalContent;
						container.appendChild(content);
						return container;
					},
					create: function () {
						this.type = attrs.axScroller;
						this.scrollbarClass = attrs.scrollbarClass || 'horizontal';
						this.arrowsFontSize = attrs.arrowsFontSize || 'smaller';
						this.setStyle();
						this.scrollerContent = tElement.contents();
						var wrapper = createElement('div', {role: 'wrapper', style: "position:relative !important;width:100%;height:100%;overflow:hidden"});
						wrapper.addClass(this.scrollbarClass);
						wrapper.appendChild(this.createContainer());
						this.createHorizontalScrollbar(wrapper);
						tElement[0].setAttribute("scroll-disabled", "");
						tElement.html(wrapper.outerHTML);
					}
				};
				scroller.create();
				return {
					post: function ($scope, $element, $attrs) {
						var parents = tElement.parents();
						var content = $element.find('[role=scroller-content]');
						if (content.length === 0) return;
						var contentStyle = $window.getComputedStyle(content[0]);
						var scrollContainer = $element.find('[role=scroller-container]');
						var elementStyle = $window.getComputedStyle($element[0]);
						let minContentWidth = $element.hasAttribute("min-width") ? parseInt($element.getAttribute("min-width")) : 0;
						$scope.isWideEnough = true;
						var horizontalScrollbar = {
							leftArrow: $element.find('[role=left-arrow]'),
							rightArrow: $element.find('[role=right-arrow]'),
							visibleWidth: function () {
								var width = $element.width() - this.marginLeft() - this.marginRight();
								return width;
							},
							changesAll: function () {
								var amount = parseFloat(elementStyle.width) + content.width();
								//console.log(amount, parseFloat(elementStyle.width), this.marginLeft(), this.marginRight(), content.width());
								return amount;
							},
							marginLeft: function () {
								return $element.find('[role=toolbar-left]').outerWidth();
							},
							marginRight: function () {
								return $element.find('[role=toolbar-right]').outerWidth();
							},
							maxLeft: function () {
								if (this.scrollDisabled) return 0;
								return content.width() - this.visibleWidth() + 10;
							},
							setContentScrollLeft: function (scrollLeft) {
								if (scrollLeft === scrollContainer.scrollLeft()) return;
								scrollContainer.scrollLeft(scrollLeft);
							},
							mouseLeftArrowClick: function (event) {
								event.stopPropagation();
								this.moveContentLeft(1);
							},
							mouseRightArrowClick: function (event) {
								event.stopPropagation();
								this.moveContentLeft(-1);
							},
							moveContentLeft: function (delta) {
								if (this.scrollDisabled) return;
								var oldScrollLeft = scrollContainer.scrollLeft();
								var scrollUnit = this.visibleWidth();

								var scrollLeft = oldScrollLeft - (delta * scrollUnit);
								if (scrollLeft < 0) scrollLeft = 0;
								else if (scrollLeft > this.maxLeft()) scrollLeft = this.maxLeft();
								this.setContentScrollLeft(scrollLeft);
							},
							broadcastScrollEvent: function () {
								var scrollEvent = new Event('scroll');
								scrollEvent.scrollLeft = scrollContainer.scrollLeft();
								$element[0].dispatchEvent(scrollEvent);
							},
							setRelatedDims: function () {
								content.css('padding-left', this.marginLeft() + 'px');
								content.css('padding-right', this.marginRight() + 'px');
								this.leftArrow.css('line-height', $element.outerHeight() + 'px');
								this.rightArrow.css('line-height', $element.outerHeight() + 'px');
								this.scrollDisabled = this.visibleWidth() < 0 || this.visibleWidth() > content.width();
								//console.log("ax-scroller", this.marginLeft(),content.css('padding-left'));
								//console.log("ax-scroller", this.scrollDisabled, "visible-width", this.visibleWidth(), "content-width", content.width());
								$scope.isWideEnough = $element.width() > minContentWidth;
								if (!$scope.isWideEnough) this.scrollDisabled = true;
								if (this.scrollDisabled) $element.attr('scroll-disabled', '');
								else $element.removeAttr('scroll-disabled');
							},
							bindEvents: function () {
								var self = this;
								axUtils.addEventListener(this.leftArrow[0], 'click', function (event) {
									self.mouseLeftArrowClick(event);
								});
								axUtils.addEventListener(this.rightArrow[0], 'click', function (event) {
									self.mouseRightArrowClick(event);
								});
								var setRelatedDims = function (event) {
									self.setRelatedDims(event);
								};
								var timeoutRelatedDims = function () {
									$timeout(function () {
										setRelatedDims();
									});
								};
								axUtils.addEventListener($window, 'resize', setRelatedDims);
								axUtils.addEventListener($window, 'axScrollerRefresh', timeoutRelatedDims);
								//var resizer = new ResizeObserver(setRelatedDims).observe(content);
								$scope.$watchCollection({
									left: self.marginLeft(),
									right: self.marginRight(),
									elementWidth: elementStyle.width,
									contentWidth: contentStyle.width
								}, setRelatedDims);

								$scope.$on("$destroy",
									function () {
										axUtils.removeEventListener($window, 'resize', setRelatedDims);
										axUtils.removeEventListener($window, 'axScrollerRefresh', timeoutRelatedDims);
									});
							}
						};
						$timeout(function () {
							horizontalScrollbar.bindEvents();
						}, 300);

					}
				};
			}

		};
	}
})(window, angular);