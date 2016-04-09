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

global.me = { "m_count":0,"uuid": myuuid , "want":{} };
global.inbox = {"count":0, "messages":[]}
global.peers = {"count":0, "peers":[]};

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


function compareWants(otherWant, index){
  console.log("incw");
	var myWant = me.want;
	var mykeys = Object.keys(myWant);
	for(i = 0; i < mykeys.length; i++){
		var x = mykeys[i];
		if(x in otherWant){
			if(otherWant[x] < myWant[x]){
				var y = parseInt(otherWant[x]) + 1;
        console.log(peers.peers[index].want[x]);
				peers.peers[index].want[x] = y;
        console.log(peers.peers[index].want[x]);
				return x + ":" + y;
			}

		}
		else{
      peers.peers[index].want[x] = 0;
      return x + ":" + 0
    }
	}

	return false;


}

function i_want(){
	var myWant = me.want;
	for(j = 0; j<peers.peers.count; j++ ){
		var otherWant = peers.peers[j].want;
		var otherKeys = Object.keys(otherWant);
		for(i = 0; i < otherKeys.length; i++){
			var x = otherKeys[i];
			if(x in myWant){
				if(myWant[x] < otherWant[x]){
					var y = myWant[x] + 1;
					return x + ":" + y;
				}

			}
			else{return x + ":" + 0}
		}
	}

	return false;


}

function sendMsg(){

	console.log("sendMsg");

	if(Math.floor(Math.random() * 2) == 1){
		//want

    console.log("in want server");

		var i = i_want();
		if(i === false) i = Math.floor(Math.random() * peers.count);
    console.log(i);
    console.log(peers);
		var u = JSON.stringify(peers.peers[i].url).replace(/\"/g, "");
		var mu = u + "/message";
		var full = {"Want": me.want, "Endpoint" : me.url};

    console.log(full);
		console.log(mu);

		request.post(mu,{
			headers: {'content-type' : 'application/json'},
			form : {message : full}
					}, function(error, response, body){
						console.log(error);
					  console.log(body);
					});
	}
	else{
		//rumor
		for(i = 0; i < peers.count; i++){
			var x = compareWants(peers.peers[i].want, i);
			console.log(x);
			if(x!=false){
				for(j=0; j < messages.count; j++){
					if(messages.messages[j].MessageID == x){
						var u = peers.peers[i].url;
						var mu = u + '/message';
						var full = {"Rumor": messages.messages[j], "Endpoint":me.url};

						console.log("in Rumor in server");
            console.log(peers.peers[i]);
						console.log(full);
						request.post(mu,{
										headers: {'content-type' : 'application/json'},
									  form : {message : full}
									}, function(error, response, body){
										console.log(error);
									  console.log(body);
									});
					}
				}
			}
		}


	}
}


function loop(){
		//console.log("inloop");
		if(peers.count > 0) sendMsg();
		setTimeout(loop, 3000);
}
