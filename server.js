var favicon = require('serve-favicon');
var api = require('./routes/api');
var express = require('express');
var cors = require('cors');
var passport = require('passport');
var app = express();
var session = require('express-session');
var cookieparser = require('cookie-parser');
function allowCrossDomain(req, res, next) {
   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
   res.setHeader('Access-Control-Allow-Origin', "*");
   res.setHeader('Access-Control-Allow-Credentials', true);
   res.setHeader('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept");

   //console.log("I am in OPTIONS");
   
   if (req.method === 'OPTIONS') {
       res.setHeader('Access-Control-Allow-Origin', "*");
       res.setHeader('Access-Control-Allow-Credentials', true);
       res.send(200);

   } else {
       next();
   }
}

app.use(session({secret: 'klasda', cookie: {maxAge: 60000}}));
app.use('/', express.static(__dirname + '/www'));
app.use(favicon(__dirname + '/www/images/favicon.ico'));
app.use(passport.initialize());
app.use('/api', api);
app.set('port', process.env.PORT || 80);

var server = app.listen(app.get('port'), function() {
    console.log('Server listening on port ' + server.address().port);
});
