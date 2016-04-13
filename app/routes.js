// app/routes.js
var fs = require("fs");
var request = require("request");
var $ = require('jquery');
var MsTranslator = require('mstranslator');



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


function merge_messages(ms1, ms2){
  var has = false;
  var result = ms2;
  for(i = 0; i < ms1.length; i++){
    has = false;
    for(j = 0; j < ms2.length; j++){
      if(ms1[i].MessageID == ms2[j].MessageID){
        has = true;
        break;
      }
    }
    if(!has){
      result[result.length] = ms1[i];
    }
  }

  return result;



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
          propogate(m, '/comment');
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
          var deletedMsg = [];
          
          for (i = 0; i < inbox.count; i++){
            
            if (inbox.messages[i].Time == keys[index-1]){
              deletedMsg = inbox.messages.splice(i,1);
              inbox.count = inbox.count - 1;
            }
          }
          propogate(deletedMsg[0], '/delete');
          console.log('after delete');
          console.log(inbox);
        }
        else{
          var message = {"Time" : d.getTime(), "MessageID":messageid, "Originator": me.user_name, "Text": req.body.message, "Comments": []}
          me.want[me.uuid] = me.m_count;
          me.m_count = me.m_count + 1;


          //propogate(message, "/message");


          inbox.messages[inbox.count] = message;
          inbox.count = inbox.count + 1;  
        }

        res.redirect('/');
    });


    app.post('/delete', function(req,res) {
      console.log('/delete');
      var m = req.body.message;
      var id = m.MessageID;
      for (i = 0; i < inbox.count; i++){     
        if (inbox.messages[i].MessageID == id){
          inbox.messages.splice(i,1);
          inbox.count = inbox.count - 1;
        }
      }
    });


    app.post('/comment', function(req,res) {
      console.log('/comment');
      var m = req.body.message;
      var id = m.MessageID;
      for (i = 0; i < inbox.count; i++){     
        if (inbox.messages[i].MessageID == id){
          inbox.messages[i] = m;
        }
      }
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

            //propogate(message, "/message");
          }

          console.log(inbox);
          console.log(me);



        res.status(200).send('OK');

    });


    //add a peer
    app.post('/peer', function(req, res){
        //var u = req.body.peer;
        console.log("post/peer");

        var url = JSON.stringify(req.body.info.url).replace(/\"/g, "");
        var un = JSON.stringify(req.body.info.user_name).replace(/\"/g, "");

        var messages = JSON.stringify(req.body.info.messages).replace(/\"/g, "")

        var has_peer = false;

        for(i = 0; i < peers.count; i++){
          if(peers.peers[i].user_name == un){
            has_peer = true;
            break;
          }
        }


        if(!has_peer){


          inbox.messages = merge_messages(messages, inbox.messages);

          inbox.count = inbox.messages.length;


          if(messages.length == 0 && inbox.count > 0){

            var inform = {};

            inform["user_name"] = me.user_name;
            inform["url"] = me.url;
            inform["messages"] = inbox.messages;

            ourl = url + "/peer";

            request.post({url:ourl,
              headers: {'content-type' : 'application/json'},
              form : {info : inform}
                  }, function(error, response, body){
                    console.log(error);
                    console.log(body);
              });
          }


        var peer = {"url" : url, "user_name": un};
        peers.peers[peers.count] = peer;
        peers.count = peers.count + 1;
      }

        console.log(peers);

        res.redirect('/');

    });


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

                request.post({url: url,
            			headers: {'content-type' : 'application/json'},
            			form : {info : inform}
            					}, function(error, response, body){
            						console.log(error);
            					  console.log(body);
            			});

                  break;

              }

          }

            res.redirect('/');

        });


    //send a request
    app.post('/request/send', function(req, res){
        //var u = req.body.peer;
        console.log("post/request");

        var url = JSON.stringify(req.body.peer).replace(/\"/g, "");
        var mu = "http://" + url + "/request/receive";

        var req = {"url":me.url, "user_name": me.user_name};

        request.post({url:mu,
    			headers: {'content-type' : 'application/json'},
    			form : {request : req}
    					}, function(error, response, body){
    						console.log(error);
    					  console.log(body);
    			});

        console.log(peers);

        res.redirect('/');

    });


    //receive a request
    app.post('/request/receive', function(req, res){
        //var u = req.body.peer;
        console.log("post/request");

        console.log(req);
        var request = req.body.request;

        requests.contacts[requests.count] = request;
        requests.count = requests.count + 1;
        console.log(requests);

        res.redirect('/');

    });


    //Listen for Heartbeat
    app.post('/alive', function(req, res){
        //var u = req.body.peer;
        console.log("post/request");

        var pulse = req.body.message;

        requests.heartbeats[pulse.url] = pulse.time_stamp;


        res.redirect('/');

    });





};
