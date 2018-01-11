var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var passwordHash = require('password-hash');
var mysql = require('mysql');
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
 *													Get All Users																	*
 *																																	*
 ************************************************************************************************************************************/

app.get('/users', function(req, res) {

	var usersEmail = [];

	con.query('SELECT email,name FROM users', (err, rows) => {
		if (err) throw err;
		console.log('Data received from Db:\n');
		usersEmail = (rows);
		console.log(usersEmail);
		res.json(usersEmail);
	});

});


/************************************************************************************************************************************
 *																																	*
 *													POST SignUp Users																*
 *																																	*
 ************************************************************************************************************************************/

app.post('/users', function(req, res) {
	var body = _.pick(req.body, 'email', 'password', 'name', 'city', 'country', 'lon', 'lat');
	var matchedEmail

	_.defaults(body, {
		city: 'NA',
		country: 'NA',
		lon: 'NA',
		lat: 'NA'
	});

	if (body.email.trim().length === 0 || body.password.trim().length === 0 || body.name.trim().length === 0) {
		return res.status(400).send();
	}
	var hashedPassword = passwordHash.generate(body.password.trim());

	body.email = body.email.trim();
	body.password = hashedPassword;
	body.name = body.name.trim();

	var findEmail = body.email;

	con.query('SELECT email FROM users WHERE email = ?', [findEmail], (err, rows) => {
		if (err) throw err;
		if (rows.length > 0) {
			return res.status(406).json('Email already exist');
		} else {
			con.query('INSERT INTO users SET ?', body, (err, res) => {
				if (err) throw (err)
			});
			return res.json(body);

		}
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
 *														End Of file																	*
 *																																	*
 ************************************************************************************************************************************/