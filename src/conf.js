module.exports = function(RED) {
  var tokens = []

  function zapierConf(n) {
    RED.nodes.createNode(this,n);
    this.token = n.token;
    tokens.push(this.token)
    this.on('close', function() {
      tokens = tokens.filter(function(ele){ return ele != this.token; });
    })
  }

  RED.nodes.registerType("zapier_conf", zapierConf);

  RED.httpNode.get('/_zapier/test', function(req, res){
    if (tokens.indexOf(req.headers['teknoir-devstudio-auth-header']) > -1) {
      res.send('ok');
    } else{
      res.send(403);
    }
  })
}
