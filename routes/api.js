var credentials = (require('fs').existsSync('credentials.js') ?
    require('../credentials')
  : (console.log ('No credentials.js file present, assuming using CONSUMERKEY & CONSUMERSECRET system variables.'), require('../credentials_'))) ;
var express = require('express');
var request = require('request');
var router = express.Router();
// Generate access token
// Your code here



/*
router.post('/getchannel', function(req, res) {
	var data = '';
	req.on('data', function(d) {
		data+=d;
	});

	req.on('end', function() {
		var name = data;
		getToken(function(token) {
			request({
				url: 'https://developer-stg.api.autodesk.com/notifications/v1/channel/'+name,
				method: 'GET',
				headers: {
					"Access-Control-Allow-Origin": '*', Authorization: "Bearer "+token
				}
				}, function(err, response, body) {
					if(response.statusCode === 200) {
						console.log('getsucc:',response);
						res.send(200, JSON.parse(response.body).Channel);
					} else {
						console.log('getdata:',JSON.parse(response.body).Channel);
						request.post({
							url: 'https://developer-stg.api.autodesk.com/notifications/v1/channel',
							type: 'POST',
							body: JSON.stringify({
									"channelName" : name,
									"channelType" : 'BROADCAST'
								}),
							headers: {
								'Content-Type': 'text/json',
								"Access-Control-Allow-Origin": '*', 
								Authorization: "Bearer "+token 
							}
						}, function(err, resp, b) {
							console.log(resp.statusCode);
							res.send(resp.statusCode, JSON.parse(resp.body).channelId);
						});
					}
			});
		});
	});
});
*/
var getToken = function(callback) {
	var text = "client_id="+credentials.credentials.client_id+"&client_secret="+credentials.credentials.client_secret+"&grant_type=client_credentials";
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
