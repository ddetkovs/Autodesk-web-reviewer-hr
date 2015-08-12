var credentials = (require('fs').existsSync('credentials.js') ?
    require('../credentials')
  : (console.log ('No credentials.js file present, assuming using CONSUMERKEY & CONSUMERSECRET system variables.'), require('../credentials_'))) ;
var express = require('express');
var request = require('request');
var router = express.Router();
var crypto = require('crypto');
var algorithm = 'aes-256-ctr';
var password = credentials.password;
var loginStorage = {};

var settings = {
    autodesk: {
      "version": "1.0",
      "consumer_key": credentials.credentials.oauth_id,
      "consumer_secret": credentials.credentials.oauth_secret,
      "arg_prefix": "oauth_",
      // authentication
      "requestToken": {
        "url": "https://accounts-staging.autodesk.com/OAuth/RequestToken",
        "arg": ["consumer_key"]
      },
      "authorize": {
        "url": "https://accounts-staging.autodesk.com/oauth/authorize"
      },
      "accessToken": {
        "key": "request_token_secret",
        "url": "https://accounts-staging.autodesk.com/OAuth/AccessToken",
        "arg": ["consumer_key", {"request_token":"oauth_token"}, "oauth_verifier"]
      }
    }
  };

var passport = require('passport');
var OAuth1Strategy = require('passport-oauth').OAuthStrategy;

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use('oauth', new OAuth1Strategy({
    requestTokenURL: 'https://accounts-staging.autodesk.com/OAuth/RequestToken',
    accessTokenURL: 'https://accounts-staging.autodesk.com/OAuth/AccessToken',
    userAuthorizationURL: 'https://accounts-staging.autodesk.com/oauth/authorize',
    consumerKey: credentials.credentials.oauth_id,
    consumerSecret: credentials.credentials.oauth_secret,
    callbackURL: "http://bootcamp1.autodesk.com/api/verify"
  },
  function(token, tokenSecret, profile, done) {
  	setTimeout(function() {
  	console.log('TOKEN: ',token);
  	console.log("TOKENSECRET", tokenSecret);
  	getToken(token, tokenSecret, function(data) {
  		console.log("DATARECEIVED: ",data);
  		if(data.access_token && data.refresh_token ) {
		    loginStorage[data.access_token] = data.refresh_token;
		    return done(null, encrypt(data.access_token));
	  	} else return done(null, 'temp');
  	});
  	}, 0)
  }
));

function encrypt(text){
  var cipher = crypto.createCipher(algorithm,password)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}
 
function decrypt(text){
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'hex','utf8')
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
var getToken = function(token, secret, callback) {
	var text = "client_id="+credentials.credentials.client_id+
						 "&client_secret="+credentials.credentials.client_secret+
						 "&oauth1_token="+token+
						 "&oauth1_secret="+secret	;
	request({
	    url: 'https://developer-stg.api.autodesk.com/authentication/v1/exchange',
	    method: 'POST',
	    headers: { 'Content-Type': 'application/x-www-form-urlencoded'},
	    body: text
		}, 
		function(error, response, body) {
      callback(JSON.parse(body));
    });
}

router.get('/verify', passport.authenticate('oauth'),
  function(req, res) {
	console.log('SESSTION2: ', req.session);
    // Successful authentication, redirect home.
    res.redirect('/api/token');
  });

router.get('/oauth', passport.authenticate('oauth'));

router.get('/token', function(req, res) {
	userCode = 'invalid';
	if(req.session.passport.user) {
		userCode = decrypt(req.session.passport.user);
	}
	if(loginStorage[userCode]) {
		res.redirect('/');
	} else {
		res.redirect('/api/oauth');
	}
});

router.get('/readtoken', function(req, res) {
	userCode = 'invalid';
	if(req.session.passport.user) {
		userCode = decrypt(req.session.passport.user);
		if(loginStorage[userCode]) {

			var body = { 
				access_token: userCode
			}
			return res.send(200, body);
		}
	} else {
		console.log('not found token', 404);
		res.send(404, null);
	}
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



module.exports = router;
