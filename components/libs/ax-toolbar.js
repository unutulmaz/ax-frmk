class axToolbar extends axElement {
    constructor() {
        super();
    }

    create(element, scope) {
        this.extractAttributesValues(element, scope);
        this.source.setAttribute("role", "toolbar");
        var div = axElement.createDOMElement("div", this.source.attributes);
        axElement.addChildren(div, this.source);
        return div;
    }
}
axElements.toolbar = axToolbar;
