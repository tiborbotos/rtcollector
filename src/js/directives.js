var directives = angular.module('rtcApp.directives', []);

directives.directive('groupStatistics', function() {
  return {
      restrict: 'AC',
      templateUrl: 'directives/group_statistics.html',
      scope: {
          stat: '='
      },
      controller: function($scope) {
      }
  };
});
