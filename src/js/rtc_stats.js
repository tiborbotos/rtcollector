
if (typeof rtc == "undefined" || !rtc) {
  rtc = {};
}
if (typeof rtc.stats == "undefined" || !rtc.stats) {
  rtc.stats = {};
}

/** deprecated */
rtc.stats.renderPersonProgressStats = function(childItems) {
  var __emptyStats = {
    name: 'unknown',
    avatar: 'person',
    open: {percent: 0, count: 0, hours: 0},
    inprogress: {percent: 0, count: 0, hours: 0, estimated: 0},
    done: { percent: 0, count: 0, hours: 0},
    tasks: [],
    stories: []
  };

  var global = angular.copy(__emptyStats);
  global.name = 'Team Sales02 BP';
  global.avatar = 'team';
  var aMembers = {}; // members stored in associative array
  var members = [];

  // collect open, inprogress, done fields, calculate count and hours
  $.each(childItems, function(i, item) {
    if (aMembers[item.owner] === undefined) { // init members
      aMembers[item.owner] = angular.copy(__emptyStats);
      aMembers[item.owner].name = item.owner;
    }

    var taskType = getTaskType(item);

    aMembers[item.owner][taskType].count += 1;
    aMembers[item.owner][taskType].hours += Math.round(item.timespent);

    global[taskType].count += 1;
    global[taskType].hours += Math.round(item.timespent);

    function getTaskType(item) {
      var taskType = '';
      if (item.status === 'Open' || item.status === 'Blocked')
        taskType = 'open';
      if (item.status === 'Done' || item.status === 'Invalid' || item.status === 'In Review' || item.status === 'In Verification')
        taskType = 'done';
      if (item.status === 'In Progress')
        taskType = 'inprogress';
      if (taskType === '') {
        taskType = 'unknown';
        console.log('Error! Unknown tasktype! ',item);
      }
      return taskType;
    }
  });

  // calculate global percents
  calculatePercents(global);

  $.each(aMembers, function(i,item) { // convert members map into members array
    members.push(item);
    calculatePercents(item);
  });

  function calculatePercents(group) {
    var globalTasksCount = group.open.count + group.inprogress.count + group.done.count;
    group.open.percent = Math.floor(group.open.count * 100 / globalTasksCount);
    group.inprogress.percent = Math.floor(group.inprogress.count * 100 / globalTasksCount);
    group.done.percent = Math.floor(group.done.count * 100 / globalTasksCount);
    if (group.open.percent + group.inprogress.percent + group.done.percent !== 100) {
      console.error('Error calculating percents! The sums are not matching up to 100%! -> ' + (group.open.percent + group.inprogress.percent + group.done.percent), group);
      group.done.percent = 100 - (group.open.percent + group.inprogress.percent);
    }
    group.feelings = calculateFeelings(group.open.percent, group.inprogress.percent, group.done.percent);

    function calculateFeelings(openPercent, inprogressPercent, donePercent) {
      var p = ['nothingtosay', 'info', 'success', 'warning', 'danger'];
      if (openPercent >= 90 || (openPercent >=50 && inprogressPercent >=20))
        return p[0];
      if (openPercent >= 50 && openPercent <= 90)
        return p[1];
      if (donePercent >= 80)
        return p[2];
      if (inprogressPercent >= 10)
        return p[3];
      return p[4];
    }
  }

  members.sort(function(a,b) { ((a.name < b.name) ? -1 : ((a.name > b.name) ? 1 : 0)); } );

  return {'global': global, 'members': members};
};

rtc.stats.__randomizeStoryPoints = function(topLevelItems) {
  $.each(topLevelItems, function(i, item) {
    if (item["sp"] === undefined) {
      var value = 0;
      if (item['workItemType'] === 'Design Spike') value = 1;
      if (item['workItemType'] === 'Debt Service') value = 1;
      if (item['workItemType'] === 'User Story') {
        var summary = item['summary'];
        value = summary.split(" ").length + 1;
      }
      if (item['workItemType'] === 'Defect') value = 1;
      if (item['workItemType'] === 'Analysis Spike') value = 1;
      item["storyPoints"] = value;
    }
  });
};

rtc.stats.collectStories = function(items, childItems) {
  const storyPointInHour = 6;
  const STORY_CLOSED = 'Closed';

  var stories = [];

  rtc.stats.__randomizeStoryPoints(items);

  $.each(items, function(i, story) {
    convertChildrenIdToChildrenItem(story);

    story.blocked = story.children.filterValue('status', 'Blocked').length > 0;

    createTasksStatistics(story);
    calculateProgress(story);
    createAlerts(story);
    stories.push(story);
  });






  function createTasksStatistics(story) {
    story.tasks = {
      'tasksCount': story.children.length,
      'tasksOpen': story.children.filterValue('status', 'Open').concat(story.children.filterValue('status', 'Blocked')).length,
      'tasksProgress': story.children.filterValue('status', 'In Progress').length
    };
    story.tasks['tasksDone'] = story.tasks.tasksCount - story.tasks.tasksProgress - story.tasks.tasksOpen;
  }

  function convertChildrenIdToChildrenItem(story) {
    var children = [];
    for(var id in story.children) {
      if (story.children.hasOwnProperty(id)) {
        var childItemIndex = story.children[Number(id)];
        var childItem = childItems[childItemIndex];
        if (childItem === undefined)
          throw Error('Cannot find child item by id: ' + childItemIndex, childItems);
        children.push(childItem);
      };
    }
    story.children = children;
  }


  function calculateProgress(story) {
    if (story.children.length == 0)
      return;

    var sp = story.storyPoints;
    var tasks = story.children.filterValue('workItemType', 'Development Task');
    var qaTasks = story.children.filterValue('workItemType', 'Quality Task');
    var maxTimeOnStory = (sp * storyPointInHour).toFixedNumber();
    var timeSpentOnStory = sumSpentTime(tasks);
//      (tasks.length > 0) ?
//        Number(tasks.reduceRight(function(a,b){if (angular.isNumber(a)) return a + b.timespent; else return a.timespent + b.timespent;})).toFixedNumber() : 0;
    var storyPointSpentOnStory = (timeSpentOnStory / storyPointInHour).toFixedNumber(2);

    var tasksCount = tasks.length;
    var tasksOpen = tasks.filterValue('Status', 'Open').concat(tasks.filterValue('status', 'Blocked')).length;
    var tasksInProgress = tasks.filterValue('status', 'In Progress').length;
    var tasksDone = tasksCount - tasksOpen -tasksInProgress;
    story.stats = {
      'tasks': {
        'percent': {
          'open': (tasksOpen*100/tasksCount).toFixedNumber(0),
          'inprogress': (tasksInProgress*100/tasksCount).toFixedNumber(0),
          'tasksDone': (tasksDone*100/tasksCount).toFixedNumber(0),
        },
        'devTasks': tasks,
        'qaTasks': qaTasks,
        'open': tasksOpen,
        'inProgress': tasksInProgress,
        'tasksDone': tasksDone,
      },
      'maxTimeOnStory': maxTimeOnStory,
      'timeSpentOnStory': timeSpentOnStory,
      'storyPointSpentOnStory': storyPointSpentOnStory,
    };
  }

  function createAlerts(story) {
    story.alerts = [];
    // TODO remove this
    if (story.workItemType !== 'User Story')
      return;

    if (story.id === 9861) {
      //_hint('???');
    }

    // children count
    if (story.children.length === 0)
      _alert('No children assigned to this story');

    // dev/qa task count issues
    if (story.stats) {
      if (story.children.length > 0) {
        if (story.stats.tasks.devTasks.length === 0)
          _hint('No dev task created for this story');
        if (story.stats.tasks.qaTasks.length === 0)
          _hint('No quality task created for this story');
      }
    }

    // story status issues - based on tasks
    if (story.children.filterValue('status', ['Done', 'In Verification', 'Blocked']).length === story.children.length) {
      if (story.blocked === true ) {
        _critical('User story is not done because of a blocked task');
      } else {
        if (story.children.filterValue('status', 'Done').length === story.children.length && story.status !== STORY_CLOSED) {
          _critical('Every task closed in the user story, but the story');
        }
        var tasksInVerification = story.children.filterValue('status', 'In Verification').length;
        if (tasksInVerification > 0)
          _alert(tasksInVerification + ' tasks are in verification');
      }
    }

    // story/task owner issues
    if (story.owner === 'Nicht zugewiesen')
      _critical('Story has no owner!');
    if (story.children.length > 0) {
      var otherOwners = story.children.filterValue('owner', 'Nicht zugewiesen', true);
      var tasksWithoutOwner = story.children.filterValue('owner', 'Nicht zugewiesen');
      if (otherOwners.length === 0)
        _hint('No owner set for tasks!');

      if (sumSpentTime(tasksWithoutOwner) > 0)
        _critical('Hours booked on tasks where no owner is set! (' +
            tasksWithoutOwner.filter(function(item) {return item.timespent > 0; }).
              map(function(task){return '#' + task.id;}).join()+')');
    }

    // story has spent hours, not closed, task are not modified in days
    if (story.children.length > 0 && story.status !== STORY_CLOSED) {
      if (sumSpentTime(story.children) > 0) {
        story.children.sort(function(a,b) { ((a.modified < b.modified) ? -1 : ((a.modified > b.modified) ? 1 : 0)); } );
        var lastModifiedTaks = new Date(story.children[0].modified);
        var now = new Date();
        if (lastModifiedTaks.getTime() < (now.getTime() - (5 * 24 * 3600 * 1000)))
          _critical('User story has booked hours, but not modified in 5 days');
        else
          if (lastModifiedTaks.getTime() < (now.getTime() - (3 * 24 * 3600 * 1000)))
            _alert('User story has booked hours, but not modified in 3 days');
          else
            if (lastModifiedTaks.getTime() < (now.getTime() - (1 * 24 * 3600 * 1000)))
              _hint('User story has booked hours, but not modified in a day');
      };
    }

    // blocked tasks
    if (story.blocked === true) {
      var blockedTasks = story.children.filterValue('status', 'Blocked').length;
      if (blockedTasks === 1)
        _alert('There is a blocked task in this story');
      else
        _critical('More than one task is blocked');
    }


    function _hint(description) { createAlert('hint', description); }
    function _alert(description) { createAlert('alert', description); }
    function _critical(description) { createAlert('critical', description); }
    function createAlert(severity, description) {
      story.alerts.push({'severity': severity, 'description': description});
    };
  }

  function sumSpentTime(tasks) {
    if (tasks.length > 0) {
      return Number(tasks.reduceRight(function(a,b){
        if (angular.isNumber(a))
          return a + b.timespent;
        else
          return a.timespent + b.timespent;
      })).toFixedNumber();
    } else
      return 0;
  }

  return stories;
};
