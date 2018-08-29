class axCssStyle {

	static scrollerArrowWidth() {
		let style = this.base('test-scroller-arrow', "span", {role: "left-arrow"});
		return style.width ? parseInt(style.width) : 30;
	}

	static formTitleHeight() {
		let id = 'test-form-title';
		let style = this.base(id, "div", {class: 'form-title'});
		return style['line-height'] ? (parseInt(style['line-height']) + 1) : 30;
	}

	static editorToolbarHeight() {
		let style = this.base('test-editor-toolbar', "div", {role: 'toolbar', class: 'editor-toolbar'});
		return style['line-height'] ? (parseInt(style['line-height']) + 1) : 30;
	}

	static base(id, elementTag, attributes) {
		let element = document.getElementById(id);
		if (!element) {
			if (!attributes) attributes = {};
			attributes.id = id;
			attributes.style = (attributes.style ? attributes.style + ";" : "") + "visibility:hidden";
			element = createElement(elementTag, attributes);
			document.body.appendChild(element);
			element = document.getElementById(id);
		}
		let style = window.getComputedStyle(element);
		// console.log("style", style.height);
		return style;
	}

}