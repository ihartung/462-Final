// server.js

// set up ======================================================================
// get all the tools we need
var fs = require('fs');
var express  = require('express');
var http = require('http')
var app      = express();
var request = require('request');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');

var uuid = require("node-uuid");

var myuuid = uuid.v1();


//me will eventually have a url and name field
global.me = { "m_count":0,"uuid": myuuid , "want":{} };
global.inbox = {"count":0, "messages":[]}
global.peers = {"count":0, "peers":[]};
global.requests = {"count":0, "contacts":[]};
global.heartbeats = {};

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.set('view engine', 'ejs'); // set up ejs for templating


// routes ======================================================================
require('./app/routes.js')(app);

// launch ======================================================================
//app.listen(port);
http.createServer(app).listen(80);
console.log('The magic happens on port ' + 80);
loop();


function im_alive(){
  var d = new Date();
  var ts = d.getTime();
  var hb = {"url":me.url, "time_stamp":ts};

  for (i=0; i<peers.count; i++) {
    var url = peers.peers[i].url;

    request.post(url,{
			headers: {'content-type' : 'application/json'},
			form : {message : hb}
					}, function(error, response, body){
						console.log(error);
					  console.log(body);
					});

}

}


function they_are_alive(){
  var d = new Date();
  var ts = d.getTime();

  for (var key in heartbeats) {
      var ots = heartbeats[key];
      //if I haven't hear a heartbeat in 6 seconds
      if((ts-ots)<6000){
        for (i=0; i<peers.count; i++) {
          if(peers.peers[i].url == key)
            peers.peers.splice(i, 1);
              }
      }
  }


function loop(){
		//console.log("inloop");
		if(peers.count > 0) {
      im_alive();
      they_are_alive();
    }
		setTimeout(loop, 3000);
}
