var bodyParser = require('body-parser');

var validator = require("email-validator");
var express = require('express');
var basicAuth = require('express-basic-auth');
var session = require('express-session');

var jwt = require('jsonwebtoken');

var mysql = require('mysql');
var passwordHash = require('password-hash');
var nodemailer = require('nodemailer');
var path = require('path');
var formidable = require('formidable');
var util = require('util');


var app = express();
var PORT = process.env.PORT || 3000;
var verifyEmail = 'nfwf';
var fs = require('fs');

app.use(bodyParser.json());
app.use(express.static(__dirname));


var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root123",
    database: "Users"
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});

app.use(session({ secret: "users@Emilence", resave: true, saveUninitialized: true }));

app.get('/', function(req, res) {
    res.json('Users API Root');
});


function genrateToken(email) {
    var token = jwt.sign({
        data: email
    }, 'secret', { expiresIn: '1h' });
    return token;

}


app.post('/forgot', function(req, res) {
    var email = req.body.email;
    var token = genrateToken(email);

    var smtpTransport = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: "test.emilence@gmail.com",
            pass: "emilence"
        }
    });
    var url = `http://localhost:3000/reset/${token}/`;
    var mailOptions = {
        to: email,
        from: 'test.emilence@gmail.com',
        subject: 'reset password',
        text: 'click on the link to reset password \n' + url


    };


    smtpTransport.sendMail(mailOptions, function(err) {
        if (err) {
            return res.json({ success: 0, message: "error occured while sending mail", error: err });
        } else {
            res.json({ success: 1, message: "Feedback saved Successfully" });

        }
    });

    return res.status(200).send();

});


app.get('/reset/:token', function(req, res) {
    var token = req.params.token;
    try {
        var decoded = jwt.verify(token, 'secret');
        req.session.user_email = decoded.data;
        res.sendFile(path.join(__dirname + '/templates/resetpasswordFORM.html'));
    } catch (err) {
        res.sendFile(path.join(__dirname + '/templates/invalidtokenFORM.html'));
    }


});


app.post('/reset/:token', function(req, res) {
    var fields = [];
    var form = new formidable.IncomingForm();
    form.on('field', function(field, value) {
        fields[field] = value;
    });

    form.on('end', function() {
        if (fields.new_password !== fields.confirm_password || fields.new_password.trim().length === 0 || fields.confirm_password.trim().length === 0) {
             res.sendFile(path.join(__dirname + '/templates/passwordmissmatchFORM.html'));
        } else {
            var hashedPassword = passwordHash.generate(fields.confirm_password.trim());
            con.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, req.session.user_email], (err, resff) => {
                if (err) { throw (err) } else {
                     res.sendFile(path.join(__dirname + '/templates/passwordchangeFORM.html'));
                }
            });

        }

    });

    form.parse(req);

});

var server = app.listen(PORT, function() {
    console.log('Express listening on port ' + PORT + '!');
});