var validator = require("email-validator");
var express = require('express');
var session = require('express-session');
var jwt = require('jsonwebtoken');
var mysql = require('mysql');
var passwordHash = require('password-hash');
var nodemailer = require('nodemailer');
var path = require('path');
var formidable = require('formidable');
var util = require('util');
var con = require('../config/connection')
var app = express();
var fs = require('fs');


app.use(express.static(__dirname + '/../public'));

function genrateToken(email) {
    var token = jwt.sign({
        data: email
    }, 'secret', { expiresIn: '1h' });
    return token;

}


app.get('/', function(req, res) {
    res.json('done');
})


app.post('/forgot', function(req, res) {
    var email = req.body.email;


    con.query('SELECT * FROM user WHERE user_email = ?', [email], (err, rows) => {
        if (err) { throw (err) }
        if (rows.length === 0) {
           return res.json('Email Don\'t exist');
        } else {


            var token = genrateToken(email);

            var url = `http://${req.headers.host}/sm/password/reset/${token}/`;

            var smtpTransport = nodemailer.createTransport({
                service: "Gmail",
                host: "smtp.gmail.com",
                auth: {
                    user: "test.emilence@gmail.com",
                    pass: "emilence"
                }
            });

            var url = `http://${req.headers.host}/sm/password/reset/${token}/`;
            var mailOptions = {
                to: email,
                from: 'test.emilence@gmail.com',
                subject: 'Reset Password',
                text: "Click on the link to reset password \n" + url


            };


            smtpTransport.sendMail(mailOptions, function(err) {
                if (err) {
                    console.log('ERROR: ' +err);
                    return res.json({ success: 0, message: "error occured while sending mail", error: err });
                } else {
                  return  res.json({ success: 1, message: "Feedback saved Successfully" });

                }
            });

        }


    });
});

app.get('/reset/:token', function(req, res) {
    var token = req.params.token;
    try {
        var decoded = jwt.verify(token, 'secret');
        req.session.user_email = decoded.data;
        res.sendFile(path.join(__dirname + '/../public/resetpasswordFORM.html'));
    } catch (err) {
        res.sendFile(path.join(__dirname, public, '/../public/invalidtokenFORM.html'));
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
            res.sendFile(path.join(__dirname + '/../public/passwordmissmatchFORM.html'));
        } else {
            var hashedPassword = passwordHash.generate(fields.confirm_password.trim());
            con.query('UPDATE user SET user_password = ? WHERE user_email = ?', [hashedPassword, req.session.user_email], (err, resff) => {
                if (err) { throw (err) } else {
                    res.sendFile(path.join(__dirname + '/../public/passwordchangedFORM.html'));
                }
            });

        }

    });

    form.parse(req);

});

module.exports = app;