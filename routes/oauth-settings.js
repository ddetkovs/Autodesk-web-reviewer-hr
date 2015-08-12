var credentials = (require('fs').existsSync('credentials.js') ?
    require('../credentials')
  : (console.log ('No credentials.js file present, assuming using CONSUMERKEY & CONSUMERSECRET system variables.'), require('../credentials_'))) ;

var exports = {
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
        "url": "https://api.twitter.com/oauth/authorize",
        "arg": [{
          "request_token": "oauth_token"
        }]
      },
      "accessToken": {
        "key": "request_token_secret",
        "url": "https://accounts-staging.autodesk.com/OAuth/AccessToken",
        "arg": ["consumer_key", {"request_token":"oauth_token"}, "oauth_verifier"]
      },
      // api
      "credentials": {
        "key": "access_token_secret",
        "url": "http://api.twitter.com/1/account/verify_credentials.json",
        "arg": ["consumer_key", {
          "access_token": "oauth_token"
        }],
        "account_name": "screen_name"
      }
    }
  };
module.exports = exports;
