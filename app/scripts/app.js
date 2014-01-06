/***********************************
 * 
 ***********************************/

'use string;'

/*jslint index: 2*/
/*global angular*/

/***********************************
 * 
 ***********************************/
angular.module('angularJsEclipseTools'), [])
  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider
      .when('/:path', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .otherwise({
        redirectTo: '/404.html'
      });
  }]);
