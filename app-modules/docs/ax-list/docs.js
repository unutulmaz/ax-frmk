(function () {
    angular.module("App").controller("datalistDocs", controller);
    controller.$inject = ['$scope'];


    function controller($scope) {
        $scope.code = {
            def: `<ax-datalist 
    datasource="data1"
    selectable-rows="multiple"
    selectable-rows-model="selectedItems1"
    selectable-rows-model-type="object"
    item-id-field="id"
    item-display-field="name"
    item-invariant-field="nameInvariant"
    on-selection-change="onSelectionChangeHandler(dataItem)"
    ad-empty-option="true"
    show-close-button="false"
    show-search="true"
    show-check-all="true"
    show-uncheck-all="true">
</ax-datalist>`,
            jsDef:`scope.popupConfig={
            title:"Popup title",
            methodToAccessInPopup:function(){
            //this method can be accessed in popup with launcher.methodToAccessInPopup();
            },
            confirm:function(){
            //a method to save changes in popup;
            this.close();//close the popup
            },
            onClose:function(){
            //do something on close popup event;
            },
            onOpen: function(params){
                let $event = params[0];
                let myFirstOpenParams = params[1];
                this.popupObject = {};
                //--- do what you need
                this.openFinish = true ;// !!!!! needed to continue open execution 
            },
            onOpenFinish:function(){
                let popup = this.popup; //popup controller
                let popupElement = popup.popupElement; //reference to jQuery wrapped popup element;
                let height = popup.popupElement.find(".tabs-header").prop("offsetHeight") + popup.popupElement.find(".order-container").prop("offsetHeight") + 10;
                popup.popupElement.find(".tabs-header").hide();
                popup.popupElement.find("ax-tab-view").css("top", 0);
                popup.popupElement.find(".order-container").css("height", height + "px");
            }
        }`
        };
    }
}());