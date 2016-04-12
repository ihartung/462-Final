// app/routes.js
var fs = require("fs");
var request = require("request");
var $ = require('jquery');
var MsTranslator = require('mstranslator');


module.exports = function(app) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function(req, res) {
        if('user_name' in me) {
          res.render('profile.ejs',{
              user_name: me.user_name,
              list: inbox,
              users: peers,
              text: translation
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

    app.post('/translate', function(req,res) {
      var str = req.body.string;
      console.log(str);

      var client = new MsTranslator({
        client_id: "matt0911"
        , client_secret: "yAwirsSv8D9zGCBCamjLOtTvnYFdw7jFaAdrkdCCsRs="
      }, true);

      var params = {
        text: str
        , from: 'en'
        , to: 'es'
      };

      // Don't worry about access token, it will be auto-generated if needed.
      client.translate(params, function(err, data) {
        console.log(data);
        translation = "<p>Translation is: " + data + "</p>";
        res.redirect('/');
      });

    })

    //add local message
    app.post('/local/message', function(req, res){
        //get all messages

        console.log("post/local/message");

        var messageid = me.uuid + ":" + me.m_count;
        var d = new Date();
        var str = req.body.message;
        var split = str.split(':');
        console.log(split);
        if(split[0] == 'comment'){
          var index = split[1];
          var msgMap = {};
          for (i = 0; i < inbox.count; i++){
              var m = inbox.messages[i];
              msgMap[m.Time] = m;
          }

          var keys = Object.keys(msgMap);
          keys = keys.sort();
          var m = msgMap[keys[index-1]];
          for (i = 0; i < inbox.count; i++){
            if (inbox.messages[i].Time == keys[index-1]){
              inbox.messages[i].Comments.push({"Originator": me.user_name, "Comment": split[2]});    
            }
          }          
        }
        else if (split[0] == 'delete'){
          var index = split[1];
          var msgMap = {};
          for (i = 0; i < inbox.count; i++){
              var m = inbox.messages[i];
              msgMap[m.Time] = m;
          }

          var keys = Object.keys(msgMap);
          keys = keys.sort();
          var m = msgMap[keys[index-1]];
          console.log(inbox);
          for (i = 0; i < inbox.count; i++){
            console.log(inbox.messages[i]);
            if (inbox.messages[i].Time == keys[index-1]){
              inbox.messages.splice(i,1);
              inbox.count = inbox.count - 1;
            }
          }
          console.log('after delete');
          console.log(inbox);
        }
        else{
          var message = {"Time" : d.getTime(), "MessageID":messageid, "Originator": me.user_name, "Text": req.body.message, "Comments": []}
          me.want[me.uuid] = me.m_count;
          me.m_count = me.m_count + 1;



          inbox.messages[inbox.count] = message;
          inbox.count = inbox.count + 1;  
        }

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
