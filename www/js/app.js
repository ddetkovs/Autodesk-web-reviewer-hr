// References
// https://docs.angularjs.org/guide/directive
// https://github.com/angular/angular.js/wiki/Understanding-Directives
// http://weblogs.asp.net/dwahlin/creating-custom-angularjs-directives-part-2-isolate-scope

var app = angular.module('Autodesk.Web.Viewer.App', []);

app.controller('Autodesk.Web.Viewer.Controller',
    ['$scope', function ($scope) {

  // Your code here
}]);

app.directive('adnViewerDiv', function () {

  function link($scope, $element, $attributes) {

    // instanciate viewer manager in directive scope
});
