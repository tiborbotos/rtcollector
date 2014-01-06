var controllers = angular.module('rtcApp.controllers', []);

var LoaderCtrl = controllers.controller('LoaderCtrl', [function(){
}]);

LoaderCtrl.resolve = {
  stories: ['$q', 'storiesSrvc', function($q, storiesSrvc) {
    var deferred = $q.defer();

    rtc.loaders.loadTopLevelItems(function(topLevelItems, childItems) {
      if (storiesSrvc.stories() !== undefined) {
        return deferred.resolve(storiesSrvc.stories());
      } else {
        var stories = [];
        if (topLevelItems.length > 0)
          stories = rtc.stats.collectStories(topLevelItems, childItems);
        else // TODO remove static data
          stories = rtc.stats.collectStories(rtc.data.staticTopLevelItems, rtc.data.staticChildItems);

        storiesSrvc.stories(stories);
        storiesSrvc.topLevelItems(topLevelItems);
        storiesSrvc.childItems(childItems);

        deferred.resolve(stories);
      }
    });

    return deferred.promise;
  }]
};

controllers.controller('StoriesCtrl', ['$scope', 'rtcTeamStat', 'storiesSrvc',
  function($scope, rtcTeamStat, storiesSrvc) {
    console.log('Stories=', storiesSrvc.stories());
    $scope.stories = filterUserStories(storiesSrvc.stories());

    $scope.getAlertIcon = function(alert) {
      if (alert.severity === 'critical')
        return 'glyphicon-fire';
      if (alert.severity === 'alert')
        return 'glyphicon-warning-sign';
      return 'glyphicon-info-sign';
    };

    $scope.getAlertTextClass = function(alert) {
      if (alert.severity === 'critical')
        return 'text-danger';
      if (alert.severity === 'alert')
        return 'text-warning';
      return 'text-muted';
    };

    $scope.storyBarSuccessClass = function(story) {
      if (story.stats === undefined)
        return '';
      if (story.stats.timeSpentOnStory > story.stats.maxTimeOnStory)
        return 'progress-bar-danger';
      return 'progress-bar-success';
    };

    function filterUserStories(stories) {
      return stories.filterValue('workItemType', ['User Story'/*, 'Design Spike'*/]);
    }
  }
]);