var bodyParser = require('body-parser')

module.exports = function(RED) {
    function action(n) {
      RED.nodes.createNode(this, n);
      var node = this;
      this.name = n.name
      let o ={}
      o.name = this.name 
      o.id = this.id
      action_nodes.push(o)
      this.token = RED.nodes.getNode(n.conf).token;
      this.on('newAction', function(body){
        var msg = {};
        msg.payload=body.payload
        msg.topic=body.topic || ""
        node.send(msg);
      })
      this.on("close",function() {
        var node = this;
        action_nodes.map(function(x, i){
          if (x.id == node.id){
              action_nodes.splice(i, 1)
          }
        })      
      })
  }

RED.nodes.registerType("zapier_action",action);

RED.httpNode.use('/_zapier/actions/*', bodyParser.json());

RED.httpNode.post('/_zapier/actions/:id', function(req, res){ 
  let target_node = RED.nodes.getNode(req.params.id)
  if (target_node){
    if (target_node.token == req.headers['teknoir-devstudio-auth-header']){
      target_node.emit('newAction', req.body)
      res.send(req.body);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(404);      
  }
})

var action_nodes = []

RED.httpNode.get('/_zapier/actions', function(req, res){
  var tokens = []
  for (x in action_nodes){
    let nid = action_nodes[x]['id']
    tokens.push(RED.nodes.getNode(nid).token)
  }
  if (tokens.indexOf(req.headers['teknoir-devstudio-auth-header']) > -1) {
    res.json({actions : action_nodes});
  } else{
    res.sendStatus(403);
  }
})


  
}
