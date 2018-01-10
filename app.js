var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var users = [];
var app = express();
var PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.send('Users API Root');
});


/************************************************************************************************************************************
 *																																	*
 *													Get All Todos Items																*
 *																																	*
 ************************************************************************************************************************************/

app.get('/users', function(req, res) {

	res.json(users);
});


/************************************************************************************************************************************
 *																																	*
 *													POST SignUp Users																*
 *																																	*
 ************************************************************************************************************************************/

app.post('/users', function(req, res) {
	var body = _.pick(req.body, 'email', 'password', 'name', 'city', 'country', 'long', 'lat');

	if (body.email.trim().length === 0 || body.password.trim().length === 0 || body.name.trim().length === 0) {
		return res.status(400).send();
	}
	body.email = body.email.trim();
	body.password = body.password.trim();
	body.name = body.name.trim();

	users.push(body);

	res.json(body);
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