# QuackCon2016Server

## Routes
### /publish
Publish a message to all the subscribers of a topic
#### Query Parameters
* topic: The topic to publish the message to
#### Message Body
* message: The message to be published

### /register
Register a device with AWS SNS, return the endpointArn upon success
#### Query Parameters
* token: The device token identifying the device
* type: The type of the device, currenly either 'ios' or 'android'



