(function (window, angular) {
	/**
	 * atribute:
	 *   -- config a config object {upload(file, config), success(response), error(response)} to custom upload method
	 *   -- btn-class
	 *   -- btn-style
	 *   -- btn-text - js expression to evaluate
	 *   -- directory (webkitdirectory) for direcoty upload
	 *   -- multiple (for multiple fiels upload)
	 *   -- accept (fiels type accept)
	 *   -- max-height (of files-list)
	 *   -- max-size (of file)
	 *   -- show-files-list
	 *   -- file-row-class
	 *   -- show-progress-bar
	 *   -- show-remove-btn (if not exist upload-url)
	 *   -- remove-btn-class
	 *   -- upload-on-select (if upload fire on seelcting files with files picker)
	 *   -- upload-url (url to upload files)
	 */

	function axFileTemplate($element, $attrs) {
		if (!$element[0].hasAttribute("tabindex")) $element.attr("tabindex", "0");
		var element = createElement("span", {class: "file-upload"});
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
		browseButton.innerHTML = $attrs.btnText ? $attrs.btnText : "Choose files";
		element.appendChild(browseButton);
		if ($attrs.showFilesList !== undefined) {
			var fileDiv = createElement("div", {
				role: "file-upload-file",
				style: "display:inline-flex;vertical-align:middle",
				"ng-repeat": "file in $ctrl.$files"
			});
			if ($attrs.fileRowClass) fileDiv.setAttribute('class', $attrs.fileRowClass);
			var fileNameInnerHtml = "<div ng-bind='file.name'></div>";
			var fileNameSpan = createElement("span", {role: "file-upload-file-name"});
			fileNameSpan.style.cssText = "width:100%;overflow:hidden;";
			fileNameSpan.innerHTML = fileNameInnerHtml;
			fileDiv.appendChild(fileNameSpan);
			if ($attrs.showProgressBar !== undefined) {
				var progressBar = createElement("span", {role: "file-upload-progress", style: "position:relative"});
				progressBar.innerHTML = "<span>{{(file.progress || 0)  + '%'}}</span>";
				var progressBarIndicator = createElement("div", {style: "width:{{file.progress}}%"});
				progressBar.appendChild(progressBarIndicator);
				fileDiv.appendChild(progressBar);
			}
			if (!$attrs.uploadUrl && $attrs.showRemoveBtn !== undefined) createElement("span", {class: $attrs.removeBtnClass || "fa fa-times", role: "file-remove-btn", ngClick: "$ctrl.removeFile(file)", style: "margin-right:5px"}, "", fileDiv);
			createElement("div", {role: "files-list", style: "overflow: auto;position: absolute;top: 30px;bottom: 0;left: 0;right: 0;"}, fileDiv, element);

		} //else element.children[0].style.width = "100%";
		var template = element.innerHTML;
		return template;
	}

	class axFileController {
		constructor(scope, element, attrs, $timeout, $upload) {
			this.$files = [];
			this.errorMsg = "";
			this.errFile = undefined;
			this.uploadUrl = attrs.uploadUrl;
			this.uploadOnSelect = attrs.uploadOnSelect !== undefined;
			this.$timeout = $timeout;
			this.$upload = $upload.upload;
			if (this.uploadOnSelect && !this.uploadUrl) console.error("No upload-url attribute provided!");

			if (attrs.config && scope.$ctrl.config) scope.$ctrl.config.$ctrl = this;

		}

		removeFile(file) {
			let found = null;
			for (let i = 0; i < this.$files.length; i++) {
				if (file.$$hashKey === this.$files[i].$$hashKey) found = i;
			}
			if (found !== null) this.$files.splice(found, 1);
		}

		/**
		 * method to upload files on a custom method
		 * @param url
		 * @param extraData
		 * @returns {void|*|f}
		 */
		uploadAll(url, extraData) {
			console.log("uploadAll files", arguments);
			let data = extraData;
			data.files = this.$files;
			var config = {
				url: url,
				method: "POST",
				data: data,
				headers: {"Content-Type": "text/csv"}
			};
			if (this.config && this.config.upload) return this.config.upload(config);
			else return this.$upload(config);
		}

		/**
		 * methjod fired on select files with files picker
		 * @param files
		 * @param errFiles
		 * @param $event
		 */
		upload(files, errFiles, $event) {
			var ctrl = this;
			console.log("upload files", arguments);
			files = files ? (files.length === undefined ? [files] : files) : [];
			if (files.length === 0) return;
			ctrl.errorMsg = "";
			let index = ctrl.$files.length ? ctrl.$files.length - 1 : 0;
			ctrl.$files = ctrl.$files.concat(files);
			ctrl.errFile = errFiles && errFiles[0];
			for (let i = 0; this.uploadOnSelect && this.uploadUrl && i < ctrl.$files.length; i++) {
				let file = ctrl.$files[i];
				var config = {
					url: this.uploadUrl,
					method: "POST",
					data: {file: file},
					headers: {"Content-Type": "text/csv"}
				};
				if (ctrl.config && ctrl.config.upload) ctrl.config.upload(file, config);
				//file.URL = window.URL.createObjectURL(file);
				//file.onload = function () {//jshint ignore:line
				//   window.URL.revokeObjectURL(file.URL);
				//};
				file.upload = this.$upload(config);//jshint ignore:line
				file.upload.then(function (response) {//jshint ignore:line
						if (response.status)
							ctrl.$timeout(function () {
								file.uploaded = response.data.data;
								if (ctrl.config && ctrl.config.success) ctrl.config.success(response.data);
							});
					},
					function (response) {//jshint ignore:line
						//check for upload_max_filesize , will not generate an error, but in $_FILES[0]["error"] will be 1, and size =0
						//check also post_max_size if you get error PHP Warning: POST Content-Length of 9553459 bytes exceeds the limit of 8388608
						if (response.status > 0)
							file.errorMsg = response.status + ': ' + response.data;
						if (ctrl.config && ctrl.config.error) ctrl.config.error(response.data);
						console.error("upload files error:", response);
					},
					function (evt) {//jshint ignore:line
						file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
					});
			}
		}
	}

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
			template: axFileTemplate,
			controller: axFileController
		});
	axFileTemplate.$inject = ["$element", "$attrs"];
	axFileController.$inject = ["$scope", "$element", "$attrs", "$timeout", "Upload"];

})(window, angular);

