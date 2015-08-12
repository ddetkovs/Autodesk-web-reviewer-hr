var credentials = (require('fs').existsSync('credentials.js') ?
    require('../credentials')
  : (console.log ('No credentials.js file present, assuming using CONSUMERKEY & CONSUMERSECRET system variables.'), require('../credentials_'))) ;
var express = require('express');
var request = require('request');
var router = express.Router();
// Generate access token
// Your code here

var loginStorage = {};



module.exports = router;
