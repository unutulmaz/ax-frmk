/*
 * ngDialog - easy modals and popup windows
 * http://github.com/likeastore/ngDialog
 * (c) 2013-2015 MIT License, https://likeastore.com
 */

(function() {
	'use strict';

	var m = angular.module('ngDialog', []);

	var $element = angular.element;
	var isDef = angular.isDefined;
	var style = (document.body || document.documentElement).style;
	var animationEndSupport = isDef(style.animation) ||
		isDef(style.WebkitAnimation) ||
		isDef(style.MozAnimation) ||
		isDef(style.MsAnimation) ||
		isDef(style.OAnimation);
	var animationEndEvent = 'animationend webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend';
	var focusableElementSelector = '.form-control:not([disabled]):not([readonly]), button:not([disabled])';
	var disabledAnimationClass = 'ngdialog-disabled-animation';
	var forceElementsReload = { html: false, body: false };
	var scopes = {};
	var openIdStack = [];
	var keydownIsBound = false;
	var openOnePerName = false;


	m.provider('ngDialog',
		function() {
			var defaults = this.defaults = {
				className: 'ngdialog-theme-default',
				appendClassName: '',
				disableAnimation: false,
				plain: false,
				showClose: false,
				showMaximize: true,
				closeByDocument: false,
				closeByEscape: true,
				closeByNavigation: false,
				appendTo: false,
				preCloseCallback: false,
				overlay: true,
				cache: true,
				trapFocus: false,
				preserveFocus: true,
				ariaAuto: true,
				ariaRole: null,
				ariaLabelledById: null,
				ariaLabelledBySelector: null,
				ariaDescribedById: null,
				ariaDescribedBySelector: null,
				bodyClassName: 'ngdialog-open'
			};

			this.setForceHtmlReload = function(_useIt) {
				forceElementsReload.html = _useIt || false;
			};

			this.setForceBodyReload = function(_useIt) {
				forceElementsReload.body = _useIt || false;
			};

			this.setDefaults = function(newDefaults) {
				angular.extend(defaults, newDefaults);
			};

			this.setOpenOnePerName = function(isOpenOne) {
				openOnePerName = isOpenOne || false;
			};

			var globalID = 0, dialogsCount = 0, closeByDocumentHandler, defers = {};

			this.$get = ['$document', '$templateCache', '$compile', '$q', '$http', '$rootScope', '$timeout', '$window', '$controller', '$injector',
				function($document, $templateCache, $compile, $q, $http, $rootScope, $timeout, $window, $controller, $injector) {
					var $elements = [];
					var publicMethods = {
						// ReSharper disable once VariableUsedBeforeDeclared
						__PRIVATE__: privateMethods,

						/*
						 * @param {Object} options:
						 * - template {String} - id of ng-template, url for partial, plain string (if enabled)
						 * - plain {Boolean} - enable plain string templates, default false
						 * - scope {Object}
						 * - controller {String}
						 * - controllerAs {String}
						 * - className {String} - dialog theme class
						 * - appendClassName {String} - dialog theme class to be appended to defaults
						 * - disableAnimation {Boolean} - set to true to disable animation
						 * - showClose {Boolean} - show close button, default true
						 * - closeByEscape {Boolean} - default true
						 * - closeByDocument {Boolean} - default true
						 * - preCloseCallback {String|Function} - user supplied function name/function called before closing dialog (if set)
						 * - bodyClassName {String} - class added to body at open dialog
						 * @return {Object} dialog
						 */
						open: function(opts) {
							var dialogID = null;
							opts = opts || {};
							if (openOnePerName && opts.name) {
								dialogID = opts.name + ' dialog';
								if (this.isOpen(dialogID)) {
									return;
								}
							}
							var options = angular.copy(defaults);
							var localID = ++globalID;
							dialogID = dialogID || 'ngdialog' + localID;
							openIdStack.push(dialogID);

							angular.extend(options, opts);
							var defer;
							defers[dialogID] = defer = $q.defer();

							var scope;
							scopes[dialogID] = scope = angular.isObject(options.scope) ? options.scope.$new() : $rootScope.$new();
							if (angular.isFunction(opts.scopeExtend)) angular.extend(scope, opts.scopeExtend());
							if (angular.isObject(opts.scopeExtend)) angular.extend(scope, opts.scopeExtend);
							if (opts.params) scope.params = opts.params;
							scope.$parent.dialogResponse = {};
							var $dialog, $dialogParent;

							var resolve = angular.extend({}, options.resolve);

							angular.forEach(resolve,
								function(value, key) {
									resolve[key] = angular.isString(value) ? $injector.get(value) : $injector.invoke(value, null, null, key);
								});

							$q.all({
								template: loadTemplate(options.template || options.templateUrl),
								locals: $q.all(resolve)
							})
								.then(function(setup) {
									var template = setup.template,
										locals = setup.locals;

									if (options.appendTo && angular.isString(options.appendTo)) {
										$dialogParent = angular.element(document.querySelector(options.appendTo));
									} else if (options.appendTo && angular.isObject(options.appendTo)) {
										$dialogParent = angular.element(options.appendTo);
									} else {
										$dialogParent = $elements.body;
									}
									var templateElement = angular.element("<div>" + template + "</div>");
									if (!options.width && templateElement.find(">ax-form").length === 1) {
										let axForm = templateElement.find(">ax-form");
										if (axForm.css("width")) options.width = axForm.css("width");
										if (axForm.css("height")) options.height = axForm.css("height");
									} else {
										let div = templateElement.find(">div");
										if (!options.width && div.length === 1 && div.css("width") && div.css("width") !== "0px") options.width = div.css("width");
										if (!options.height && div.length === 1 && div.css("height") && div.css("height") !== "0px") options.height = div.css("height");
									}

									//var zIndex = axUtils.findHighestZIndex($dialogParent) +1;
                                    if (options.showClose) {
										//template += '<div class="ngdialog-close" style="z-index:' + (zIndex + 10) + '"></div>';
										template += '<div class="ngdialog-close" ></div>';
									}

									//console.log(options);
									var hasOverlayClass = options.overlay ? '' : ' ngdialog-no-overlay';
									//var style = "style='z-index:" + zIndex + "'";
									var style = "";
									$dialog = $element('<div id="' + dialogID + '" class="ngdialog' + hasOverlayClass + '"' + style + '"></div>');
                                    if (options.zIndex !== undefined)  $dialog.css("z-index", options.zIndex);
                                    var content = (options.overlay ? '<div class="ngdialog-overlay"></div>' : "") +
										'<div class="ngdialog-content" role="document" style="max-height:100%;overflow-y:auto;overflow-x:hidden' +
										//(options.height ? ';height:' + options.height + (options.height != "100%"? ';position:absolute;top:50%;margin-top:-' +parseInt(options.height)/2 + 'px':'') : '') +
										//(options.width ? ';width:' + options.width + (options.width != "100%" ? ';left:50%;margin-left:-' + parseInt(options.width) / 2 + 'px' : "") : '') +
										(options.height ? ';height:' + options.height : '') +
										(options.width ? ';width:' + options.width : '') +

										'">' +
										template +
										'</div>';
									$dialog.html(content);

									$dialog.data('$ngDialogOptions', options);

									scope.ngDialogId = dialogID;

									if (options.data && angular.isString(options.data)) {
										var firstLetter = options.data.replace(/^\s*/, '')[0];
										scope.ngDialogData = (firstLetter === '{' || firstLetter === '[') ? angular.fromJson(options.data) : new String(options.data);// jshint ignore:line
										scope.ngDialogData.ngDialogId = dialogID;
									} else if (options.data && angular.isObject(options.data)) {
										scope.ngDialogData = options.data;
										scope.ngDialogData.ngDialogId = dialogID;
									}

									if (options.className) {
										$dialog.addClass(options.className);
										if (options.className.indexOf("ngdialog-theme-plain") === -1) $dialog.addClass("ngdialog-theme-plain");
									} else $dialog.addClass("ngdialog-theme-plain");

									if (options.appendClassName) {
										$dialog.addClass(options.appendClassName);
									}

									if (options.disableAnimation) {
										$dialog.addClass(disabledAnimationClass);
									}


									privateMethods.applyAriaAttributes($dialog, options);

									if (options.preCloseCallback) {
										var preCloseCallback;

										if (angular.isFunction(options.preCloseCallback)) {
											preCloseCallback = options.preCloseCallback;
										} else if (angular.isString(options.preCloseCallback)) {
											if (scope) {
												if (angular.isFunction(scope[options.preCloseCallback])) {
													preCloseCallback = scope[options.preCloseCallback];
												} else if (scope.$parent &&
													angular.isFunction(scope.$parent[options.preCloseCallback])) {
													preCloseCallback = scope.$parent[options.preCloseCallback];
												} else if ($rootScope &&
													angular.isFunction($rootScope[options.preCloseCallback])) {
													preCloseCallback = $rootScope[options.preCloseCallback];
												}
											}
										}

										if (preCloseCallback) {
											$dialog.data('$ngDialogPreCloseCallback', preCloseCallback);
										}
									}

									scope.popupClose = scope.closeThisDialog = function (value) {
										opts.scopeExtend = undefined;
										privateMethods.closeDialog($dialog, value);
									};
									if (opts.scopeExtend) opts.scopeExtend.popupClose = scope.popupClose; 
									scope.toggleMaximize = function(event) {
										let element = $dialog[0];
										scope.$$maximized = !scope.$$maximized;
										if (scope.$$maximized) {
											angular.element(element).find(".ngdialog-toggle-maximize").removeClass("fa-window-maximize").addClass("fa-window-restore");
											angular.element(element).find(">.ngdialog-content").addClass("maximized");
										} else {
											angular.element(element).find(".ngdialog-toggle-maximize").addClass("fa-window-maximize").removeClass("fa-window-restore");
											angular.element(element).find(">.ngdialog-content").removeClass("maximized");
										}
									};
									scope.options = options;

									if (options.controller &&
										(angular.isString(options.controller) ||
											angular.isArray(options.controller) ||
											angular.isFunction(options.controller))) {

										var label;

										if (options.controllerAs && angular.isString(options.controllerAs)) {
											label = options.controllerAs;
										}

										var controllerInstance = $controller(options.controller,
											angular.extend(
												locals,
												{
													$scope: scope,
													$element: $dialog
												}),
											true,
											label
										);

										if (options.bindToController) {
											angular.extend(controllerInstance.instance,
												{
													ngDialogId: scope.ngDialogId,
													ngDialogData: scope.ngDialogData,
													closeThisDialog: scope.closeThisDialog,
													popupClose: scope.closeThisDialog
												});
										}

										$dialog.data('$ngDialogControllerController', controllerInstance());
									}

									$timeout(function() {
										var $activeDialogs = document.querySelectorAll('.ngdialog');
										privateMethods.deactivateAll($activeDialogs);

										$compile($dialog)(scope);
										var axTables = $dialog.find('ax-table');
										if (axTables.length > 0)
											$timeout(function() {
												axTables.each(function(index, axTableHolder) {
													//console.log('holder', angular.element(axTableHolder).scope());
													var scope = angular.element(axTableHolder).scope();
													if (scope ) scope.$ctrl.$layout.set.global();
												});
											});
										var widthDiffs = $window.innerWidth - $elements.body.prop('clientWidth');
										$elements.html.addClass(options.bodyClassName);
										$elements.body.addClass(options.bodyClassName);
										var scrollBarWidth =
											widthDiffs - ($window.innerWidth - $elements.body.prop('clientWidth'));
										if (scrollBarWidth > 0) {
											privateMethods.setBodyPadding(scrollBarWidth);
										}
										$dialogParent.append($dialog);

										privateMethods.activate($dialog);

										let content = $dialog.find(">.ngdialog-content");
										if (content[0].style.height !== "100%") {
											var height = content.height();
											if (height > 0) content.css("top", "-2000px");
										}
										$timeout(function() {
											if (content[0].style.height !== "100%") {
												content[0].style.top = "";
												content[0].style["margin-top"] = "";
												if (content.height() > 0) content[0].style.cssText += "top:50% ;margin-top:-" + content.height() / 2 + "px ";
												content.addClass("loaded");
											}
											if (options.trapFocus) {
												var trapFocus = new axTrapFocus($dialog, scope);
												trapFocus.autoFocus();
											}
										});


										if (options.name) {
											$rootScope
												.$broadcast('ngDialog.opened',
												{ dialog: $dialog, name: options.name });
										} else {
											$rootScope.$broadcast('ngDialog.opened', $dialog);
										}
									});

									if (!keydownIsBound) {
										$elements.body.bind('keydown', privateMethods.onDocumentKeydown);
										keydownIsBound = true;
									}

									if (options.closeByNavigation) {
										var eventName = privateMethods.getRouterLocationEventName();
										$rootScope.$on(eventName,
											function() {
												privateMethods.closeDialog($dialog);
											});
									}

									if (options.preserveFocus) {
										$dialog.data('$ngDialogPreviousFocus', document.activeElement);
									}

									closeByDocumentHandler = function(event) {
										var isOverlay = options.closeByDocument ? $element(event.target).hasClass('ngdialog-overlay') : false;
										var isCloseBtn = $element(event.target).hasClass('ngdialog-close');
										//blocheaza inchiderea altor elemente: dropdowns, etc 
										if (isCloseBtn) event.stopPropagation();

										if (isOverlay || isCloseBtn) {
											publicMethods.close($dialog.attr('id'), isCloseBtn ? '$closeButton' : '$document');
										}
									};

									if (typeof $window.Hammer !== 'undefined') {
										var hammerTime = scope.hammerTime = $window.Hammer($dialog[0]);
										hammerTime.on('tap', closeByDocumentHandler);
									} else {
										$dialog.bind('click', closeByDocumentHandler);
									}

									dialogsCount += 1;

									return publicMethods;
								});

							return {
								id: dialogID,
								closePromise: defer.promise,
								close: function(value) {
									privateMethods.closeDialog($dialog, value);
								}
							};

							function loadTemplateUrl(tmpl, config) {
								$rootScope.$broadcast('ngDialog.templateLoading', tmpl);
								tmpl = axUtils.addVersion(tmpl);
								return $http.get(tmpl, (config || {}))
									.then(function(res) {
										$rootScope.$broadcast('ngDialog.templateLoaded', tmpl);
										return res.data || '';
									});
							}

							function loadTemplate(tmpl) {
								if (!tmpl) {
									return 'Empty template';
								}

								if (angular.isString(tmpl) && options.plain) {
									return tmpl;
								}

								if (typeof options.cache === 'boolean' && !options.cache) {
									return loadTemplateUrl(tmpl, { cache: false });
								}

								return loadTemplateUrl(tmpl, { cache: $templateCache });
							}
						},

						/*
						 * @param {Object} options:
						 * - template {String} - id of ng-template, url for partial, plain string (if enabled)
						 * - plain {Boolean} - enable plain string templates, default false
						 * - name {String}
						 * - scope {Object}
						 * - controller {String}
						 * - controllerAs {String}
						 * - className {String} - dialog theme class
						 * - appendClassName {String} - dialog theme class to be appended to defaults
						 * - showClose {Boolean} - show close button, default true
						 * - closeByEscape {Boolean} - default false
						 * - closeByDocument {Boolean} - default false
						 * - preCloseCallback {String|Function} - user supplied function name/function called before closing dialog (if set); not called on confirm
						 * - bodyClassName {String} - class added to body at open dialog
						 *
						 * @return {Object} dialog
						 */
						openConfirm: function(opts) {
							var defer = $q.defer();
							var options = angular.copy(defaults);

							opts = opts || {};
							angular.extend(options, opts);

							options.scope = angular.isObject(options.scope) ? options.scope.$new() : $rootScope.$new();
              if (angular.isFunction(options.scopeExtend)) angular.extend(options.scope, options.scopeExtend());
              if (angular.isObject(options.scopeExtend)) angular.extend(options.scope, options.scopeExtend);

							options.scope.confirm = function(value) {
								defer.resolve(value);
								var $dialog = $element(document.getElementById(openResult.id));
								privateMethods.performCloseDialog($dialog, value);
							};

							var openResult = publicMethods.open(options);
							if (openResult) {
								openResult.closePromise.then(function(data) {
									if (data) {
										return defer.reject(data.value);
									}
									return defer.reject();
								});
								return defer.promise;
							}
						},

						isOpen: function(id) {
							var $dialog = $element(document.getElementById(id));
							return $dialog.length > 0;
						},

						/*
						 * @param {String} id
						 * @return {Object} dialog
						 */
						close: function(id, value) {
							var $dialog = $element(document.getElementById(id));

							if ($dialog.length) {
								privateMethods.closeDialog($dialog, value);
							} else {
								if (id === '$escape') {
									var topDialogId = openIdStack[openIdStack.length - 1];
									$dialog = $element(document.getElementById(topDialogId));
									if ($dialog.data('$ngDialogOptions').closeByEscape) {
										privateMethods.closeDialog($dialog, '$escape');
									}
								} else {
									publicMethods.closeAll(value);
								}
							}

							return publicMethods;
						},

						closeAll: function(value) {
							var $all = document.querySelectorAll('.ngdialog');

							// Reverse order to ensure focus restoration works as expected
							for (var i = $all.length - 1; i >= 0; i--) {
								var dialog = $all[i];
								privateMethods.closeDialog($element(dialog), value, true);
							}
						},

						getOpenDialogs: function() {
							return openIdStack;
						},

						getDefaults: function() {
							return defaults;
						}
					};
					var focusToElement = function(element) {
						//console.log("element to focus", element);
						if (element.tabIndex === -1) {
							var focusable = angular.element(element).find("[tabIndex=0]");
							if (focusable.length === 0) return;
							//console.log("find element", focusable[0]);
							focusable[0].focus();
						} else element.focus();
					};

					var privateMethods = {
						onDocumentKeydown: function(event) {
							if (event.keyCode === 27) {
								publicMethods.close('$escape');
							}
						},

						activate: function($dialog) {
							var options = $dialog.data('$ngDialogOptions');

							if (options.trapFocus) {
								//$dialog.on('keydown', privateMethods.onTrapFocusKeydown);

								// Catch rogue changes (eg. after unfocusing everything by clicking a non-focusable element)
								//$elements.body.on('keydown', privateMethods.onTrapFocusKeydown);
							}
						},

						deactivate: function($dialog) {
							$dialog.off('keydown', privateMethods.onTrapFocusKeydown);
							$elements.body.off('keydown', privateMethods.onTrapFocusKeydown);
						},

						deactivateAll: function(els) {
							angular.forEach(els,
								function(el) {
									var $dialog = angular.element(el);
									privateMethods.deactivate($dialog);
								});
						},

						setBodyPadding: function(width) {
							var originalBodyPadding = parseInt(($elements.body.css('padding-right') || 0), 10);
							$elements.body.css('padding-right', (originalBodyPadding + width) + 'px');
							$elements.body.data('ng-dialog-original-padding', originalBodyPadding);
							$rootScope.$broadcast('ngDialog.setPadding', width);
						},

						resetBodyPadding: function() {
							var originalBodyPadding = $elements.body.data('ng-dialog-original-padding');
							if (originalBodyPadding) {
								$elements.body.css('padding-right', originalBodyPadding + 'px');
							} else {
								$elements.body.css('padding-right', '');
							}
							$rootScope.$broadcast('ngDialog.setPadding', 0);
						},

						performCloseDialog: function($dialog, value) {
							var options = $dialog.data('$ngDialogOptions');
							var id = $dialog.attr('id');
							var scope = scopes[id];

							if (!scope) {
								// Already closed
								return;
							}

							if (typeof $window.Hammer !== 'undefined') {
								var hammerTime = scope.hammerTime;
								hammerTime.off('tap', closeByDocumentHandler);
								if (hammerTime.destroy) hammerTime.destroy();
								delete scope.hammerTime;
							} else {
								$dialog.unbind('click');
							}

							if (dialogsCount === 1) {
								$elements.body.unbind('keydown', privateMethods.onDocumentKeydown);
							}

							if (!$dialog.hasClass('ngdialog-closing')) {
								dialogsCount -= 1;
							}

							var previousFocus = $dialog.data('$ngDialogPreviousFocus');
							if (previousFocus && previousFocus.focus) {
								previousFocus.focus();
							}

							$rootScope.$broadcast('ngDialog.closing', $dialog, value);

							dialogsCount = dialogsCount < 0 ? 0 : dialogsCount;
							if (animationEndSupport && !options.disableAnimation) {
								scope.$destroy();
								$dialog.unbind(animationEndEvent)
									.bind(animationEndEvent,
									function() {
										privateMethods.closeDialogElement($dialog, value);
									})
									.addClass('ngdialog-closing');
							} else {
								scope.$destroy();
								privateMethods.closeDialogElement($dialog, value);
							}
							if (defers[id]) {
								defers[id].resolve({
									id: id,
									value: value,
									$dialog: $dialog,
									remainingDialogs: dialogsCount
								});
								delete defers[id];
							}
							if (scopes[id]) {
								delete scopes[id];
							}
							openIdStack.splice(openIdStack.indexOf(id), 1);
							if (!openIdStack.length) {
								$elements.body.unbind('keydown', privateMethods.onDocumentKeydown);
								keydownIsBound = false;
							}
						},

						closeDialogElement: function($dialog, value) {
							var options = $dialog.data('$ngDialogOptions');
							$dialog.remove();
							if (dialogsCount === 0) {
								$elements.html.removeClass(options.bodyClassName);
								$elements.body.removeClass(options.bodyClassName);
								privateMethods.resetBodyPadding();
							}
							$rootScope.$broadcast('ngDialog.closed', $dialog, value);
						},

						closeDialog: function($dialog, value, fromCloseAll) {

							dropdownsStack.closePopupsFor($dialog);

							var preCloseCallback = $dialog.data('$ngDialogPreCloseCallback');

							if (!fromCloseAll && preCloseCallback && angular.isFunction(preCloseCallback)) {

								var preCloseCallbackResult = preCloseCallback.call($dialog, value);

								if (angular.isObject(preCloseCallbackResult)) {
									if (preCloseCallbackResult.closePromise) {
										preCloseCallbackResult.closePromise.then(function() {
											privateMethods.performCloseDialog($dialog, value);
										});
									} else {
										preCloseCallbackResult.then(function() {
											privateMethods.performCloseDialog($dialog, value);
										},
											function() { });
									}
								} else if (preCloseCallbackResult !== false) {
									privateMethods.performCloseDialog($dialog, value);
								}
							} else {
								privateMethods.performCloseDialog($dialog, value);
							}
						},

						onTrapFocusKeydown: function(ev) {
							var el = angular.element(ev.currentTarget);
							var $dialog;

							if (el.hasClass('ngdialog')) {
								$dialog = el;
							} else {
								$dialog = privateMethods.getActiveDialog();

								if ($dialog === null) {
									return;
								}
							}

							var isTab = (ev.keyCode === 9);
							var backward = (ev.shiftKey === true);

							if (isTab) {
								privateMethods.handleTab($dialog, ev, backward);
							}
						},

						handleTab: function($dialog, ev, backward) {
							var focusableElements = privateMethods.getFocusableElements($dialog);
							//console.log("-----------------------------------------------------------");
							if (focusableElements.length === 0) {
								if (document.activeElement) {
									document.activeElement.blur();
								}
								return;
							}

							var currentFocus = angular.element(document.activeElement).closest(".form-control");
							if (currentFocus.length > 0) currentFocus = currentFocus[0];
							else currentFocus = document.activeElement;
							//console.log("current focus", currentFocus);
							//console.log("focusable", focusableElements);
							var focusIndex = -1;
							for (var i = 0; i < focusableElements.length; i++) {
								if (focusableElements[i].outerHTML === currentFocus.outerHTML) {
									focusIndex = i;
									break;
								}
							}
							//var focusIndex = Array.prototype.indexOf.call(focusableElements, currentFocus);
							//console.log("focus: ", focusIndex);
							var isFocusIndexUnknown = (focusIndex === -1);
							var isFirstElementFocused = (focusIndex === 0);
							var isLastElementFocused = (focusIndex === focusableElements.length - 1);

							var cancelEvent = false;
							//console.log("status", isFocusIndexUnknown, isFirstElementFocused, isLastElementFocused);

							if (backward) {
								if (isFocusIndexUnknown || isFirstElementFocused) {
									focusToElement(focusableElements[focusableElements.length - 1]);
								} else {
									focusToElement(focusableElements[focusIndex - 1]);
								}
							} else {
								if (isFocusIndexUnknown || isLastElementFocused) {
									focusToElement(focusableElements[0]);
									//console.log("focus to first", focusableElements[0]);
								} else {
									focusToElement(focusableElements[focusIndex + 1]);
								}
							}
							cancelEvent = true;

							if (cancelEvent) {
								ev.preventDefault();
								ev.stopPropagation();
							}
						},

						autoFocus: function($dialog) {
							var dialogEl = $dialog[0];

							// Browser's (Chrome 40, Forefix 37, IE 11) don't appear to honor autofocus on the dialog, but we should
							var autoFocusEl = dialogEl.querySelector('*[autofocus]');
							if (autoFocusEl !== null) {
								focusToElement(autoFocusEl[0]);

								if (document.activeElement === autoFocusEl[0]) {
									return;
								}

								// Autofocus element might was display: none, so let's continue
							}
							$timeout(function() {
								var focusableElements = privateMethods.getFocusableElements($dialog);

								if (focusableElements.length > 0) {
									//console.log("autofocus focusable", focusableElements);
									focusToElement(focusableElements[0]);
									return;
								}

								// We need to focus something for the screen readers to notice the dialog
								var contentElements = privateMethods
									.filterVisibleElements(dialogEl.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span'));

								if (contentElements.length > 0) {
									var contentElement = contentElements[0];
									$element(contentElement).attr('tabindex', '-1').css('outline', '0');
									contentElement.focus();
								}
							});
						},

						getFocusableElements: function($dialog) {
							var dialogEl = $dialog[0];

							var rawElements = dialogEl.querySelectorAll(focusableElementSelector);

							// Ignore untabbable elements, ie. those with tabindex = -1
							var tabbableElements = privateMethods.filterTabbableElements(rawElements);

							return privateMethods.filterVisibleElements(tabbableElements);
						},

						filterTabbableElements: function(els) {
							var tabbableFocusableElements = [];

							for (var i = 0; i < els.length; i++) {
								var el = els[i];

								if ($element(el).attr('tabindex') !== '-1') {
									tabbableFocusableElements.push(el);
								}
							}

							return tabbableFocusableElements;
						},

						filterVisibleElements: function(els) {
							var visibleFocusableElements = [];

							for (var i = 0; i < els.length; i++) {
								var el = els[i];

								if (el.offsetWidth > 0 || el.offsetHeight > 0) {
									visibleFocusableElements.push(el);
								}
							}

							return visibleFocusableElements;
						},

						getActiveDialog: function() {
							var dialogs = document.querySelectorAll('.ngdialog');

							if (dialogs.length === 0) {
								return null;
							}

							// TODO: This might be incorrect if there are a mix of open dialogs with different 'appendTo' values
							return $element(dialogs[dialogs.length - 1]);
						},

						applyAriaAttributes: function($dialog, options) {
							if (options.ariaAuto) {
								if (!options.ariaRole) {
									var detectedRole = (privateMethods.getFocusableElements($dialog).length > 0) ? 'dialog' : 'alertdialog';

									options.ariaRole = detectedRole;
								}

								if (!options.ariaLabelledBySelector) {
									options.ariaLabelledBySelector = 'h1,h2,h3,h4,h5,h6';
								}

								if (!options.ariaDescribedBySelector) {
									options.ariaDescribedBySelector = 'article,section,p';
								}
							}

							if (options.ariaRole) {
								$dialog.attr('role', options.ariaRole);
							}

							privateMethods.applyAriaAttribute(
								$dialog,
								'aria-labelledby',
								options.ariaLabelledById,
								options.ariaLabelledBySelector);

							privateMethods.applyAriaAttribute(
								$dialog,
								'aria-describedby',
								options.ariaDescribedById,
								options.ariaDescribedBySelector);
						},

						applyAriaAttribute: function($dialog, attr, id, selector) {
							if (id) {
								$dialog.attr(attr, id);
							}

							if (selector) {
								var dialogId = $dialog.attr('id');

								var firstMatch = $dialog[0].querySelector(selector);

								if (!firstMatch) {
									return;
								}

								var generatedId = dialogId + '-' + attr;

								$element(firstMatch).attr('id', generatedId);

								$dialog.attr(attr, generatedId);

								return generatedId;
							}
						},

						detectUIRouter: function() {
							//Detect if ui-router module is installed if not return false
							try {
								angular.module('ui.router');
								return true;
							} catch (err) {
								return false;
							}
						},

						getRouterLocationEventName: function() {
							if (privateMethods.detectUIRouter()) {
								return '$stateChangeSuccess';
							}
							return '$locationChangeSuccess';
						}
					};

					angular.forEach(
						['html', 'body'],
						function(elementName) {
							$elements[elementName] = $document.find(elementName);
							if (forceElementsReload[elementName]) {
								var eventName = privateMethods.getRouterLocationEventName();
								$rootScope.$on(eventName,
									function() {
										$elements[elementName] = $document.find(elementName);
									});
							}
						}
					);

					return publicMethods;
				}
			];
		});

	m.directive('ngDialog',
		[
			'ngDialog', function(ngDialog) {
				return {
					restrict: 'A',
					scope: {
						ngDialogScope: '='
					},
					link: function(scope, elem, attrs) {
						elem.on('click',
							function(e) {
								e.preventDefault();

								var ngDialogScope = angular.isDefined(scope.ngDialogScope) ? scope.ngDialogScope : 'noScope';
								if (angular.isDefined(attrs.ngDialogClosePrevious)) ngDialog.close(attrs.ngDialogClosePrevious);

								var defaults = ngDialog.getDefaults();

								ngDialog.open({
									template: attrs.ngDialog,
									className: attrs.ngDialogClass || defaults.className,
									appendClassName: attrs.ngDialogAppendClass,
									controller: attrs.ngDialogController,
									controllerAs: attrs.ngDialogControllerAs,
									bindToController: attrs.ngDialogBindToController,
									scope: ngDialogScope,
									data: attrs.ngDialogData,
									showClose: attrs.ngDialogShowClose === 'false' ? false : (attrs.ngDialogShowClose === 'true' ? true : defaults.showClose),
									closeByDocument: attrs.ngDialogCloseByDocument === 'false' ? false : (attrs.ngDialogCloseByDocument === 'true' ? true : defaults.closeByDocument),
									closeByEscape: attrs.ngDialogCloseByEscape === 'false' ? false : (attrs.ngDialogCloseByEscape === 'true' ? true : defaults.closeByEscape),
									overlay: attrs.ngDialogOverlay === 'false' ? false : (attrs.ngDialogOverlay === 'true' ? true : defaults.overlay),
									preCloseCallback: attrs.ngDialogPreCloseCallback || defaults.preCloseCallback,
									bodyClassName: attrs.ngDialogBodyClass || defaults.bodyClassName
								});
							});
					}
				};
			}
		]);

	return m;
}());
//);