// app/routes.js
var fs = require("fs");
var request = require("request");



function propogate(m, path){

  for (i=0; i<peers.count; i++) {
    var url = peers.peers[i].url + path;

    request.post(url,{
      headers: {'content-type' : 'application/json'},
      form : {message : m}
          }, function(error, response, body){
            console.log(error);
            console.log(body);
          });

}

}



module.exports = function(app) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function(req, res) {
        if('user_name' in me) {
          res.render('profile.ejs',{
              user_name: me.user_name,
              list: inbox,
              users: peers
          });
        }
        else res.render('index.ejs'); // load the index.ejs file
    });

_______________________________________________________________________________________


  app.post('/', function(req, res) {

        console.log("post/");

        console.log(req.body);

        if(!("url" in me)){

          var fullUrl = req.protocol + '://' + req.get('host');

          me.url = fullUrl;
        }

        me.user_name = req.body.username;

        console.log(JSON.stringify(me));

        res.redirect('/');

    });

_______________________________________________________________________________________

    //add local message
    app.post('/local/message', function(req, res){
        //get all messages

        console.log("post/local/message");

        var messageid = me.uuid + ":" + me.m_count;
        var message = {"MessageID":messageid, "Originator": me.user_name, "Text": req.body.message}
        me.want[me.uuid] = me.m_count;
        me.m_count = me.m_count + 1;



        inbox.messages[inbox.count] = message;
        inbox.count = inbox.count + 1;

        propogate(message, "/message");


        console.log(inbox);
        console.log(me.want);

        res.redirect('/');
    });


_______________________________________________________________________________________

    //add message from other peer
    app.post('/message', function(req, res){
        //get all messages
        if(!("url" in me)){

          var fullUrl = req.protocol + '://' + req.get('host');

          me.url = fullUrl;
        }

        console.log("post/message");

        console.log(req.body);
        //get and parse body of request
        var message = req.body.message;

        console.log(req.body.message);


          var mid = JSON.stringify(message.MessageID).replace(/\"/g, "");
          var array = mid.split(":");
          var uuid = array[0].trim();
          var sn = array[1].trim();
          var has = false;

          console.log(uuid);
          console.log(sn);
          console.log(message);

          //if the message uuid is in me
          for (i=0; i<messages.count; i++) {
            if(mid == inbox.messages[i].MessageID){
               has = true;
               break;
            }
          }

          console.log(good);

          if(!has){
            inbox.messages.push(message);
            inbox.count = inbox.count + 1;

            propogate(message, "/message");
          }

          console.log(inbox);
          console.log(me);



        res.status(200).send('OK');

    });

_______________________________________________________________________________________

    //add a peer
    app.post('/peer', function(req, res){
        //var u = req.body.peer;
        console.log("post/peer");

        var url = JSON.stringify(req.body.info.url).replace(/\"/g, "");
        var murl = "http://" + url;
        var un = JSON.stringify(req.body.info.user_name).replace(/\"/g, "");

        var messages = JSON.stringify(req.body.info.messages).replace(/\"/g, "")



        var peer = {"url" : murl, "user_name": un};
        peers.peers[peers.count] = peer;
        peers.count = peers.count + 1;

        if(inbox.count == 0){
          inbox.messages = messages;
          inbox.count = messages.length;
        }

        console.log(peers);

        res.redirect('/');

    });

    _______________________________________________________________________________________

        //send an accept
        app.post('/accept', function(req, res){
            //var u = req.body.peer;
            console.log("post/request");

            var name = JSON.stringify(req.body.peer).replace(/\"/g, "");
            var inform = {};

            for (i=0; i<requests.count; i++) {
              if(name == requests.contacts[i].user_name){

                url = request.contacts[i].url + "/peer";

                inform["user_name"] = me.user_name;
                inform["url"] = me.url;
                inform["messages"] = inbox.messages;

                request.post(url,{
            			headers: {'content-type' : 'application/json'},
            			form : {info : inform}
            					}, function(error, response, body){
            						console.log(error);
            					  console.log(body);
            			});

                  peers.peers[peers.count] = requests.contacts[i];
                  requests.contacts.splice(i, 1);

                  break;

              }

          }

            res.redirect('/');

        });

_______________________________________________________________________________________

    //send a request
    app.post('/request/send', function(req, res){
        //var u = req.body.peer;
        console.log("post/request");

        var url = JSON.stringify(req.body.peer).replace(/\"/g, "");
        var mu = "http://" + url + "/request/receive";

        var req = {"url":me.url, "user_name", me.user_name};

        request.post(mu,{
    			headers: {'content-type' : 'application/json'},
    			form : {request : req}
    					}, function(error, response, body){
    						console.log(error);
    					  console.log(body);
    			});

        console.log(peers);

        res.redirect('/');

    });

_______________________________________________________________________________________

    //receive a request
    app.post('/request/receive', function(req, res){
        //var u = req.body.peer;
        console.log("post/request");

        var request = req.body.request;

        requests.contacts[requests.count] = request;
        requests.count = requests.count + 1;


        res.redirect('/');

    });

_______________________________________________________________________________________

    //Listen for Heartbeat
    app.post('/alive', function(req, res){
        //var u = req.body.peer;
        console.log("post/request");

        var pulse = req.body.message;

        requests.heartbeats[pulse.url] = pulse.time_stamp;


        res.redirect('/');

    });





};
