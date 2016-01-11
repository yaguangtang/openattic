"use strict";

var app = angular.module("openattic");
app.directive("focusMe", function ($timeout, $parse) {
  return {
    link: function (scope, element, attrs) {
      var model = $parse(attrs.focusMe);
      scope.$watch(model, function (value) {
        if (value === true) {
          $timeout(function () {
            element[0].focus();
            element[0].select();
          });
        }
      });
      element.bind("blur", function () {
        scope.$apply(model.assign(scope, false));
      });
    }
  };
});
