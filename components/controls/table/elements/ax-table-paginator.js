class axTablePaginator extends axElement {
	constructor(dataTableTemplate) {
		super();
		return this.create(dataTableTemplate);
	}

	create(dataTableTemplate) {
		var paginator = "$ctrl.$paginator";
		var self = this;
		var createPages = function () {
			var containerDiv = self.createDOMElement("div");
			containerDiv.style.width = "100%";
			containerDiv.style["text-align"] = "right";
			var page;
			var pagesDiv = self.createDOMElement("div", { class: "inline", role: "page-navigator" });
			page = self.createDOMElement('span',
				{
					class: "fa fa-step-backward",
					'ng-if1': paginator + ".fromIndex",
					role: "go-to-first-page",
					'ng-click': paginator + '.goToFirstPage()',
					'ng-disabled': "!"+ paginator +" || " +paginator + ".fromIndex === 1 || $ctrl.inlineEditing"
				});
			if (dataTableTemplate.attributes["show-pagination-tooltips"]) page.setAttribute("uib-tooltip", dataTableTemplate.getMessage('pagination', 'firstPage') + ", Shortcut: Ctrl+Home");
			pagesDiv.appendChild(page);
			page = self.createDOMElement('span',
				{
					class: "fa fa-chevron-left",
					'ng-if1': paginator + ".fromIndex",
					role: "go-to-previous-page",
					'ng-click': paginator + '.goToPreviousPage() ',
					'ng-disabled': "!" + paginator + " || " +paginator + ".fromIndex === 1 || $ctrl.inlineEditing"
				});
			if (dataTableTemplate.attributes["show-pagination-tooltips"]) page.setAttribute("uib-tooltip", dataTableTemplate.getMessage('pagination', 'previous')+ ", Shortcut: Page Up");
			pagesDiv.appendChild(page);
			page = self.createDOMElement('span',
				{
					role: "go-to-page",
					'ng-repeat': 'page in ' + paginator + '.pages',
					'ng-click': paginator + '.goToPage(page.value)',
					'ng-disabled': paginator + ".currentPage==page.value  || $ctrl.inlineEditing",
					'ng-bind': 'page.text'
				});
			if (dataTableTemplate.attributes["show-pagination-tooltips"]) {
				var tooltip = "{{" + paginator + ".currentPage==page.value ? '" + dataTableTemplate.getMessage('pagination', 'currentPage') + "': '" + dataTableTemplate.getMessage('pagination', 'goToPage') + "'}}";
				page.setAttribute("uib-tooltip", tooltip);
			}
			pagesDiv.appendChild(page);
			page = self.createDOMElement('span',
				{
					role: "go-to-next-page",
					class: "fa fa-chevron-right",
					'ng-if1': paginator + ".toIndex",
					'ng-click': paginator + '.goToNextPage()',
					'ng-disabled': "!" + paginator + " || " +paginator + ".toIndex >= $ctrl.getCollection('visibleItems').length  || $ctrl.inlineEditing"
				});
			if (dataTableTemplate.attributes["show-pagination-tooltips"]) page.setAttribute("uib-tooltip", dataTableTemplate.getMessage('pagination', 'next')+ ", Shortcut: Page Down");
			pagesDiv.appendChild(page);
			page = self.createDOMElement('span',
				{
					role: "go-to-last-page",
					class: "fa fa-step-forward",
					'ng-if1': paginator + ".toIndex>1",
					'ng-click': paginator + '.goToLastPage()',
					'ng-disabled': "!" + paginator + " || " +paginator + ".toIndex >= $ctrl.getCollection('visibleItems').length  || $ctrl.inlineEditing"
				});
			if (dataTableTemplate.attributes["show-pagination-tooltips"]) page.setAttribute("uib-tooltip", dataTableTemplate.getMessage('pagination', 'lastPage')+ ", Shortcut: Ctrl+End");
			pagesDiv.appendChild(page);
			containerDiv.appendChild(pagesDiv);
			return containerDiv;
		};
		var wrapper = this.createDOMElement("div", { class: "inline", role: "paginator" });
		wrapper.style.cssText = "position:absolute;left:0;bottom:0;right:0";
		var pagesDiv = createPages();
		var pageInfo = this.createDOMElement("span",
			{
				role: "page-info",
				'ng-bind': paginator + ".text"
			});
		wrapper.appendChild(pageInfo);
		wrapper.appendChild(pagesDiv);
		if (dataTableTemplate.attributes["show-change-pagination"]==="true") {
			var pageSetting = this.createDOMElement("ax-dropdown-popup",
				{
					style: "width:20px;height:20px;margin-right:10px",
					tabindex: -1,
					"btn-class": "icon text",
					"btn-text": "",
					"caret-class": "fa fa-list",
					"close-on-blur": "true",
					"close-on-escape": "true",
					"popup-width": "auto",
					"popup-relative-left": "-243px",
					"popup-relative-top": "-140px",
					"template-url": "'components/controls/table/templates/ax-table-paginator.html'",
					ctrl: "$ctrl.$dropdowns.paginator"
				});
			if (dataTableTemplate.attributes["show-pagination-tooltips"]) pageSetting.setAttribute("uib-tooltip", dataTableTemplate.getMessage('pagination', 'pageSizeSetting'));

			wrapper.appendChild(pageSetting);
		}
		return wrapper;
	}
}
