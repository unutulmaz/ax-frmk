(function () {
    angular.module("App").controller("dropdownSamples", controller);
    controller.$inject = ['$scope'];

    function controller($scope) {
        //name setted in config attribute
        $scope.popup1 = {
            onOpen:function(params){
                let $event = params[0];
                this.toggle1 = params[1];
                this.object1 = params[2];
              this.openFinish = true;
            },
            confirm: function () {
                let text = this.text1;
                this.close();
            }
        };
        $scope.object1 = {
            name: "object1"
        };
    }
}());