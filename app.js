var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var passwordHash = require('password-hash');
var mysql = require('mysql');
var validator = require("email-validator");
var cryptojs = require('crypto-js');
var jwt = require('jsonwebtoken');

var users = [];
var app = express();
var PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.get('/', function(req, res) {
    res.send('Users API Root');
});


/************************************************************************************************************************************
 *																																	*
 *													My sql Connection																*
 *																																	*
 ************************************************************************************************************************************/

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

/************************************************************************************************************************************
 *																																	*
 *													GET All Users																	*
 *																																	*
 ************************************************************************************************************************************/

app.get('/users', function(req, res) {

    var usersEmail = [];

    con.query('SELECT email,name FROM users', (err, rows) => {
        if (err) throw err;

        usersEmail = (rows);

        res.json(usersEmail);
    });

});




/************************************************************************************************************************************
 *																																	*
 *													POST user login																	*
 *																																	*
 ************************************************************************************************************************************/

app.post('/login', function(req, res) {

    var body = _.pick(req.body, 'email', 'password');
    _.defaults(body, {
        email: ' ',
        password: ' '
    });

    var email;
    var token = undefined;

    return new Promise(function(resolve, rej) {

        if (body.email.trim().length === 0 || body.password.trim().length === 0 || !validator.validate(body.email.trim())) {
            return res.status(400).send();
        } else {



            con.query('SELECT * FROM users WHERE email = ?', [body.email.trim()], (err, rows) => {
                if (err) {
                    rej(400);
                } //throw err;

                if (rows.length === 0) {
                    rej(400);
                } else {
                    if (passwordHash.verify(body.password.trim(), rows[0].password)) {
                        token = genrateToken('authentication', rows[0].email)
                        if (!token) {
                            rej(401);
                        }
                        resolve((rows));
                    } else if (!passwordHash.verify(body.password.trim(), rows[0].password)) {
                        rej(401);
                    } else {
                        rej(404);
                    }
                }

            });

        }

    }).then(function(data) {

        return res.header('Auth', token).json((data));
    }, function(error) {

        return res.status(error).send();
    });

});


/************************************************************************************************************************************
 *																																	*
 *													POST SignUp Users																*
 *																																	*
 ************************************************************************************************************************************/

app.post('/register', function(req, res) {
    var body = _.pick(req.body, 'email', 'password', 'name', 'city', 'country', 'lon', 'lat');
    //	var matchedEmail;


    _.defaults(body, {
        email: ' ',
        password: ' ',
        name: ' ',
        city: 'NA',
        country: 'NA',
        lon: 'NA',
        lat: 'NA'
    });

    if (body.email.trim().length === 0 || body.password.trim().length === 0 || body.name.trim().length === 0 || !validator.validate(body.email.trim())) {
        return res.status(400).send();
    }
    var hashedPassword = passwordHash.generate(body.password.trim());

    body.email = body.email.trim();
    body.password = hashedPassword;
    body.name = body.name.trim();

    var findEmail = body.email.trim();


    return new Promise(function(resolve, rej) {

        con.query('SELECT email FROM users WHERE email = ?', [findEmail], (err, rows) => {
            if (err) throw err;
            if (rows.length > 0) {
                return res.status(406).json('Email already exist');
            } else {


                con.query('INSERT INTO users SET ?', body, (err, res) => {
                    if (err) { throw (err) } else {
                        resolve();
                    }
                });
            }

        });
    }).then(function(data) {


        return res.json(body);
    }, function(error) {
        console.log('Reject: ' + error);
    }).catch(function(errot) {
        console.log(error);
    });


});

/************************************************************************************************************************************
 *																																	*
 *													Starting server																	*
 *																																	*
 ************************************************************************************************************************************/
var server = app.listen(PORT, function() {
    console.log('Express listening on port ' + PORT + '!');
});
server.timeout = 2500;

/************************************************************************************************************************************
 *																																	*
 *													Genrate Token Function															*
 *																																	*
 ************************************************************************************************************************************/

function genrateToken(type, id) {
    if (!_.isString(type)) {
        return undefined;
    }

    try {
        var stringData = JSON.stringify({ id: id, type: type });
        var encryptedData = cryptojs.AES.encrypt(stringData, 'abc123@1223').toString();
        var token = jwt.sign({
            token: encryptedData
        }, 'qwerty12345');
        return token;
    } catch (e) {
        console.log(e);
        return undefined;
    }
}

/************************************************************************************************************************************
 *																																	*
 *														End Of file																	*
 *																																	*
 ************************************************************************************************************************************/