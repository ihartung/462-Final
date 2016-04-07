// app/routes.js
var fs = require("fs");
var request = require("request");


module.exports = function(app) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function(req, res) {
        if('user_name' in me) {
          res.render('profile.ejs',{
              user_name: me.user_name,
              list: inbox
              users: peers
          });
        }
        else res.render('index.ejs'); // load the index.ejs file
    });


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


        console.log(inbox);
        console.log(me.want);

        res.redirect('/');
    });




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

        if(message.hasOwnProperty("Want")){

          console.log(peers);

          var found = false;

          for(i = 0; i < peers.count; i++){
            if(peers.peers[i].url == message.Endpoint){
              peers.peers[i].want = message.Want;
              found = true;
            }
          }

          if(!found){
            peers.peers[peers.count] = {"want": message.Want, "url":message.Endpoint};
            peers.count = peers.count + 1;
          }

        }
        else if(message.hasOwnProperty("Rumor")){
          //Rumor

          console.log("inRumor");

          var mid = JSON.stringify(message.Rumor.MessageID).replace(/\"/g, "");
          var array = mid.split(":");
          var uuid = array[0].trim();
          var sn = array[1].trim();
          var good = false;

          console.log(uuid);
          console.log(sn);
          console.log(message.Rumor);

          //if the message uuid is in me
          if(uuid in me.want){
            //if I do not have the message
            if(sn > me.want[uuid]){
              good = true;
            }
          }
          else good = true;

          console.log(good);

          if(good){
            inbox.messages[inbox.count] = message.Rumor;
            inbox.count = inbox.count + 1;
            me.want[uuid] = sn;
          }

          console.log(inbox);
          console.log(me);

          var found = false;

          for(i = 0; i < peers.count; i++){
            if(peers.peers[i].url == message.Endpoint){
              found = true;
            }
          }

          if(!found){
            peers.peers[peers.count] = {"want": {}, "url":message.Endpoint};
            peers.peers[peers.count].want[uuid] = sn;
            peers.count = peers.count + 1;
          }

        } else{
          console.log("neither");

          console.log(peers);

          var found = false;

          for(i = 0; i < peers.count; i++){
            if(peers.peers[i].url == message.Endpoint){
              peers.peers[i].want = {};
              found = true;
            }
          }

          if(!found){
            peers.peers[peers.count] = {"want": {}, "url":message.Endpoint};
            peers.count = peers.count + 1;
          }

        }



        res.status(200).send('OK');

    });

    //add a peer
    app.post('/peer', function(req, res){
        //var u = req.body.peer;
        console.log("post/peer");

        var url = JSON.stringify(req.body.peer).replace(/\"/g, "");
        var murl = "http://" + url;

        var peer = { "want":{}, "url" : murl}
        peers.peers[peers.count] = peer;
        peers.count = peers.count + 1;

        console.log(peers);

        res.redirect('/');

    });



};
