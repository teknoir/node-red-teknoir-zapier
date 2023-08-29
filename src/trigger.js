const http = require('node:http');
const urlparse = require('url-parse')
var bodyParser = require('body-parser')


module.exports = function(RED) {
  function trigger(n) {
        RED.nodes.createNode(this, n);
        var node = this;
        this.name = n.name
        let o ={}
        o.name = this.name 
        o.id = this.id
        trigger_nodes.push(o)
        this.token = RED.nodes.getNode(n.conf).token
        node.on('input', function(msg) {
          if (!trigger_webhooks[this.id]){
            node.error("Webhook Not Defined, check there is an active Zap for this trigger")
          }
          let url = trigger_webhooks[this.id]
          this.last_msg = {
            id: msg._msgid,
            topic : msg.topic,
            payload : msg.payload
          }
          const msg_data = JSON.stringify(this.last_msg)

          let parsed_url = urlparse(url, true)
          const options = {
            hostname: parsed_url.hostname,
            port: parsed_url.port,
            path: parsed_url.pathname,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(msg_data),
            },
          }
          const req = http.request(options, (res) => {
            console.log(`statusCode: ${res.statusCode}`)
            res.setEncoding('utf8');
            if (res.statusCode != 200){
              node.error(res.statusCode+': '+res.statusMessage)
            }
            res.on('data', function (chunk) {
              console.log('BODY:', chunk);
            });
            res.on('end', function () {
              console.log('No more data in response.');
            });
          })
          req.on('error', (error) => {
            node.error(error);
          })
          req.write(msg_data);
          req.end();
        })
        this.on("close", function(removed, done) {
          var node = this;
          trigger_nodes.map(function(x, i){
            if (x.id == node.id){
              trigger_nodes.splice(i, 1)
            }
          }) 
          if (removed){          
            delete trigger_webhooks[node.id]
            if (Object.keys(trigger_webhooks).length == 0){
              RED.settings.delete('zapierTriggerWebhooks')
            } else {
              RED.settings.set('zapierTriggerWebhooks', trigger_webhooks)
            }
          }
          done()
        })
  }
  RED.nodes.registerType("zapier_trigger",trigger);
  
  RED.httpNode.use('/_zapier/triggers/*', bodyParser.json());

  RED.httpNode.post('/_zapier/triggers/:id', function(req, res){ 
    let target_node = RED.nodes.getNode(req.params.id)
    if (target_node){
      if (target_node.token == req.headers['teknoir-devstudio-auth-header']){
        trigger_webhooks[req.params.id] = req.body.webhook
        let r = RED.settings.set('zapierTriggerWebhooks', trigger_webhooks)
        r.then(function(v) {
          res.send({status: 'ok'});
        })
      } else {
        res.sendStatus(403);
      }
    } else {
      res.sendStatus(404);      
    }
  })

  RED.httpNode.delete('/_zapier/triggers/:id', function(req, res){ 
    let target_node = RED.nodes.getNode(req.params.id)
    if (target_node){
      if (target_node.token == req.headers['teknoir-devstudio-auth-header']){
        delete trigger_webhooks[req.params.id]
        if (Object.keys(trigger_webhooks).length == 0){
          RED.settings.delete('zapierTriggerWebhooks')
        } else {
          let r = RED.settings.set('zapierTriggerWebhooks', trigger_webhooks)
        }
        res.sendStatus(204);
      } else {
        res.sendStatus(403);
      }
    } else {
      res.sendStatus(404);      
    }
  })

  RED.httpNode.get('/_zapier/triggers/:id', function(req, res){ 
    let target_node = RED.nodes.getNode(req.params.id)
    if (target_node){
      if (target_node.token == req.headers['teknoir-devstudio-auth-header']){
        const sample = {
          "payload": "This is a Sample as no message has been received by the node yet",
          "id" : "11111111.aaaaaa",
          "topic" : "Sample"
        }
        let response = target_node.last_msg || sample
        res.send([response])
      } else {
        res.sendStatus(403);
      }
    } else {
      res.sendStatus(404);      
    }
  })

  RED.httpNode.get('/_zapier/triggers', function(req, res){
    var tokens = []
    for (x in trigger_nodes){
      let nid = trigger_nodes[x]['id']
      tokens.push(RED.nodes.getNode(nid).token)
    }

    if (tokens.indexOf(req.headers['teknoir-devstudio-auth-header']) > -1) {
      res.json({triggers: trigger_nodes});
    } else{
      res.sendStatus(403);
    }
  })


  var trigger_nodes = []; 
  var trigger_webhooks= RED.settings.get('zapierTriggerWebhooks') || {}

  

}
