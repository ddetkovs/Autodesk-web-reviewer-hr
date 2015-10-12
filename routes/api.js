var credentials = (require('fs').existsSync('credentials.js') ?
    require('../credentials')
    : (console.log('No credentials.js file present, assuming using CONSUMERKEY & CONSUMERSECRET system variables.'), require('../credentials_')));
var express = require('express');
var request = require('request');
var router = express.Router();
var crypto = require('crypto');
var buffer = require('buffer');
var algorithm = 'aes-256-ctr';
var password = credentials.password;
var loginStorage = {};
var urnStorage = {};
var pendingUrns = 0;
var PUBNUB = require('pubnub');
var pubnub = PUBNUB({
    subscribe_key: credentials.pubnub.subscribe_key, // always required
    publish_key: credentials.pubnub.publish_key // only required if publishing
});
var servicetoken;
var settings = {
    autodesk: {
        'version': '1.0',
        'consumer_key': credentials.credentials.oauth_id,
        'consumer_secret': credentials.credentials.oauth_secret,
        'arg_prefix': 'oauth_',
        // authentication
        'requestToken': {
            'url': 'https://accounts-staging.autodesk.com/OAuth/RequestToken',
            'arg': ['consumer_key']
        },
        'authorize': {
            'url': 'https://accounts-staging.autodesk.com/oauth/authorize'
        },
        'accessToken': {
            'key': 'request_token_secret',
            'url': 'https://accounts-staging.autodesk.com/OAuth/AccessToken',
            'arg': ['consumer_key', {
                'request_token': 'oauth_token'
            }, 'oauth_verifier']
        }
    }
};

function encrypt(text) {
    var cipher = crypto.createCipher(algorithm, password)
    var crypted = cipher.update(text, 'utf8', 'hex')
    crypted += cipher.final('hex');
    return crypted;
}

function decrypt(text) {
    var decipher = crypto.createDecipher(algorithm, password)
    var dec = decipher.update(text, 'hex', 'utf8')
    dec += decipher.final('utf8');
    return dec;
}


/*
var oauth = new OAuth.OAuth(
  'https://accounts-staging.autodesk.com/OAuth/RequestToken',
  'https://accounts-staging.autodesk.com/OAuth/AccessToken',
  credentials.credentials.oauth_id,
  credentials.credentials.oauth_secret,
  '1.0',
  function(e) { console.log('AAAA', e);} ,
  'HMAC-SHA1'
);
*/

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

var getTwoLegToken = function (callback) {
    if (servicetoken) {
        callback(servicetoken);
        return servicetoken;
    }
    var text = 'client_id=' + credentials.credentials.client_id + '&client_secret=' + credentials.credentials.client_secret + '&grant_type=client_credentials';
    request({
        url: 'https://developer-stg.api.autodesk.com/authentication/v1/authenticate',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: text
    },
        function (error, response, body) {
            console.log(JSON.parse(body).access_token);
            callback(JSON.parse(body).access_token);
        });
}

var refreshServiceToken = function () {
    servicetoken = undefined;
    getTwoLegToken(function (token) {
        servicetoken = token;
        if (!servicetoken)
            refreshServiceToken();
    });
}

var getToken = function (token, secret, callback) {
    var text = 'client_id=' + credentials.credentials.client_id +
        '&client_secret=' + credentials.credentials.client_secret +
        '&oauth1_token=' + token +
        '&oauth1_secret=' + secret;
    request({
        url: 'https://developer-stg.api.autodesk.com/authentication/v1/exchange',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: text
    },
        function (error, response, body) {
            callback(JSON.parse(body));
        });
}

var checkToken = function (req, callback, failure) {
    var userCode = 'common';
    console.log(loginStorage);
    if (loginStorage[userCode]) {
        callback(userCode);
    } else {
        failure();
    }
}

var checkUrnStatus = function () {
    getTwoLegToken(function (token) {
        for (username in urnStorage) {
            for (urn in urnStorage[username]) {
                if (urnStorage[username][urn] === 'pending') {
                    request({
                        url: 'https://developer-stg.api.autodesk.com/derivativeservice/v2/manifest/' + urn,
                        method: 'GET',
                        headers: {
                            'Authorization': 'Bearer ' + token
                        }
                    },
                        function (error, response, body) {
                            console.log(body);
                            if (!error) {
                                console.log('success!!');
                                var data = JSON.parse(body);
                                console.log(data.status);
                                urnStorage[username][urn] = data.status;
                            }
                        });
                }
            }
        }
    });
}

var objectKey = 0;

router.post('/uploadfile', function (req, res) {
    var file = '';
    req.on('data', function (d) {
        file += d;
    });
    objectKey++;
    req.on('end', function () {
        getTwoLegToken(function (token) {
            request({
                url: 'https://developer-stg.api.autodesk.com/oss/v2/buckets/bootcamp1team1/objects/' + 'ddfa' + objectKey + '.f3d',
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/octet-stream'
                },
                body: file,
            },
                function (error, response, body) {
                    console.log(body);
                    console.log(response.statusCode);
                    if (error) {
                        res.send(404, null);
                    } else {
                        res.send(200);
                    }
                });
        });
    });
});

router.post('/comment', function (req, res) {
    var data = '';
    req.on('data', function (d) {
        data += d;
    });

    req.on('end', function () {
        var body = JSON.parse(data);
        var urn = body.urn;
        var text = body.text;
        var token = body.token;
        var name = 'anonymous';
        var userCode = 'common';
        if (loginStorage[userCode]) {
            name = loginStorage[userCode].username;
        }
        text = name + ': ' + text;

        console.log(text);
        request({
            url: 'https://developer-stg.api.autodesk.com/comments/v2/resources/' + urn,
            method: 'POST',
            headers: {
                'Content-Type': 'plain/text',
                Authorization: 'Bearer ' + token
            },
            body: JSON.stringify({
                body: text
            })
        },
            function (error, response, body) {
                if (!error) {
                    console.log('COMMENTED', body);
                    pubnub.publish({
                        channel: urn,
                        message: 'Comment added',
                        callback: function (m) {
                            res.send(200)
                        }
                    });
                } else {
                    res.send(404);
                }
            });
    })
});

router.post('/addurn', function (req, res) {
    var data = '';
    req.on('data', function (d) {
        data += d;
    });
    req.on('end', function () {
      console.log('data', data);
        data = JSON.parse(data);
        checkToken(req, function (userCode) {
            var username = loginStorage[userCode].username;
            var urn = data.urn;
            if (!urnStorage[username])
                urnStorage[username] = {};
            urnStorage[username][urn] = 'pending';
            console.log(urnStorage);
        }, function () {
            res.send(401, null);
        });
    });
});

router.get('/geturns', function (req, res) {
    checkToken(req, function (userCode) {
        var urnArr = [];
        var username = loginStorage[userCode].username;
        for (key in urnStorage[username]) {
            console.log('status', urnStorage[username][key]);
            if (urnStorage[username][key] !== 'pending' || urnStorage[username][key] !== 'inprogress' ) {
                urnArr.push(key);
            }
        }
        res.send(200, JSON.stringify(urnArr));
    }, function () {
        res.send(401);
    });
});

router.get('/token', function (req, res) {
    res.redirect('/');
});

router.get('/readtoken', function (req, res) {
    //use service level tokens
    getTwoLegToken(function (token) {
        var body = {
            access_token: token
        }
        console.log('token ', token);
        loginStorage['common'] = {
            access_token: token,
            username: 'common'
        };
        return res.send(200, body);
    });
    return;
});


/*function(req, res) {
passport.authenticate('oauth');
return;
console.log('222');
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
});*/

setInterval(checkUrnStatus, 1000);
refreshServiceToken();
setInterval(refreshServiceToken, 120000);
module.exports = router;
