console.log('RTC-Collector initializing...');

var workItems = [];
var childItems = {};
var collectorDiv;

var RTCUtils = (function() {
  this.C = {
    BACKLOG_ITEM_SUMMARY_PREFIX : 'https://ccm.at.phs.emea.vwg/ccm/resource/itemName/com.ibm.team.workitem.WorkItem/',
    BACKLOG_ITEM_SUMMARY_POSTFIX : '?_mediaType=text%2Fhtml&_selector=smallHover&_context=web',

    RTC_URL_ALL_USER_STORIES_IN_CURRENT_ITERATION : 'https://ccm.at.phs.emea.vwg/ccm/resource/itemOid/com.ibm.team.workitem.query.QueryDescriptor/_ha1c00xREeOM08TzbieYbw?_mediaType=text/html&nocache=1384340111028'
  }

  /**
   * Run function when selector is available. Config parameter: -selector,
   * -content, -failed
   */
  this.runWhenLoaded = function(config, success) {
    var selector = config.selector;
    var content = (config.content || 'body');
    var failed = config.failed;
    var repeatCount = config.repeatCount;

    var element = $(selector, $(content).contents());

    if (typeof element !== 'undefined' && element.size() > 0) {
      success(element);
    } else {
      if (typeof repeatCount === 'number' && repeatCount < 20) {
        again(repeatCount + 1);
      } else {
        if (typeof repeatCount === 'undefined') {
          again(1);
        } else {
          console.error('Failed to find element: ' + selector + ' (' + content
              + ')');
          if (typeof failed !== 'undefined') {
            failed(selector);
          }
        }
      }
    }

    function again(repeatCount) {
      window.setTimeout(function() {
        config.repeatCount = repeatCount;
        runWhenLoaded(config, success);
      }, 500);
    }
  }

  this.collectUserStoryLinks = function(list) {
    var items = [];
    var childItems = {}; // associative array

    $.each(list, function(tr) {
      var workItem = {};
      workItem.workItemType = $(this).find('.attribute')[0].textContent.trim();
      workItem.id = Number($($(this).find('.attribute')[1]).find('a')[0].text.trim());
      workItem.summary = $(this).find('.attribute')[2].textContent.trim();
      workItem.owner = $(this).find('.attribute')[3].textContent.trim();
      workItem.status = $(this).find('.attribute')[4].textContent.trim();
      workItem.priority = $(this).find('.attribute')[5].textContent.trim();
      workItem.severity = $(this).find('.attribute')[6].textContent.trim();
      workItem.modified = Date.parse($(this).find('.attribute')[7].textContent.trim());
      workItem.children = [];
      var _children = $($(this).find('.attribute')[8]).find('a');
      _children.each(function(child) {
        var childId = _children[child].text.replace(',', '').trim();
        workItem.children.push(Number(childId));

        childItems[Number(childId)] = {};
      });

      items.push(workItem);
    });

    return {items : items, childItems : childItems};
  }

  /**
   * @param itemList
   *                associative array, where key is the id of the child
   * @param informationDiv
   *                place to put information
   */
  this.loadChildItems = function(itemList, informationDiv, success) { //
    console.log('Itemlist size: ' + itemList.length);

    var idList = [];
    $.each(itemList, function(index) {
      if (isNaN(Number(index)) === false)
        idList.push(index);
    });

    retrieveChildData();

    function retrieveChildData() {
      var idsToDownload = idList.splice(0, 11);
      if (idsToDownload.length == 0) {
        console.log('Finished downloading!');
        success();
      } else {
        retrieveChildDataChunk(idsToDownload);
      }
    }

    function retrieveChildDataChunk(idsToDownload) {
      console.log('Download children: ' + idsToDownload);
      var queryIds = [ 'id151', 'id551', 'id561', 'id571', 'id581', 'id591', 'id601', 'id611', 'id621', 'id631', 'id01' ];
      var requestParam = {};
      $.each(queryIds, function(index, queryId) {
        var workItemId = idsToDownload[index];
        if (typeof workItemId !== 'undefined' && !isNaN(Number(workItemId))) {
          requestParam[queryId] = {
            "attributeId" : "id",
            "operator" : "is",
            "values" : [ Number(workItemId) ],
            "variables" : []
          };
        } else
          requestParam[queryId] = null;
      });

      var url = 'https://ccm.at.phs.emea.vwg/ccm/resource/itemOid/com.ibm.team.workitem.query.QueryDescriptor/_RLWAUkxaEeOM08TzbieYbw?_mediaType=text/html&jsonParameterValues=';
      var parameters = encodeURIComponent(JSON.stringify(requestParam));
      url = url + parameters + '&nocache=' + (new Date()).getTime();

      // load and parse
      var jqxhr = $.get(url).done(
              function(data) {
                var html = $.parseHTML(data);
                $('#rtc-collector-tasks').children().remove();
                $('#rtc-collector-tasks').append(html);

                var result = [];
                $.each($('#rtc-collector-tasks tr.workitem'), function(index, workitemRow) {
                          var workItem = { 'workItemType' : $('td.attribute', workitemRow)[0].textContent.trim(),
                            'id' : Number($('td.attribute a', workitemRow)[0].textContent.trim()),
                            'owner' : $('td.attribute', workitemRow)[2].textContent.trim(),
                            'timesheetentry' : $('td.attribute', workitemRow)[3].textContent.trim(),
                            'timespent' : hourMinToHour($('td.attribute', workitemRow)[4].textContent.trim()),
                            'tracks' : $('td.attribute', workitemRow)[5].textContent.trim(),
                            'estimate_dev' : $('td.attribute', workitemRow)[6].textContent.trim(),
                            'estimate_test' : $('td.attribute', workitemRow)[7].textContent.trim(),
                            'estimated' : hourMinToHour($('td.attribute', workitemRow)[8].textContent.trim()),
                            'modified' : Date.parse($('td.attribute', workitemRow)[9].textContent.trim()),
                            'status' : $('td.attribute', workitemRow)[10].textContent.trim()}
                          result.push(workItem);
                        });

                downloadComplete(result);
              }).fail(function() {
            console.log('Failed!');
          });
    }

    function downloadComplete(childrenData) {
      $.each(childrenData, function(index, childData) {
        itemList[childData.id] = childData;
      });
      retrieveChildData();
    }

    function hourMinToHour(s) {
      if (s.trim() === '')
        return 0;
      var m = /(\d+) h (\d+) m (\d+) s/.exec(s);
      if (m === null)
        m = /(\d+) hours (\d+) mins/.exec(s);
      if (m !== null)
        return Number(m[1]) + Number(60 / Number(m[2]));
      if (m === null)
        m = /(\d+) hours/.exec(s);
      if (m !== null)
        return Number(m[1]);
      else
        return 0;
    }
  }
})();

function pimp() {
  $('<div id="rtc-collector-userstories">').appendTo('body');
  $('<div id="rtc-collector-tasks">').appendTo('body');

  $('#rtc-collector-userstories').load(
      C.RTC_URL_ALL_USER_STORIES_IN_CURRENT_ITERATION, function() {
        var elements = $('table.results tr.workitem');
        console.log('Found items=' + elements.length);

        var backlogData = collectUserStoryLinks(elements);
        workItems = backlogData.items;
        childItems = backlogData.childItems;

        loadChildItems(childItems, collectorDiv, function() {
          console.log('Top level items loaded', workItems);
          console.log('ChildItems loaded!', childItems);

          renderStats();
        });
      });

  function renderStats() {
    var childItemCount = 0;
    var members = {};
    $.each(childItems, function(i, item) {
      childItemCount += 1;
      if (members[item.owner] === undefined)
        members[item.owner] = {
          'childItemCount' : 0,
          'timespent' : 0,
          'estimated' : 0,
          'tasks' : {}
        };
      members[item.owner].childItemCount += 1;
      members[item.owner].estimated += item.estimated;
      members[item.owner].timespent += item.timespent;

      if (members[item.owner].tasks[item.status] === undefined)
        members[item.owner].tasks[item.status] = {
          'childItemCount' : 0,
          'estimated' : 0,
          'timespent' : 0
        };
      members[item.owner].tasks[item.status].childItemCount += 1;
      members[item.owner].tasks[item.status].estimated += item.estimated;
      members[item.owner].tasks[item.status].timespent += item.timespent;
    });

    console.log('Members stat loaded!', members);
  }
}