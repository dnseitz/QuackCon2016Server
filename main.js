'use strict'

const Hapi = require('hapi');
const Joi = require('joi');
const AWS = require('aws-sdk');
const SNS = new AWS.SNS({region: 'us-west-2'});

AWS.config.loadFromPath('./config.json');

const iosAppArn = "arn:aws:sns:us-west-2:164008979560:app/APNS_SANDBOX/QuackCon2016"
const andrAppArn = ""
const errorStrings = {
	missingParam: 'MISSING_REQUIRED_PARAMETER',
	unknownTopic: 'UNKNOWN_TOPIC',
	unknownType: 'UNKNOWN_DEVICE_TYPE'
}

const server = new Hapi.Server();
server.connection({ port: 3000 });

var topics = {}

server.route({
	method: 'GET',
	path: '/',
	handler: function(request, reply) {
		reply('Hello, world\n');
	}
});

function publish(message, topicArn, cb) {
	let isObject = (typeof message !== null && typeof message === 'object')

	let wrapper;
	if (isObject) {
		let apns = { 'aps': {}};
		let shouldAlert = false;
		if (message['alert']) {
			apns.aps['alert'] = message['alert'];
			delete message['alert'];
			shouldAlert = true;
		}
		if (message['badge']) {
			apns.aps['badge'] = message['badge'];
			delete message['badge'];
			shouldAlert = true;
		}
		if (message['sound']) {
			apns.aps['sound'] = message['sound'];
			delete message['sound'];
			shouldAlert = true;
		}
		if (!shouldAlert) {
			apns.aps['content-available'] = 1;
		}
		apns.aps['data'] = message
		wrapper = {
			'default': 'default',
			'APNS': JSON.stringify(apns),
			'APNS_SANDBOX': JSON.stringify(apns)
		}
	}
	else {
		wrapper = {
			'default': message,
			'APNS': JSON.stringify({'aps': {'alert': message}}),
			'APNS_SANDBOX': JSON.stringify({'aps': {'alert': message}})
		}
	}
	const params = {
		Message: JSON.stringify(wrapper),
		MessageStructure: 'json',
		TopicArn: topicArn
	};
	
	console.log(params)
	SNS.publish(params, function(err, data) {
		if (err) {
			console.log(err, err.stack);
			if (cb) cb('Error publishing');
		}
		else {
			console.log(data);
			if (cb) cb('Message published');
		}
	});
}

server.route({
	method: 'POST',
	path: '/publish',
	handler: function(request, reply) {
		const query = request.query
		if (!query.topic) {
			var missing = [];
			if (!query.topic) missing.push('topic');

			const error = {
				error: errorStrings.missingParam,
				info: missing
			};
			console.log(error)
			reply(error);
			return;
		}
		if (!topics[query.topic]) {
			const error = {
				error: errorStrings.unknownTopic,
				info: [query.topic]
			}
			console.log(error)
			reply(error);
			return;
		}

		const message = request.payload.message;
		publish(message, topics[query.topic].topicArn, function(message) {
			reply(message);
		});
		
	}
});

server.route({
	method: 'GET',
	path: '/register',
	handler: function(request, reply) {
		const query = request.query;
		if (!query.token || !query.type) {
			var missing = [];
			if (!query.token) missing.push('token');
			if (!query.token) missing.push('type');

			const error = {
				error: errorStrings.missingParam,
				info: missing
			}
			reply(error);
			return;
		}

		let appArn;
		if (query.type === 'ios') {
			appArn = iosAppArn;
		}
		else if (query.type === 'android') {
			appArn = andrAppArn;
		}
		else {
			const error = {
				error: errorStrings.unknownType,
				info: [query.type]
			};
			reply(error);
			return;
		}

		const params = {
			PlatformApplicationArn: appArn,
			Token: query.token
		};
		SNS.createPlatformEndpoint(params, function(err, data) {
			if (err) {
				console.log(err, err.stack);
				reply('Error registering device\n');
			}
			else {
				console.log(data);
				const response = {
					endpointArn: data.EndpointArn
				};
				reply(response);
			}
		});
	}
});

server.route({
	method: 'POST',
	path: '/create',
	handler: function(request, reply) {
		const query = request.query;
		if (!query.name || !query.display_name) {
			var missing = [];
			if (!query.name) missing.push('name');
			if (!query.display_name) missing.push('display_name');
			const error = {
				error: errorStrings.missingParam,
				info: missing
			};
			reply(error);
			return;
		}
		const topicName = query.name;
		const displayName = query.display_name;
		const params = { Name: topicName }
		SNS.createTopic(params, function(err, data) {
			if (err) {
				console.log(err, err.stack);
				reply('Error creating topic');
			}
			else {
				console.log(data);
				console.log(data.TopicArn);
				topics[topicName] = { 
					topicArn: data.TopicArn,
					displayName: displayName
				}
				reply('Topic successfully created');
			}
		});
	}
});

server.route({
	method: 'DELETE',
	path: '/remove',
	handler: function(request, reply) {
		const query = request.query;
		if (!query.topic) {
			var missing = []
			if (!query.topic) missing.push('topic');
			
			const error = {
				error: errorStrings.missingParam,
				info: missing
			};
			reply(error);
			return;
		}
		if (!topics[query.topic]) {
			const error = {
				error: errorStrings.unknownTopic,
				info: [query.topic]
			}
			reply(error)
			return;
		}

		const params = { TopicArn: topics[query.topic].topicArn };
		SNS.deleteTopic(params, function(err, data) {
			if (err) {
				console.log(err, err.stack);
				reply('Error deleting topic');
			}
			else {
				console.log(data);
				delete topics[query.topic];
				reply('Topic successfully deleted');
			}
		});
	}
});

server.route({
	method: 'POST',
	path: '/subscribe',
	handler: function(request, reply) {
		const query = request.query;
		if (!query.topic || !query.protocol || !query.endpointArn) {
			var missing = [];
			if (!query.topic) missing.push('topic');
			if (!query.protocol) missing.push('protocol');
			if (!query.endpointArn) missing.push('endpointArn');
			const error = {
				error: errorStrings.missingParam,
				info: missing
			}
			reply(error);
			return;
		}
		if (!topics[query.topic]) {
			const error = {
				error: errorStrings.unknownTopic,
				info: [query.topic]
			}
			reply(error);
			return;
		}

		const params = {
			Protocol: query.protocol,
			TopicArn: topics[query.topic].topicArn,
			Endpoint: query.endpointArn
		}
		SNS.subscribe(params, function(err, data) {
			if (err) {
				console.log(err, err.stack);
				reply('Error subscribing to topic');
			}
			else {
				console.log(data);
				if (data.SubscriptionArn) {
					reply({ subscriptionArn: data.SubscriptionArn });
				}
				else {
					reply({});
				}
			}
		});
	}
});

server.route({
	method: 'GET',
	path: '/topics',
	handler: function(request, reply) {
		reply(topics);
	}
});

server.start((err) => {
	if (err) {
		console.log(err);
		throw err;
	}

	console.log(`Server running at: ${server.info.uri}`);

	let data = {
		someData: "SOME DATA",
		otherData: "Other"
	};
});
