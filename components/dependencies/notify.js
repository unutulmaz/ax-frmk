(function() {
    angular.module("App").factory("notify", function() {
        var logIt;
        return toastr.options = {
            closeButton: !0,
            positionClass: "toast-bottom-right",
            timeOut: "3000"
        },
            logIt = function(message, type, options, title) {
                return toastr[type](message, title, options);
            }, {
                log: function(message, options, title) {
                    logIt(message, "info", options, title);
                },
                warning: function(message, options, title) {
                    logIt(message, "warning", options, title);
                },
                success: function(message, options, title) {
                    logIt(message, "success", options, title);
                },
                error: function(message, options, title) {
                    logIt(message, "error", options, title);
                }
            };
    });
}());
