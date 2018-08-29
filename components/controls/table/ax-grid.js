(function () {
	var module = angular.module('ax.components');
	var bindings = {
		onSelectionChange: "&",
		config: '=?',
		parentConfig: "=?",
		selectableRowsModel: '=?',
		selectableDisabled: "&",
		rowIsDisabled: '&',
		canEdit: "=?",
		datasource: '=?',
		datasourceConfig: "=?"
	};

	module.component('axGrid', {
		bindings: bindings,
		controllerAs: 'grid',
		template: gridTemplate,
		controller: gridController
	});

	gridTemplate.$inject = ["$element", "$attrs"];

	function gridTemplate($element, $attrs) {
		if ($element.find("ax-grid-content").length === 0) {
			$attrs.initial = angular.copy($element);

			if (!$element[0].style.position) $element[0].style.cssText += ";position: absolute !important;";
			var axGridContent = createElement('ax-grid-content', {tabindex: 1, style: "display:block;position:relative;width:100%;height:100%"});
			axGridContent.setAttribute("ng-keydown", "grid.tableKeyDown($event)");
			var defaultAttrs = $axTableConfig().defaultAttrs;
			for (let attr in defaultAttrs) {
				if (angular.isDefined($attrs[attr])) continue;
				$element.attr(axUtils.reverseCamelCase(attr), defaultAttrs[attr]);
			}
			let hasChildren = $element.find(">ax-grid-child").length > 0;
			// let master = createElement("ax-table-master", {style: "display:block;position:absolute;top:0;left:0;right:0;bottom:0;overflow:hidden"}, "", axGridContent);
			let master = createElement("ax-table-master", {style: "display:block;position:relative;height:100%;width:100%;overflow:hidden"}, "", axGridContent);

			let table = createElement("ax-table", $element[0].attributes, $element.html(), master);
			table.removeAttribute("ng-style");
			table.setAttribute("style", "");
			table.setAttribute("has-grid", "true");
			table.addCssText("visibility: hidden !important;width:100%");
			table.setAttribute("hideable", "true");
			//vezi si template.setElementStyle;
			if ($attrs.config) {
				table.setAttribute('config', "grid.config");
				table.setAttribute('grid-config', $attrs.config)
			}
			if ($attrs.onSelectionChange) table.setAttribute('on-selection-change', "grid.onSelectionChange()");
			if ($attrs.datasource) table.setAttribute('datasource', "grid.datasource");
			if ($attrs.datasourceConfig) table.setAttribute('datasource-config', "grid.datasourceConfig");
			if ($attrs.selectableRowsModel) table.setAttribute('selectable-rows-model', "grid.selectableRowsModel");
			if ($attrs.selectableDisabled) table.setAttribute('selectable-disabled', "grid.selectableDisabled()");
			if ($attrs.rowIsDisabled) table.setAttribute('row-is-disabled', "grid.rowIsDisabled({dataItem:dataItem})");
			if ($attrs.canEdit) table.setAttribute('can-edit', "grid.canEdit");
			table.addCssText("position:absolute;top:0;bottom:0;left:0;right:0");
			if (!$attrs.pivotTableMode && $element.attr("customizable-pivot-table") !== "false") {
				let templateUrl = $attrs.pivotTableShowTemplate || '/components/controls/table/templates/ax-table-pivot-table-show.html';
				let pivot = createElement("ax-grid-pivot-table", {
					style: "display:none;position:absolute;top:0;bottom:0;left:0;right:0;background-color: lightgray;",
					axDynamicTemplateUrl: "'" + templateUrl + "'"
				}, "", axGridContent);
			}
			if ($element.attr("edit-row") === "editor") {
				let def = $element.find("ax-grid-editor");
				let editorTemplate = createElement("ax-table-editor", {
					style: "display:none;position:absolute;top:0;bottom:0;left:0;right:0;background-color:white;",
				});
				if (def.hasAttribute('class')) editorTemplate.setAttribute('class', def.attr('class'));
				if (def.length === 0) console.error("For edit-row=editor you need to define an ax-grid-editor template");
				else {
					let editorContent = def.attr("template-url") ?
						createElement("div", {class: "editor-content", axDynamicTemplateUrl: def.attr("template-url")}, "", editorTemplate) :
						createElement("ax-editor-content", {class: "editor-content", template: "grid.$$table.element.editorHtml"}, "", editorTemplate);
				}
				master.appendChild(editorTemplate);
			}
			return axGridContent;
		} else return $element.html();
	}

	gridController.$inject = ["$element", "$scope", "$attrs", "$parse"];

	function gridController($element, scope, attrs, $parse) {
		if (attrs.config) {
			var ctrlScope = scope.$parent.$eval(attrs.config);
			if (!ctrlScope) {
				ctrlScope = $parse(attrs.config).assign(scope.$parent, {});
				this.config = ctrlScope;
			}
		}
		// if (attrs.editRow === "editor") {
		// 	if (this.config && !this.config.editor) this.config.editor = {};
		// }
		this.$parent = scope.$parent;
		this.element = {
			$source: $element,
			source: $element[0],
			initial: attrs.initial,
			attrs: attrs,
			scope: scope,
			show: function () {
				if (this.isVisible) return;
				console.log("ax-grid show");
				if (this.$ctrl) this.$ctrl.$layout.set.updateCells();
				$element.find(">ax-grid-content>ax-table-master>ax-table").css("visibility", "");
				this.isVisible = true;
			}
		};
		$element[0].focus(function ($event) {
			$element.addClass("hasFocus");
			console.log("got focus", $element);
		});
		$element[0].blur(function () {
			$element.removeClass("hasFocus");
			console.log("lost focus", $element);
		});
		$element.on("$destroy", function () {
			// if (scope.$$destroyed) return;
			// console.log("grid destroying", $element, scope.grid);
			// $element.find("ax-table").trigger("$destroy");
			dropdownsStack.closePopupsFor($element);
			if (scope.grid) {
				if (scope.grid.$$pivotTable) scope.grid.$$table.$pivot.$destroy();
				if (scope.grid.$$editor) scope.grid.$$editor.$destroy();
				if (scope.grid.$$table) scope.grid.$$table.$destroy();
				scope.grid = null;
				delete scope.grid;
			}
			scope.$destroy();
			scope = null;
			self = null;
			//console.log("ax-dt element destroy");
		});


	}

}());