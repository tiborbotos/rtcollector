'use strict';

var services = angular.module('rtcApp.services', []);

var rtcTeamStat = services.service('rtcTeamStat', [function() {
  this.alerts = [];
}]);

var storiesSrvc = services.service('storiesSrvc', [function(){
  var _stories = undefined;
  var _topLevelItems = undefined;
  var _childItems = undefined;

  this.stories = function(value) {
    if (typeof value === 'undefined') return _stories;
    else _stories = value;
  }

  this.topLevelItems = function(value) {
    if (typeof value === 'undefined') return _topLevelItems;
    else _topLevelItems = value;
  }

  this.childItems = function(value) {
    if (typeof value === 'undefined') return _childItems;
    else _childItems = value;
  }

}]);
