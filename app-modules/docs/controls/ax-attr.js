(function () {
    var module = angular.module('ax.components');
    var bindings = {};

    module.component('axAttr', {
        bindings: bindings,
        template: controlTemplate,
        controller: controlController
    });
    controlTemplate.$inject = ["$element", "$attrs"];

    function controlTemplate($element, $attrs) {
        let template= "<br> - <strong>" + $element[0].innerHTML + "</strong> -";
        return template;
    }

    controlController.$inject = ["$element", "$scope", "$attrs"];
    function controlController(element, scope, attrs) {
    }
}());

