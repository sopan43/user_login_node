/************************************************************************************************************************************
 *                                                                                                                                  *
 *                                                       NPM Library                                                                *
 *                                                                                                                                  *
 ************************************************************************************************************************************/
var bodyParser = require('body-parser');
var express = require('express');
var basicAuth = require('express-basic-auth');
var session = require('express-session');
var geolib = require('geolib');
var jwt = require('jsonwebtoken');
var _ = require('underscore');
var mysql = require('mysql');
var passwordHash = require('password-hash');
var path = require('path');

var con = require('./connection.js')
var user  = require('../route/users.js');
var forgotpassword  = require('../route/forgotpassword.js');


/************************************************************************************************************************************
 *                                                                                                                                  *
 *                                                       Miscellaneous                                                              *
 *                                                                                                                                  *
 ************************************************************************************************************************************/


var app = express();
var PORT = process.env.PORT || 8101;

app.use(bodyParser.json());
app.use(express.static(__dirname + '/../') );

app.use(session({ secret: "users@Emilence", resave: true, saveUninitialized: true }));

app.use('/user',user);
app.use('/password',forgotpassword);

app.get('/', function(req, res) {
    res.json('Users API Root');
});

/************************************************************************************************************************************
 *                                                                                                                                  *
 *                                                  Starting server                                                                 *
 *                                                                                                                                  *
 ************************************************************************************************************************************/
var server = app.listen(PORT, function() {
    console.log('Express listening on port ' + PORT + '!');
});


/************************************************************************************************************************************
 *                                                                                                                                  *
 *                                                      End Of file                                                                 *
 *                                                                                                                                  *
 ************************************************************************************************************************************/
