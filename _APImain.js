'use strict'

const Hapi = require('hapi');

const server = new Hapi.Server();
server.connection({ port: 3000 });

server.route({
	method: 'GET',
	path: '/',
	handler: function(request, reply) {
		reply('Hello, world\n');
	}
});

server.start((err) => {
	if (err) {
		console.log(err);
		throw err;
	}

	console.log(`Server running at: ${server.info.uri}`);
});

var http = require("http");
    url = "http://api.sportradar.us/nfl-ot1/games/c8dc876a-099e-4e95-93dc-0eb143c6954f/boxscore.json?api_key=6vgqj9xr6fqj2es2umvwcc35";

// get is a simple wrapper for request()
// which sets the http method to GET
var request = http.get(url, function (response) {
    // data is streamed in chunks from the server
    // so we have to handle the "data" event    
    var buffer = "", 
        data,
        route;

    response.on("data", function (chunk) {
        buffer += chunk;
    }); 

    response.on("end", function (err) {
        // finished transferring data
        // dump the raw data
        console.log(buffer);
        console.log("\n");
        data = JSON.parse(buffer);
        summary = data.summary[0];

        // extract the distance and time
        console.log("Year: " + route.season[0].distance.text);
        console.log("Time: " + route.legs[0].duration.text);
    }); 
}); 
