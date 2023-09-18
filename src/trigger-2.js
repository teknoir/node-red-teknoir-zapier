module.exports = function (RED) {
    function ZapierTriggerNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        // Initialize message cache
        let msgCache = [];
        node.context().set('cache', msgCache);

        // Handle incoming messages
        node.on('input', function (msg) {
            msgCache = node.context().get('cache') || [];
            if (msgCache.length >= 100) {
                msgCache.shift();
            }
            msgCache.push(msg);
            node.context().set('cache', msgCache);
            node.status({ fill: "green", shape: "dot", text: `Cached messages: ${msgCache.length}` });
        });

        // Expose HTTP endpoint for Zapier
        RED.httpNode.get('/zapier-trigger/:id', function (req, res) {
            if (req.params.id === node.id) {
                const cachedMessages = node.context().get('cache') || [];
                res.json(cachedMessages);
            } else {
                res.status(404).send("Not found");
            }
        });
    }

    RED.nodes.registerType("zapier-trigger", ZapierTriggerNode);
};