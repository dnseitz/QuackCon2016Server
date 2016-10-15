# QuackCon2016Server

## Routes
### /publish (POST)
Publish a message to all the subscribers of a topic
#### Query Parameters
* topic: The topic to publish the message to

#### Message Body
* message: The message to be published

### /register (GET)
Register a device with AWS SNS, return the endpointArn upon success

#### Query Parameters
* token: The device token identifying the device
* type: The type of the device, currenly either 'ios' or 'android'

### /create (POST)
Create a new topic for endpoints to subscribe to

#### Query Parameters
* name: The internal name of the topic, no spaces allowed
* display_name: The human readable name

### /remove (DELETE)
Remove a topic and all its subscriptions

#### Query Parameters
* topic: The internal name of the topic to remove

### /subscribe (POST)
Subscribe an endpoint to a topic

#### Query Parameters
* topic: The internal topic name
* protocol: The protocol to use, should just be 'application' for now
* endpointArn: The endpoint that should be subscribed to the topic

### /topics (GET)
Get a json object of all the topics currently registered on the server

