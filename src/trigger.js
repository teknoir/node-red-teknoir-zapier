const axios = require('axios');
var bodyParser = require('body-parser')

module.exports = function (RED) {
    function trigger(n) {
        RED.nodes.createNode(this, n);
        let node = this;
        node.name = n.name;
        node.cache = n.cache || 10;

        node.on('input', function (msg) {
            const subscribed = node.context().get('subscribed');
            let hookUrl = node.context().get('hookUrl'); // Get the stored hook URL


            if (!subscribed) {
                node.status({ fill: "red", shape: "dot", text: "Unsubscribed" });
                return;
            }

            let msg_cache = node.context().get('cache')
            if (!msg_cache) {
                msg_cache = []
                node.context().set('cache', msg_cache)
            }

            // Check if msg.payload is an array

            if (Array.isArray(msg.payload)) {
                msg.payload.forEach((singleMsg) => {
                    if (msg_cache.length >= node.cache) {
                        node.status({ fill: "orange", shape: "dot", text: "cache full: oldest message removed" });
                        msg_cache.shift();
                    }
                    msg_cache.push(singleMsg);
                });
            } else {
                if (msg_cache.length >= node.cache) {
                    node.status({ fill: "orange", shape: "dot", text: "cache full: oldest message removed" });
                    msg_cache.shift();
                }
                msg_cache.push(msg.payload);
            }

            node.context().set('cache', msg_cache);

            if (subscribed && hookUrl && msg_cache.length > 0) {
                
                hookUrl = hookUrl.replace(/['"]+/g, '')
                
                // Debugging
                // console.log('Sending to:', hookUrl);
                // console.log('Sending data:', msg_cache);
                // axios.interceptors.request.use(request => {
                //         console.log('Starting Request', request)
                //         return request
                // })

                msg_cache.forEach(singleMsg => {
                    axios.post(hookUrl, JSON.stringify(singleMsg), {
                            headers: {
                                    'Content-Type': 'application/json'
                            }
                    })
                        .then(response => {
                            console.log('Successfully sent data to Zapier:', response.data);
                            
                        })
                        .catch(error => {
                            console.error('Error sending data to Zapier:', error);
                        });
                    });
                msg_cache.length = 0;
            } else {
                node.status({ fill: "red", shape: "dot", text: "unsubscribed or no hook URL" });
            }

            node.status({ fill: "green", shape: "dot", text: "cache size: " +msg_cache.length });

        });
    }

    RED.nodes.registerType("zap_trigger", trigger);

    function handleSubscription(req, res, isSubscribe) {

        let target_node = RED.nodes.getNode(req.params.id);
        if (target_node) {
            target_node.context().set('subscribed', isSubscribe);

            if (isSubscribe) {
                // Handle subscription
                target_node.context().set('hookUrl', req.body['hookUrl']); // Store the hook URL
            } else {
                // Handle unsubscription
                target_node.context().set('hookUrl', null); // Remove the hook URL
                target_node.context().set('cache', []); // Empty the cache
            }

            const statusText = isSubscribe ? "Subscribed" : "Unsubscribed";

            target_node.status({fill: isSubscribe ? "green" : "red", shape: "dot", text: statusText});

            const msg = {
                "message": statusText,
            }
            res.send(msg);
        } else {
            res.sendStatus(404);
        }
    }

    RED.httpNode.use('/_zap/trigger/*', bodyParser.json());
    RED.httpNode.post('/_zap/trigger/:id', (req, res) => handleSubscription(req, res, true));
    RED.httpNode.delete('/_zap/trigger/:id', (req, res) => handleSubscription(req, res, false));

    RED.httpNode.get('/_zap/trigger/:id', function (req, res) {
        let target_node = RED.nodes.getNode(req.params.id);
        if (target_node) {
            const now = new Date()
            let end_time = now
            end_time.setHours(end_time.getHours() + 1)
            const samples = [
                {
                    // From event
                    "id": RED.util.generateId(),
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
                    "severity": "TestSeverity",
                    "message": "This is a Sample as no message has been received by the node yet",
                    "proof": ["???"],
                    "annotations": ["???"],
                    "end_time": end_time.toISOString(),
                    "duration": end_time.getTime() - now.getTime(),
                    "count": 1,
                }
            ]
            const msg_cache = target_node.context().get('cache') || samples;
            res.send(msg_cache);
            target_node.context().set('cache', [])
            target_node.status({fill: "green", shape: "dot", text: "Message cache emptied"});
        } else {
            res.sendStatus(404);
        }
    });
}