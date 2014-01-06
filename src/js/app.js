
angular.module('rtcApp', ['ngRoute', 'ngSanitize',
                          'rtcApp.services', 'rtcApp.directives', 'rtcApp.controllers'])
.config(['$routeProvider','$locationProvider', function($routeProvider, $locationProvider) {

  $routeProvider.when('/stories', {
    templateUrl: 'partials/stories.html',
    controller: 'StoriesCtrl',
    resolve: LoaderCtrl.resolve
  });

  $routeProvider.otherwise({redirectTo: '/stories'});
}]);