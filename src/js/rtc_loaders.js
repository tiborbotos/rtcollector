
if (typeof rtc == "undefined" || !rtc) {
  rtc = {};
}
if (typeof rtc.loaders == "undefined" || !rtc.loaders) {
  rtc.loaders = {};
}


var C = {
  RTC_URL_ALL_USER_STORIES_IN_CURRENT_ITERATION : 'https://ccm.at.phs.emea.vwg/ccm/resource/itemOid/com.ibm.team.workitem.query.QueryDescriptor/_ha1c00xREeOM08TzbieYbw?_mediaType=text/html&nocache=1384340111028',
  RTC_WORKITEMS_CHUNK_QUERY_URL: 'https://ccm.at.phs.emea.vwg/ccm/resource/itemOid/com.ibm.team.workitem.query.QueryDescriptor/_RLWAUkxaEeOM08TzbieYbw?_mediaType=text/html&jsonParameterValues='
};
var workItems = [];
var childItems = {}; // associative array

/**
 * Creates the containers for the iframe load
 */
rtc.loaders._initLoaderContainers = function () {
  $('<div id="rtc-collector-userstories">').appendTo('body');
  $('<div id="rtc-collector-tasks">').appendTo('body');
};

rtc.loaders.loadTopLevelItems = function (onSuccess) {
  rtc.loaders._initLoaderContainers();

  $('#rtc-collector-userstories').load(C.RTC_URL_ALL_USER_STORIES_IN_CURRENT_ITERATION, function() {
    var elements = $('table.results tr.workitem');
    var backlogData = rtc.loaders.collectUserStoryLinksFromQueryResult(elements);

    onSuccess(backlogData.items, backlogData.childItems);
  });
};


/**
 * Loader1
 */
rtc.loaders.collectUserStoryLinksFromQueryResult = function (rows){
  var items = [];

  $.each(rows, function(tr) {
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
};


rtc.loaders.loadChildItems = function(itemList, success) {
  var idList = [];
  $.each(itemList, function(index) {
    if (isNaN(Number(index)) === false)
    idList.push(index);
  });

  retrieveChildData();

  function retrieveChildData() {
    var idsToDownload = idList.splice(0, 11);
    if (idsToDownload.length == 0) {
      console.log('Finished downloading child elements!');
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
        requestParam[queryId] = {"attributeId" : "id", "operator" : "is", "values" : [ Number(workItemId) ], "variables" : []};
      } else requestParam[queryId] = null;
    });

    var url = C.RTC_WORKITEMS_CHUNK_QUERY_URL;
    var parameters = encodeURIComponent(JSON.stringify(requestParam));
    url = url + parameters + '&nocache=' + (new Date()).getTime();

    // load and parse
    $.get(url).
      done(parseExecutionItemQueryRow).
      fail(function() {
        console.log('Failed!');
      });
  }

  function parseExecutionItemQueryRow(data) {
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
        'status' : $('td.attribute', workitemRow)[10].textContent.trim()};
      result.push(workItem);
    });

    executionItemsParsed(result);
  }

  function executionItemsParsed(childrenData) {
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