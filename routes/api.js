var credentials = (require('fs').existsSync('credentials.js') ?
    require('../credentials')
  : (console.log ('No credentials.js file present, assuming using CONSUMERKEY & CONSUMERSECRET system variables.'), require('../credentials_'))) ;
var express = require('express');
var request = require('request');

var router = express.Router();

// Generate access token
// Your code here

router.post('/createchannel', function(req, res) {
	var data = '';
	req.on('data', function(d) {
		data+=d;
	});

	req.on('end', function() {
		console.log(data);
	var name = data.name;
	getToken(function(token) {
		request.post({
			url: 'http://notifications-stg.api.autodesk.com/notifications/v1/channel/',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({
				body: {
					"channelName" : name,
					"channelType" : 'broadcast'
				}
			}),
			headers: {
				"Access-Control-Allow-Origin": '*', Authorization: "Bearer "+token 
			}
		}, function(err, res, body) {
			console.log(err);
			console.log(res);
			console.log(body);
		});
	});
	});
});

var getToken = function(callback) {
	var text = "client_id="+credentials.credentials.client_id+"&client_secret="+credentials.credentials.client_secret+"&grant_type=client_credentials";
	console.log(text);
	request({
	    url: 'https://developer-stg.api.autodesk.com/authentication/v1/authenticate',
	    method: 'POST',
	    headers: { 'Content-Type': 'application/x-www-form-urlencoded'},
	    body: text
		}, 
		function(error, response, body) {
      callback(JSON.parse(body).access_token);
    });
}

router.get('/token', function(req, res) {
	var text = "client_id="+credentials.credentials.client_id+"&client_secret="+credentials.credentials.client_secret+"&grant_type=client_credentials";
	console.log(text);
	request({
	    url: 'https://developer-stg.api.autodesk.com/authentication/v1/authenticate',
	    method: 'POST',
	    headers: { 'Content-Type': 'application/x-www-form-urlencoded'},
	    body: text
		}, 
		function(error, response, body) {
      res.send(200, body);
    });
});



module.exports = router;
