var bodyParser = require('body-parser')

module.exports = function (RED) {
    function action(n) {
        RED.nodes.createNode(this, n);
        var node = this;
        this.name = n.name
        // let o = {}
        // o.name = this.name
        // o.id = this.id
        // action_nodes.push(o)
        // this.token = RED.nodes.getNode(n.conf).token;
        this.on('newAction', function (body) {
            var msg = {};
            msg.payload = body.payload
            msg.topic = body.topic || ""
            node.send(msg);
        })
        // this.on("close", function () {
        //     var node = this;
        //     action_nodes.map(function (x, i) {
        //         if (x.id == node.id) {
        //             action_nodes.splice(i, 1)
        //         }
        //     })
        // })
    }

    RED.nodes.registerType("zap_action", action);

    RED.httpNode.use('/_zap/action/*', bodyParser.json());

    RED.httpNode.post('/_zap/action/:id', function (req, res) {
        let target_node = RED.nodes.getNode(req.params.id)
        
        console.log("Received headers:", req.headers);  
        console.log("Received body:", req.body);  

        if (!req.body) {
            return res.status(400).send("Bad Request: Missing body");
        }
        
        if (target_node) {
            target_node.emit('newAction', req.body)
            res.send(req.body);
        } else {
            res.sendStatus(404);
        }
    })

}
