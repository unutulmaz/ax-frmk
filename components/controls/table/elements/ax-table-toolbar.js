class axTableToolbar extends axElement {
	constructor(element, scope) {
		super();
		this.attributes = {};
		return this.create(element, scope);
	}

	create(dataTableTemplate) {
		var element = dataTableTemplate.getDirectChildrenOfType('ax-toolbar', dataTableTemplate.element.source[0]);
		var toolbar;
		var toolbarElements = 0;
		if (element.length > 0) {
			dataTableTemplate.toolbar = { def: element[0] };
			this.extractAttributesValues(element[0]);

			var axToolbarDef = createElement('ax-toolbar', element[0].attributes);
			toolbar = axElement.createViewElement(axToolbarDef);
			var self = this;
			angular.forEach(element[0].childNodes, function(item, index) {
				var newItem;
				if (item.nodeName === "#text") newItem = document.createTextNode(item.nodeValue);
				else if (item.nodeName === "#comment") newItem = document.createComment(item.nodeValue);
				else if (item.tagName === 'AX-BUTTON'
					&& ( item.getAttribute('button-type') === 'add') //jshint ignore:line
					&& !["inline","inline-cell"].includes(dataTableTemplate.controller.attrs.editRow)) return true; //jshint ignore:line
				else if (item.tagName === 'AX-BUTTON'
					&& (item.getAttribute('button-type') === 'edit') //jshint ignore:line
					&& dataTableTemplate.controller.attrs.editRow !== "inline-cell") return true; //jshint ignore:line
				else if (item.tagName === 'AX-BUTTON'
						&& (item.getAttribute('button-type') === 'select-all' || item.getAttribute('button-type') === 'clear-selection') //jshint ignore:line
					&& dataTableTemplate.controller.attrs.selectableRows !== "multiple") return true; //jshint ignore:line
				else if (["apply-changes"].includes(item.getAttribute('button-type'))) return true;
				else if (item.tagName === 'AX-BUTTON') {
					newItem = new axTableButton(item, dataTableTemplate);
					toolbarElements++;

				} else if (item.tagName === 'AX-GLOBAL-SEARCH') {
					let button = createElement("ax-button", item.attributes, item.innerHTML);
					button.setAttribute("button-type", "global-search");
					newItem = new axTableButton(button, dataTableTemplate);
					toolbarElements++;

				} else {
					newItem = axElement.createElement(item);
					toolbarElements++;
				}
				toolbar.appendChild(newItem);
			});
		}
		if (!toolbar) return undefined;
		toolbar.style.position = 'absolute';
		toolbar.style.left = '0';
		toolbar.style.top = '0';
		toolbar.style.right = '0';
		let noScroller = toolbar.classList.contains('no-scroller') || toolbar.getAttribute("ax-scroller") === "false";
		if (toolbarElements > 1 && !noScroller) toolbar.setAttribute('ax-scroller', '');
		dataTableTemplate.toolbar.element = toolbar;
		return toolbar;
	}

}
