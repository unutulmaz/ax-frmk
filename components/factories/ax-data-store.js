(function () {
	angular.module("App").factory('axDataStore', factory);
	factory.$inject = ["guidGenerator", "ngDialog"];

	function factory(guidGenerator, ngDialog) {
		var $dataStore = {
			getGuid: guidGenerator.create,
			uid: 1000000,
			axLimit: axDtLimits !== -1 ? axDtLimits : undefined,
			nextUid: function () {
				return $dataStore.uid++;
			},
			getFullSystemName: function () {
				return this.applicationInfo.name + " " + this.applicationInfo.type + " v" + this.applicationInfo.version;
			},
			copyright: function () {
				return this.applicationInfo.copyright;
			},
			isDevelopment: function () {
				if (angular.isDefined(this._isDevelpoment)) return this._isDevelpoment;
				var type = document.getElementById("environment").getAttribute("content");
				this._isDevelpoment = type === 'DEVELOPMENT';
				return this._isDevelpoment;
			},
			scrollerArrowWidth(){
				if (!this._scrollerArrowWidth) this._scrollerArrowWidth = axCssStyle.scrollerArrowWidth();
				return this._scrollerArrowWidth;

			},
			editorToolbarHeight(){
				if (!this._editorToolbarHeight) this._editorToolbarHeight = axCssStyle.editorToolbarHeight();
				return this._editorToolbarHeight;

			},
			formTitleHeight() {
				if (!this._formTitleHeight) this._formTitleHeight = axCssStyle.formTitleHeight();
				return this._formTitleHeight;
			},
			startTime: {},
			timeStamp: function (task, label, stage, table) {
				if (task === false) task = "msg";
				if (task === true) task = "start";
				if (!table) table = this;
				if (table.config) self = table.config;
				else self = table;
				switch (task) {
					case "clear":
						self.timeStampLog = "";
						// console.clear();
						break;
					case "start":
						if (!self.startTime) self.startTime = {};
						self.startTime[label] = {
							start: Date.now(),
							stage: Date.now()
						};
						console.log(label, "starting");
						break;
					default:
						if (self.startTime && self.startTime[label]) {
							// let msg = label + " " + (Date.now() - self.startTime[label].start) + " ms" + (stage ? (" -- Stage: " + stage + " " + (Date.now() - self.startTime[label].stage) + " ms") : " ended: ");
							let stageName = stage ? (label + " - " + stage) : label;
							stageName = stageName.substring(0, 1).toUpperCase() + stageName.substring(1);
							let formatting = ["datasource loaded", "filter executed"].includes(label);
							let time = stage ? (Date.now() - self.startTime[label].stage) : Date.now() - self.startTime[label].start;
							let msg = stageName + (formatting ? (": <strong>" + time.toLocaleString(axLocale) + " ms</strong>") : (": " + time.toLocaleString(axLocale)) + " ms");
							self.timeStampLog += msg + "<br>";
							if (stage) console.info(msg);
							else console.warn(msg);
							if (stage) self.startTime[label].stage = Date.now();
						}
				}
			},
			setMenu: function (currentRole) {
				this.mainNavbar = {};
				for (var i = 0; i < this.menus.length; i++) {
					var roleWithMenu = this.menus[i];
					if (roleWithMenu.RoleId === currentRole.RoleId) {
						this.mainNavbar = {items: roleWithMenu.Menu, showItems: true, isRoot: true};
						if (axAuthConfig.loadRoutesFromMenu) axAuthConfig.loadUserRoutes(roleWithMenu.Menu);
						break;
					}
				}
			},
			metadata: {},
			defaultLoaderSelector: '#right-pane',
			loader: function (selector) {
				var uid = guidGenerator.create();
				var container = createElement("div", {uid: uid, role: 'loader'});
				var overlay = createElement("div", {
					style: "position: absolute;top:0;left: 0;width: 100%;height: 100%;margin: 0",
					role: "loader-overlay"
				});
				container.appendChild(overlay);
				var spinner = createElement("i", {
					class: "fa fa-circle-o-notch fa-spin",
					style: "position: absolute;color: gray;top: 50%;left: 50%;font-size: 30px;margin-top: -15px;margin-left: -15px; z-index: 10000000000000000;"
				});
				container.appendChild(spinner);
				var recipient;
				if (angular.isObject(selector)) recipient = angular.element(selector);
				else recipient = angular.element(selector || 'body');
				if (recipient.length === 0) angular.element(this.defaultLoaderSelector);
				recipient.append(container);
				// console.log("get loader", uid);
				return {
					uid: uid,
					recipient: recipient,
					remove: function () {
						// console.log("remove", this.uid, recipient.find("[uid='" + this.uid + "']"));
						if (recipient[0] && recipient[0].isConnected) recipient.find("[uid='" + this.uid + "']").remove();
						else angular.element("div[role=loader][uid='" + this.uid + "']").remove();
					}
				};

			},
			loadersClear: function () {
				angular.element('[role=loader]').remove();
			},
			popup: {
				open: function (params) {
					var defaultParams = {
						plain: false,
						className: 'ngdialog-theme-plain',
						appendTo: "#right-pane",
						closeByEscape: false,
						closeByDocument: true,
						trapFocus: true,
						preCloseCallback: false
					};
					angular.extend(defaultParams, params);
					defaultParams.template = '/app-modules/gap/' + params.template;
					ngDialog.open(defaultParams);
				},
				closeAll: function () {
					var dialogs = ngDialog.closeAll();
				},
				confirm: function (title, text, scope, yesCallback, noCallback) {
					ngDialog.openConfirm({
						template: "/components/dependencies/ng-dialog/dialog-confirm.html",
						width: '350',
						height: "180;",
						plain: false,
						className: 'ngdialog-theme-plain',
						appendTo: "#right-pane",
						scopeExtend: function () {
							return {
								$confirm: {
									message: text,
									title: title,
									buttons: []
								}
							};
						}
					})
						.then(function () {
								yesCallback();
							},
							function () {
								if (noCallback) noCallback();
							});
				}
			}

		};
		$dataStore.applicationInfo = applicationInfo; // declarata in public-vars.js
		return $dataStore;
	}
}());