(function () {
	var module = angular.module('ax.components');
	var bindings = {};

	module.component('axCodeTabs', {
		bindings: bindings,
		template: controlTemplate,
		controller: controlController
	});
	controlTemplate.$inject = ["$element", "$attrs"];

	function controlTemplate($element, $attrs) {
		$attrs.initialHtml = $element[0].outerHTML;
		var templateString = `
		<ax-tabs layout="row"
	         tabs-titles="['Result','Html','Javascript']"
	         style="height: 100%"
	         initial-select="'Result'">
		<ax-tab-view tab-title="Result" ></ax-tab-view>
		<ax-tab-view tab-title="Html">
			<div style="overflow-x: auto;overflow-y:scroll;max-height:100%">
				<div ng-repeat='file in $parent.$ctrl.htmlFiles' style='position:relative;' url="{{file.url}}">
					<label >Source: {{file.url}}</label>
					<pre ng-bind="file.code">
					</pre>
					<button class="btn icon toggle-show fa fa-caret-down"></button>
					<button class="btn form-control copy-code"><i class="fa fa-copy"></i>Copy</button>
				</div>
			</div>
		</ax-tab-view>
		<ax-tab-view tab-title="Javascript">
			<div style="overflow-x: auto;overflow-y:scroll;max-height:100%">
				<div ng-repeat='file in $parent.$ctrl.jsFiles' style='position:relative;' url="{{file.url}}">
					<label >Source: {{file.url}}</label>
					<pre ng-bind="file.code">
					</pre>
					<button class="btn icon toggle-show fa fa-caret-down"></button>
					<button class="btn form-control copy-code"><i class="fa fa-copy"></i>Copy</button>
				</div>
			</div>
		</ax-tab-view>
		<ax-tab-view tab-title="Php">
			<div style="overflow-x: auto;overflow-y:scroll;max-height:100%">
				<div ng-repeat='file in $parent.$ctrl.phpFiles' style='position:relative;' url="{{file.url}}">
					<label >Source: {{file.url}}</label>
					<pre ng-bind="file.code">
					</pre>
					<button class="btn icon toggle-show fa fa-caret-down"></button>
					<button class="btn form-control copy-code"><i class="fa fa-copy"></i>Copy</button>
				</div>
			</div>
		</ax-tab-view>
	</ax-tabs>`;
		templateString = templateString.replaceAll("source-code", "$parent.code");
		var tabs = angular.element(templateString);
		tabs.find("ax-tab-view[tab-title=Result]").attr("ax-dynamic-template-url", "'" + $attrs.templateUrl + "?v=" + applicationInfo.version + "'");
		var template = tabs[0].outerHTML;
		$element.attr("uid", axUtils.Guid());
		if ($element.css("position") === "relative" || $element.css("top") !== "0" || $element.css("bottom") !== "0" || $element.css("left") !== "0" || $element.css("right") !== "0")
			template += "<i class='icon code-tabs-maximize' ng-click='$ctrl.toggle($event)' ng-class='{\"fa fa-window-maximize\":!$ctrl.maximized, \"fa fa-window-restore\":$ctrl.maximized}'></i>";

		return template;
	}

	controlController.$inject = ["$element", "$scope", "$attrs", "$timeout", "$http"];

	function controlController(element, scope, attrs, $timeout, $http) {
		scope.$ctrl.maximized = false;
		scope.code = {};
		scope.$ctrl.toggle = function (event) {
			scope.$ctrl.maximized = !scope.$ctrl.maximized;
			var codeTabs = angular.element(event.target).closest("ax-code-tabs");
			var texts = angular.element("#right-pane").find(".info-text");
			var allCodeTabs = codeTabs.parent().find("ax-code-tabs");
			if (scope.$ctrl.maximized) {
				codeTabs.parent().css("overflow", "hidden");
				codeTabs.addClass("maximized");
				texts.addClass("ng-hide");
				allCodeTabs.each(function (i, element) {
					if (element.getAttribute("uid") === codeTabs.attr("uid")) return;
					element.style.visibility = "hidden";
				});
			}
			else {
				codeTabs.parent().css("overflow", "auto");
				allCodeTabs.each(function (i, element) {
					if (element.getAttribute("uid") === codeTabs.attr("uid")) return;
					// $(element).removeClass("ng-hide");
					element.style.visibility = "visible";
				});
				codeTabs.removeClass("maximized");
				texts.removeClass("ng-hide");
				codeTabs.find("button:not([tabindex='-1'])")[0].focus();
			}
			$timeout(axUtils.triggerWindowResize);
		};
		scope.$ctrl.htmlFiles = [];
		scope.hide = function (element, file) {
			element.find("ax-tab-view [url='" + file.url + "']> button.toggle-show").removeClass("fa-caret-down").addClass("fa-caret-right");
			element.find("ax-tab-view [url='" + file.url + "']> pre").slideHide("top");
		};
		scope.show = function (element, file) {
			element.find("ax-tab-view [url='" + file.url + "']> button.toggle-show").addClass("fa-caret-down").removeClass("fa-caret-right");
			element.find("ax-tab-view [url='" + file.url + "']> pre").slideShow("top");
		};
		scope.fileInit = function (response, file) {
			file.code = response.data;
			file.show = false;
			$timeout(function () {
				element.find("ax-tab-view [url='" + file.url + "']> pre").css("display", "none");
				element.find("ax-tab-view [url='" + file.url + "']> button.toggle-show").removeClass("fa-caret-down").addClass("fa-caret-right");
				element.find("ax-tab-view [url='" + file.url + "']> button.toggle-show").on("click", function () {
					file.show = !file.show;
					if (file.show) scope.show(element, file);
					else scope.hide(element, file);
				});
			});

		};
		if (attrs.htmlFiles) {
			let htmlFiles = scope.$eval(attrs.htmlFiles);
			htmlFiles.each(function (url, i) {
				let file = {url: url, code: ""};
				scope.$ctrl.htmlFiles.push(file);
				$http.get(url).then(function (response) {
					scope.fileInit(response,file);
				}, function (response) {
					file.code = "no code";
				});

			});
		} else {
			let file = {url: attrs.templateUrl, code: ""};
			scope.$ctrl.htmlFiles.push(file);
			$http.get(file.url).then(function (response) {
				file.code = response.data;
				$timeout(function () {
					element.find("ax-tab-view [url='" + file.url + "']> button.toggle-show").attr("disabled", "disabled");
				});
			}, function (response) {
				file.code = "no code";
			});
		}
		if (attrs.jsFiles) {
			scope.$ctrl.jsFiles = [];
			let jsFiles = scope.$eval(attrs.jsFiles);
			jsFiles.each(function (url, i) {
				let file = {url: url, code: ""};
				scope.$ctrl.jsFiles.push(file);
				$http.get(url).then(function (response) {
					scope.fileInit(response,file);
				}, function (response) {
					file.code = "no code";
				});

			});
		} else {
			let file = {url: attrs.templateUrl.replace(".html", ".js"), code: ""};
			scope.$ctrl.jsFiles = [file];
			$http.get(file.url).then(function (response) {
				file.code = response.data;
				$timeout(function () {
					element.find("ax-tab-view [url='" + file.url + "']> button.toggle-show").attr("disabled", "disabled");
				});

			}, function (response) {
				file.code = "no code";
			});
		}
		if (attrs.phpFiles) {
			scope.$ctrl.phpFiles = [];
			let sourceFiles = scope.$eval(attrs.phpFiles);
			sourceFiles.each(function (url, i) {
				let file = {url: url, code: ""};
				scope.$ctrl.phpFiles.push(file);
				$http.get(url, {headers:{ "Content-Type": "application/json"}}).then(function (response) {
					scope.fileInit(response,file);
				}, function (response) {
					file.code = "no code";
				});

			});
		}
	}
}());

(function () {

	'use strict';
	// angular.element(".copy-code").ready(function () {
	// 	document.body.addEventListener("click", copyCode, true);
	// });

	// event handler
	function copyCode(e) {

		// find target element
		var source = e.target.tagName === "PRE" ? angular.element(e.target) : angular.element(e.target).parent().find("pre");

		// is element selectable?
		if (source.length > 0) {
			console.log(e.target, e.target.tagName);
			let existing = angular.element("#copyCodeTextarea");
			let target;
			if (existing.length === 0) {
				target = document.createElement("textarea");
				target.style.position = "absolute";
				target.style.left = "-9999px";
				target.style.top = "0";
				target.setAttribute("id", "copyCodeTextarea");
				document.body.appendChild(target);
			} else target = existing[0];

			// target.textContent = source.html().replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&");
			target.textContent = source.text();

			// select text
			var currentFocus = document.activeElement;
			target.focus();
			target.setSelectionRange(0, target.value.length);
			console.log("set focus to copyCode textarea");
			// copy the selection
			var succeed;
			try {
				succeed = document.execCommand("copy");
			} catch (ex) {
				succeed = false;
			}
			// restore original focus
			angular.element("#copyCodeTextarea").remove();
			if (currentFocus && typeof currentFocus.focus === "function") {
				currentFocus.focus();
				console.log("restore focus to ", currentFocus);
			}
		}
	}

})();