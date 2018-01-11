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
 *													Get USER Login																	*
 *																																	*
 ************************************************************************************************************************************/

app.get('/login', function(req, res) {
	var queryParams = req.query;
	var usersEmail = [];
	return new Promise(function(resolve, rej) {

		if (queryParams.hasOwnProperty('email') && queryParams.email.trim().length > 0 &&
			queryParams.hasOwnProperty('pass') && queryParams.pass.trim().length > 0) {

			con.query('SELECT email,password FROM users WHERE email = ?', [queryParams.email],(err, rows,fields) => {
				if (err) throw err;
				
				if (passwordHash.verify(queryParams.pass, rows[0].password)) {
					resolve('User login seccessful');
				} else {
						rej(404);
				}

			});

		}
	}).then(function(data) {
		
		return res.json('User Login seccessful');
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
	var objEx = 10;

	_.defaults(body, {
		city: 'NA',
		country: 'NA',
		lon: 'NA',
		lat: 'NA'
	});

	if (body.email.trim().length === 0 || body.password.trim().length === 0 || body.name.trim().length === 0) {
		return res.status(400).send();
	}
	var hashedPassword = body.password.trim();// = passwordHash.generate(body.password.trim());

	body.email = body.email.trim();
	body.password = hashedPassword;
	body.name = body.name.trim();

	var findEmail = body.email;


	return new Promise(function(resolve, rej) {

		con.query('SELECT email FROM users WHERE email = ?', [findEmail], (err, rows) => {
			if (err) throw err;
			if (rows.length > 0) {
				return res.status(406).json('Email already exist');
			} else {
				objEx = 20 //{dsadsad :'asdasd', adsadaddd:'dasdasd'};

				con.query('INSERT INTO users SET ?', body, (err, res) => {
					if (err) throw (err)
				});

				resolve(objEx);

				//return res.json(body);

			}

		});
	}).then(function(data) {
		console.log(objEx);
		console.log('Resolve: ' + data);
		return res.json(body);
	}, function(error) {
		console.log('Reject: ' + error);
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