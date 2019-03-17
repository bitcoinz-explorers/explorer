var mongoose = require('mongoose')
  , lib = require('../lib/explorer')
  , db = require('../lib/database')
  , settings = require('../lib/settings')
  , request = require('request');

var COUNT = 5000; //number of blocks to index

function maskips (splitaddy) {
  var ip = splitaddy;
  var breakip = ip.split('.');
  var masked = breakip[0] + '.' + breakip[1] + '.' + 'XXX' + '.' + 'XXX';
//  console.log(breakip[0] + '.' + breakip[1] + '.' + 'XXX' + '.' + 'XXX');
  return masked;
}

function trim(s, mask) {
while (~mask.indexOf(s[0])) {
 s = s.slice(1);
}
while (~mask.indexOf(s[s.length - 1])) {
s = s.slice(0, -1);
}
return s;
}

function exit() {
  mongoose.disconnect();
  process.exit(0);
}

var dbString = 'mongodb://' + settings.dbsettings.user;
dbString = dbString + ':' + settings.dbsettings.password;
dbString = dbString + '@' + settings.dbsettings.address;
dbString = dbString + ':' + settings.dbsettings.port;
dbString = dbString + '/' + settings.dbsettings.database;

mongoose.connect(dbString, function(err) {
  if (err) {
    console.log('Unable to connect to database: %s', dbString);
    console.log('Aborting');
    exit();
  } else {
    request({uri: 'http://127.0.0.1:' + settings.port + '/api/getpeerinfo', json: true}, function (error, response, body) {
      lib.syncLoop(body.length, function (loop) {
        var i = loop.iteration();
        var address = trim(body[i].addr.substring(0, body[i].addr.lastIndexOf(":")), "[]");
	var maskedaddy = maskips(address);
        db.find_peer(maskedaddy, function(peer) {
          if (peer) {
            // peer already exists
            loop.next();
          } else {
            request({uri: 'http://ip-api.com/json/' + address, json: true}, function (error, response, geo) {
              db.create_peer({
                address: maskedaddy,
                protocol: body[i].version,
                version: body[i].subver.replace('/', '').replace('/', ''),
                country: geo.country,
                countrycode: geo.countryCode
              }, function(){
                loop.next();
              });
            });
          }
        });
      }, function() {
        exit();
      });
    });
  }
});
