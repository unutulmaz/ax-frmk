class axButton extends axElement {
    constructor(element, scope) {
        super();
        this.attributes = { 'icon-class': "" };
        if (arguments.length == 2) return this.create(element, scope);
    }

    create(element, scope) {
        this.extractAttributesValues(element, scope);
        var buttonType = this.source.getAttribute('type');
        this.source.setAttribute('type', 'button');
        var scopeVariable = this.source.getAttribute('form-scope-variable');
        var button, icon;
        switch (buttonType) {
            default:
                button = axElement.createDOMElement("button", this.source.attributes);
                if (this.attributes['icon-class']) {
                    var i = axElement.createDOMElement("i", { class: this.attributes['icon-class'] });
                    button.appendChild(i);
                }
                axElement.addChildren(button, this.source);

        }
        // console.log("Create button: ", button);
        return button;
    }
}
axElements.button = axButton;

