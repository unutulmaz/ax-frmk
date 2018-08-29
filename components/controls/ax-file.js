(function (window, angular) {
	var module = angular.module('ax.components');
	module.component('axFile',
		{
			bindings: {
				ngModel: "=",
				config: "=?",
				ngDisabled: "&",
				ngReadonly: "&",
				ngChange: "&"
			},
			template: template,
			controller: controller
		});
	template.$inject = ["$element", "$attrs"];
	controller.$inject = ["$scope", "$element", "$attrs", "$timeout", "Upload"];

	function template($element, $attrs) {
		var attributes = $element[0].attributes;
		if (!$element[0].hasAttribute("tabindex")) $element.attr("tabindex", "0");
		var element = createElement("span", {class: "file-upload"});
		var config = $attrs.config || "$ctrl";
		config = "$ctrl.$parent" + (config.indexOf(".") > -1 ? ("." + config) : ("['" + config + "']"));
		element.style.cssText = "position: relative; overflow:hidden;display:block;";
		var browseButton = createElement("button",
			{
				type: "file",
				class: $attrs.btnClass || "form-control",
				style: $attrs.btnStyle || "padding:0 3px",
				tabindex: $element.attr("tabindex"),
				role: "file-upload-browse",
				"ngf-select": "$ctrl.upload($ctrl.ngModel, $ctrl.$invalidFiles, $event)",
				"ng-model": "$ctrl.ngModel"

			});
		if (angular.isDefined($attrs.webkitdirectory) || angular.isDefined($attrs.directory)) {
			browseButton.setAttribute("directory", "");
			browseButton.setAttribute("webkitdirectory", "");
			browseButton.setAttribute("mozdirectory", "");
			browseButton.setAttribute("multiple", "");
			// browseButton.setAttribute("ngf-select", "$ctrl.upload($ctrl.$files, $ctrl.$invalidFiles, $event)");
		}
		if (angular.isDefined($attrs.multiple)) {
			browseButton.setAttribute("multiple", "");
			// browseButton.setAttribute("ngf-select", "$ctrl.upload($ctrl.$files, $ctrl.$invalidFiles, $event)");
		}
		if ($attrs.accept) browseButton.setAttribute("accept", $attrs.accept);
		if ($attrs.maxHeight) browseButton.setAttribute("max-height", $attrs.maxHeight);
		if ($attrs.maxSize) browseButton.setAttribute("max-size", $attrs.maxSize);
		if ($attrs.ngDisabled || $attrs.ngReadonly) browseButton.setAttribute("ng-disabled", "$ctrl.ngDisabled() || $ctrl.ngReadonly()");
		browseButton.innerHTML = $attrs.btnText || "Choose files";
		element.appendChild(browseButton);
		if ($attrs.showFilesList === "true") {
			var fileDiv = createElement("div", {
				role: "file-upload-file",
				class: "inline",
				"ng-repeat": "file in $ctrl.$files"
			});
			var fileNameInnerHtml = "{{file.name}}";
			var fileNameSpan = createElement("span", {role: "file-upload-file-name", "uib-tooltip": fileNameInnerHtml});
			fileNameSpan.style.cssText = "width:300px;overflow:hidden;";
			fileNameSpan.innerHTML = "File:&nbsp" + fileNameInnerHtml;
			fileDiv.appendChild(fileNameSpan);
			var progressBar = createElement("span", {role: "file-upload-progress", style: "position:relative"});
			progressBar.innerHTML = "<span>{{(file.progress || 0)  + '%'}}</span>";
			var progressBarIndicator = createElement("div", {style: "width:{{file.progress}}%"});
			progressBar.appendChild(progressBarIndicator);
			fileDiv.appendChild(progressBar);
			element.appendChild(fileDiv);
		} //else element.children[0].style.width = "100%";
		var template = element.innerHTML;
		return template;
	}

	function controller(scope, element, attrs, $timeout, Upload) {
		var $filesUploadScope =
			{
				$files: undefined,
				errorMsg: "",
				errFile: undefined,
				upload: function (files, errFiles, $event) {
					var uploadFile = this;
					// console.log("upload files", arguments);
					uploadFile.$files = files ? (files.length === undefined ? [files] : files) : [];
					uploadFile.errorMsg = "";
					uploadFile.errFile = errFiles && errFiles[0];
					if (uploadFile.$files.length > 0 && attrs.uploadUrl) {
						for (let i = 0; i < uploadFile.$files.length; i++) {
							let file = uploadFile.$files[i];
							var config = {
								url: attrs.uploadUrl,
								method: "POST",
								data: {file: file},
								headers: {"Content-Type": "text/csv"}
							};
							if (uploadFile.config && uploadFile.config.configUpload) uploadFile.config.configUpload(file, config);
							//file.URL = window.URL.createObjectURL(file);
							//file.onload = function () {//jshint ignore:line
							//	window.URL.revokeObjectURL(file.URL);
							//};
							file.upload = Upload.upload(config);//jshint ignore:line
							file.upload.then(function (response) {//jshint ignore:line
									if (response.status)
										$timeout(function () {
											file.uploaded = response.data.data;
											if (uploadFile.config && uploadFile.config.uploaded) uploadFile.config.uploaded(response.data);
										});
								},
								function (response) {//jshint ignore:line
									if (response.status > 0)
										file.errorMsg = response.status + ': ' + response.data;
									if (uploadFile.config && uploadFile.config.uploadError) uploadFile.config.uploadError(response.data);
									console.error("upload files error:", response);
								},
								function (evt) {//jshint ignore:line
									file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
								});
						}
					}

				}
			};
		scope.$ctrl = angular.extend(scope.$ctrl, $filesUploadScope);
		if (attrs.config && scope.$ctrl.config) angular.extend(scope.$ctrl, scope.$ctrl.config);
	}
})(window, angular);