/************************************************************************************************************************************
 *                                                                                                                                  *
 *                                                       NPM Library                                                                *
 *                                                                                                                                  *
 ************************************************************************************************************************************/
var bodyParser = require('body-parser');
var cryptojs = require('crypto-js');
var validator = require("email-validator");
var express = require('express');
var basicAuth = require('express-basic-auth');
var session = require('express-session');
var geolib = require('geolib');
var jwt = require('jsonwebtoken');
var _ = require('underscore');
var mysql = require('mysql');
var passwordHash = require('password-hash');

/************************************************************************************************************************************
 *                                                                                                                                  *
 *                                                       Miscellaneous                                                              *
 *                                                                                                                                  *
 ************************************************************************************************************************************/


var app = express();
var PORT = process.env.PORT || 3000;
var verifyEmail = 'nfwf';
app.use(bodyParser.json());

app.use(basicAuth({
    users: { 'admin': 'supersecret' }
}));

app.use(session({ secret: "users@Emilence", resave: true, saveUninitialized: true }));




app.get('/', function(req, res) {
    res.json('Users API Root');
});


/************************************************************************************************************************************
 *                                                                                                                                  *
 *                                                  My sql Connection                                                               *
 *                                                                                                                                  *
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
 *                                                                                                                                  *
 *                                                  GET All Users                                                                   *
 *                                                                                                                                  *
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
 *                                                                                                                                  *
 *                                                  POST user login                                                                 *
 *                                                                                                                                  *
 ************************************************************************************************************************************/

app.post('/login', function(req, res) {

    var body = _.pick(req.body, 'email', 'password');
    _.defaults(body, {
        email: ' ',
        password: ' '
    });
    if (req.session.user_login === undefined) {


        return new Promise(function(resolve, rej) {

            if (body.email.trim().length === 0 || body.password.trim().length === 0 || !validator.validate(body.email.trim())) {
                return res.status(400).send();
            } else {

                con.query('SELECT * FROM users WHERE email = ?', [body.email.trim()], (err, rows) => {
                    if (err) {
                        rej(400);
                    }
                    if (rows.length === 0) {
                        rej(400);
                    } else {
                        if (passwordHash.verify(body.password.trim(), rows[0].password)) {
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
            req.session.user_login = true;
            req.session.user_email = data[0].email;
            req.session.user_name = data[0].name;
            req.session.user_password = data[0].password;
            req.session.user_city = data[0].city;
            req.session.user_country = data[0].country;
            req.session.user_lon = data[0].lon;
            req.session.user_lat = data[0].lat;
            return res.status(200).json((data));

        }, function(error) {

            return res.status(error).send();
        });
    } else {
        req.session.destroy();
        return res.json('Previos user logout need to login again');
    }
});


/************************************************************************************************************************************
 *                                                                                                                                  *
 *                                                  POST SignUp Users                                                               *
 *                                                                                                                                  *
 ************************************************************************************************************************************/

app.post('/register', function(req, res) {
    var body = _.pick(req.body, 'email', 'password', 'name', 'city', 'country', 'lon', 'lat');

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
 *                                                                                                                                  *
 *                                                  PUT update user profile                                                         *
 *                                                                                                                                  *
 ************************************************************************************************************************************/

app.put('/update_user_profile', function(req, res) {
    return new Promise(function(resolve, rej) {
        if (!req.session.user_login) {
            return rej(401);
        }

        var body = _.pick(req.body, 'name', 'city', 'country', 'lon', 'lat');


        body.email = req.session.user_email;
        var city, country, longitude, lat;



        con.query('SELECT * FROM users WHERE email = ?', [body.email], (err, rows) => {
            if (err) throw err;
            if (rows.length === 0) {
                rej(404);
            } else {

                _.defaults(body, {
                    name: rows[0].name,
                    city: rows[0].city,
                    country: rows[0].country,
                    lon: rows[0].lon,
                    lat: rows[0].lat
                });
                if (body.name.trim().length === 0 || body.city.trim().length === 0 || body.country.trim().length === 0 || body.lon.trim().length === 0 || body.lat.trim().length === 0) {
                    rej(400);
                   
                }

                con.query('UPDATE users SET name = ?, city = ?, country = ?, lon =?, lat = ? WHERE email = ?', [body.name, body.city, body.country, body.lon, body.lat, body.email], (err, res) => {
                    if (err) { throw (err) } else {
                        req.session.user_name = body.name;
                        req.session.user_city = body.city;
                        req.session.user_country = body.country;
                        req.session.user_lon = body.lon;
                        req.session.user_lat = body.lat;
                        resolve(body);
                    }
                });
            }
        });
    }).then(function(data) {
        return res.json(data);
    }, function(error) {
        return res.status((error)).send();
    }).catch(function(error) {
        console.log(error);
    });
});

/************************************************************************************************************************************
 *                                                                                                                                  *
 *                                                  Users near by me under x miles                                                  *
 *                                                                                                                                  *
 ************************************************************************************************************************************/

app.get('/users_near_by_me', function(req, res) {
    var queryParams = req.query;
    var usersEmail = [];
    var lon, lat;
    return new Promise(function(resolve, rej) {
        if (queryParams.hasOwnProperty('email') && queryParams.hasOwnProperty('miles')) {
            con.query('SELECT lon,lat FROM users WHERE email = ?', [queryParams.email], (err, row) => {

                if (err) {
                    console.log(err);
                    //   throw err;
                    rej(err);
                } else {
                    lon = row[0].lon;
                    lat = row[0].lat;
                    con.query('SELECT email,name,city,country,lon,lat FROM users WHERE email != ?', [queryParams.email], (err, rows) => {
                        if (err) {
                            console.log(err);
                            throw err;
                        } else {

                            for (var i = 0; i < rows.length; i++) {
                                if (geolib.isPointInCircle({ latitude: rows[i].lat, longitude: rows[i].lon }, { latitude: lat, longitude: lon },
                                        5000
                                    )) {
                                    usersEmail.push((rows[i]));
                                }
                            }
                            resolve(usersEmail.length);
                        }
                    });

                }
            });
        } else {
            rej("Wrong Params");

        }
    }).then(function(data) {

        if (data === 0) {
            return res.status(404).json("No users Found");
        } else {
            return res.json(usersEmail);
        }

    }, function(error) {
        console.log(error);
        res.status(400).json(error);
    });

});

/************************************************************************************************************************************
 *                                                                                                                                  *
 *                                                  GET Users by City                                                                 *
 *                                                                                                                                  *
 ************************************************************************************************************************************/

app.get('/users_city', function(req, res) {
    var queryParams = req.query;
    var usersEmail = [];

    return new Promise(function(resolve, rej) {
        if (queryParams.hasOwnProperty('city')) {
            con.query('SELECT email,name FROM users WHERE city = ?', [queryParams.city], (err, rows) => {
                if (err) { throw err }
                for (var i = 0; i < rows.length; i++) {

                    usersEmail.push((rows[i]));

                }
                resolve(usersEmail.length);
            });
        } else {

            rej("city not given");
        }
    }).then(function(data) {
            if (data === 0) {
                res.status(404).json("No users Found");
            } else {
                res.json(usersEmail);
            }

        },
        function(error) {

            console.log(error);
            res.status(400).json(error);
        });

});
/************************************************************************************************************************************
 *                                                                                                                                  *
 *                                                  PUT Change Password                                                                *
 *                                                                                                                                  *
 ************************************************************************************************************************************/
app.put('/change_password', function(req, res) {
    return new Promise(function(resolve, rej) {
        if (!req.session.user_login) {
            return rej(401);
        }

        var body = _.pick(req.body, 'current_password', 'new_password', 'confirm_password');
        _.defaults(body, {
            confirm_password: '  ',
            current_password: ' ',
            new_password: ' '
        });
        if (body.current_password.trim().length === 0 || body.new_password.trim().length === 0 || body.confirm_password.trim().length === 0) {
            rej(400);
        }
        body.email = req.session.user_email;
        if (!passwordHash.verify(body.current_password.trim(), req.session.user_password)) {
            rej(403);
        } else if (body.new_password !== body.confirm_password) {
            rej(406);
        } else {
            var hashedPassword = passwordHash.generate(body.new_password.trim());
            con.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, req.session.user_email], (err, res) => {
                if (err) { throw (err) } else {
                    req.session.user_password = hashedPassword;
                    resolve(200);
                }
            });
        }

    }).then(function(data) {
        return res.status(data).send();
    }, function(error) {
        return res.status(error).send();
    }).catch(function(error) {
        console.log(error);
    });

});



/************************************************************************************************************************************
 *                                                                                                                                  *
 *                                                  GET Users Logout                                                                *
 *                                                                                                                                  *
 ************************************************************************************************************************************/
app.get('/logout', function(req, res) {
    if (!req.session.user_login) {
        return res.status(401).send();
    } else {
        req.session.destroy();
        return res.status(200).send();
    }
});

/************************************************************************************************************************************
 *                                                                                                                                  *
 *                                                  Starting server                                                                 *
 *                                                                                                                                  *
 ************************************************************************************************************************************/
var server = app.listen(PORT, function() {
    console.log('Express listening on port ' + PORT + '!');
});
server.timeout = 2500;

/************************************************************************************************************************************
 *                                                                                                                                  *
 *                                                      End Of file                                                                 *
 *                                                                                                                                  *
 ************************************************************************************************************************************/