var request = require('request');
var fs = require('fs');
var bresponse = undefined;
var path = './public/javascripts/mapdata.js';

function get_cc(cb) {
  var req_url = "http://btczexplorer.blockhub.info/ext/connections/";
  request({uri: req_url, json: true}, function (error, response, body) {
  bresponse = body;
  cb(bresponse);
  });
}

function proc_cc(bresponse) {
    var counts = {};
     for (var c =0; c < bresponse.data.length; c++) {
      counts[bresponse.data[c].countrycode] = 1 + (counts[bresponse.data[c].countrycode] || 0);
  }
    var countsSorted = [];
     for  (var ccode in counts) {
      countsSorted.push([ccode, counts[ccode]]);
  }
    countsSorted.sort(function(a, b) {
    return b[1] - a[1];
  });
    var ccobj = {};
     countsSorted.forEach(function(data) {
      ccobj[data[0]] = data[1]
  });
    var mapData = JSON.stringify(ccobj);
//    console.log(mapData);
    var jsonData = 'var mapData = ' + mapData + ';';
    fs.writeFile(path, jsonData, function(error) {
      if (error) {
        console.error("write error: " + error.message);
      } else {
        console.log("Successful Write to " + path);
      }
    });
//    console.log(jsonData);
    return mapData;
};
get_cc(proc_cc);

