const { http } = require('follow-redirects');
const urlparse = require('url-parse');
var bodyParser = require('body-parser');

module.exports = function (RED) {
    function trigger(n) {
        RED.nodes.createNode(this, n);
        var node = this;
        this.name = n.name;

        node.on('input', function (msg) {
            const subscribed = node.context().get('subscribed');
            if (!subscribed) {
                node.status({ fill: "red", shape: "dot", text: "unsubscribed" });
                return;
            }

            let msg_cache = node.context().get('cache') || [];
            if (msg_cache.length >= 100) {
                node.status({ fill: "orange", shape: "dot", text: "cache full: oldest message removed" });
                msg_cache.shift();
            } else {
                node.status({ fill: "green", shape: "dot", text: `cache size: ${msg_cache.length + 1}` });
            }
            msg_cache.push(msg);
            node.context().set('cache', msg_cache);
        });
    }

    RED.nodes.registerType("zap_trigger", trigger);

    function handleSubscription(req, res, isSubscribe) {
        let target_node = RED.nodes.getNode(req.params.id);
        if (target_node) {
            target_node.context().set('subscribed', isSubscribe);
            const statusText = isSubscribe ? "subscribed" : "unsubscribed";
            target_node.status({ fill: isSubscribe ? "green" : "red", shape: "dot", text: statusText });
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    }

    RED.httpNode.post('/_zap/trigger/:id', (req, res) => handleSubscription(req, res, true));
    RED.httpNode.delete('/_zap/trigger/:id', (req, res) => handleSubscription(req, res, false));

    RED.httpNode.get('/_zap/trigger/:id', function (req, res) {
        let target_node = RED.nodes.getNode(req.params.id);
        if (target_node) {
            const samples = [{}];
            const msg_cache = target_node.context().get('cache') || samples;
            res.send(msg_cache);
        } else {
            res.sendStatus(404);
        }
    });
}
