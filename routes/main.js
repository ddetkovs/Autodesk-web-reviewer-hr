var credentials = (require('fs').existsSync('credentials.js') ?
    require('../credentials')
  : (console.log ('No credentials.js file present, assuming using CONSUMERKEY & CONSUMERSECRET system variables.'), require('../credentials_'))) ;
var express = require('express');
var request = require('request');
var router = express.Router();
var OAuth = require('node-oauth');
OAuth = OAuth('./oauth-settings.js')
// Generate access token
// Your code here

var loginStorage = {};



module.exports = router;
