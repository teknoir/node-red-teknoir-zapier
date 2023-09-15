const {http} = require('follow-redirects')
const urlparse = require('url-parse')
var bodyParser = require('body-parser')


module.exports = function (RED) {
    function trigger(n) {
        RED.nodes.createNode(this, n);
        var node = this;
        this.name = n.name

        node.on('input', function (msg) {
            const subscribed = node.context().get('subscribed')
            if (!subscribed) {
                node.status({fill: "red", shape: "dot", text: "unsubscribed"});
                return
            }

            let msg_cache = node.context().get('cache')
            if (!msg_cache) {
                msg_cache = []
                node.context().set('cache', msg_cache)
            }

            if (msg_cache.length > 99) {
                node.status({fill: "orange", shape: "dot", text: "cache full: message dropped"});
                msg_cache.shift()
                msg_cache.push(msg)
            } else {
                node.status({fill: "green", shape: "dot", text: `cache size: ${msg_cache.length}`});
                msg_cache.push(msg)
            }
        })
        // this.on("close", function (removed, done) {
        //     var node = this;
        //     trigger_nodes.map(function (x, i) {
        //         if (x.id == node.id) {
        //             trigger_nodes.splice(i, 1)
        //         }
        //     })
        //     if (removed) {
        //         delete trigger_webhooks[node.id]
        //         if (Object.keys(trigger_webhooks).length == 0) {
        //             RED.settings.delete('zapierTriggerWebhooks')
        //         } else {
        //             RED.settings.set('zapierTriggerWebhooks', trigger_webhooks)
        //         }
        //     }
        //     done()
        // })
    }

    RED.nodes.registerType("zap_trigger", trigger);

    RED.httpNode.post('/_zap/trigger/:id', function (req, res) {
            let target_node = RED.nodes.getNode(req.params.id)
            if (target_node) {
                const subscribed = target_node.context().get('subscribed')

                //Allow only one subscriber
                if (subscribed) {
                    res.sendStatus(403);
                }

                // Register a subscription
                target_node.context().set('subscribed', true)

                target_node.status({fill: "green", shape: "dot", text: "subscribed"});

                res.sendStatus(200);
            } else {
                res.sendStatus(404);
            }
        }
    )

    RED.httpNode.delete('/_zap/trigger/:id', function (req, res) {
            let target_node = RED.nodes.getNode(req.params.id)
            if (target_node) {

                // De-register a subscription
                target_node.context().set('subscribed', false)
                target_node .status({fill: "red", shape: "dot", text: "unsubscribed"});


                res.sendStatus(200);
            } else {
                res.sendStatus(404);
            }
        }
    )

    RED.httpNode.get('/_zap/trigger/:id', function (req, res) {
            let target_node = RED.nodes.getNode(req.params.id)
            if (target_node) {
                const now = new Date()
                let end_time = now
                end_time.setHours(end_time.getHours() + 1)
                const samples = [
                    {
                        // From event
                        "id": "11111111.aaaaaa",
                        // From node or event
                        "topic": "zapier_trigger",
                        // From upstream
                        "creation_time": now.toISOString(),
                        "last_modification": now.toISOString(),
                        "time_to_live": 60000,
                        "detection_id": "64ff364f2325eb0001513837",
                        "type": "nearvehicle",
                        "label": "person",
                        "country": "us",
                        "region": "texas",
                        "branch": "southwest",
                        "facility": "warehouse",
                        "site": "houston",
                        "zone": "teknoir",
                        "group": "demo",
                        "peripheral_type": "camera",
                        "peripheral_name": "warehouse_1",
                        "peripheral_id": "kaufbfu1",
                        "start_time": now.toISOString(),
                        "from_device": "device_id",
                        "severity": "msg.payload.severity",
                        "message": "msg.payload.severity" + ": " + "msg.payload.type" + " observed at SITE:" + "msg.payload.site" + ", ZONE:" + "msg.payload.zone" + " at " + "msg.payload.timestamp",
                        "proof": ["???"],
                        "annotations": ["???"],
                        "end_time": end_time.toISOString(),
                        "duration": end_time.getTime() - now.getTime(),
                        "count": 7,
                    }
                ]

                const msg_cache = target_node.context().get('cache')

                let response = msg_cache || samples
                target_node.context().set('cache', [])
                target_node.status({fill: "green", shape: "dot", text: `cache emptied`});
                res.send(response)
            } else {
                res.sendStatus(404);
            }
        }
    )
}
