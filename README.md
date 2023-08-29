# node-red-contrib-zapier


Node-RED nodes to integrate with [Zapier](https://zapier.com)

There are 2 types of Node a Zapier Trigger which will allow the payload and topic of a message to me sent to Zapier as a Trigger to start a new zap. And a Zapier Action which will allow the output of a Zap to be sent to your node red flow as payload and topic. The naming is from the Zapier perspective so in Node-RED it is revered, an Action is the start of a flow (like an inject node) and the Trigger is the end of a flow (like a debug node)

Your Node-RED instance will need to be exposed for HTTP requests from Zapier, we use URLs on a hidden path of `/_zapier/` Ngrok is a good tool for exposing this on a private instance of Node-RED checkout my ngrok node for an easy way to use this with Node-RED
Zapier will authenticate itself to your Node-RED instance by using a token in the HTTP header, you can set this token to be any string you like or auto-generate a UUID within the config node.
It is reccomended to only use one token per Node-RED instance.

Currently the Zapier package is in invite only Beta so you will need to add it to your account using this [Invite Link](https://zapier.com/developer/public-invite/102945/352463f7043484371f61bd11f368a2a5)

No data flows through any services I control, the communication is direct between Zapier and your Node-RED instance.

Please raise any issues in the GitHub repo.

Checkout this [video](https://www.youtube.com/watch?v=jDu459yPrcg) for a demo of it in action 
