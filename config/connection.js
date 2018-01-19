var mysql      = require('mysql');
var connection = mysql.createConnection({
    // Properties.....
    host     : 'localhost',
    user     : 'root',
    password : 'Emilence2016',
    database : 'traineedata'
});

// create mysql connection---------------------------------------------
connection.connect(function(err){
    // callback....
    if(!err) {  
        console.log("Database is connected ...");

    } else {
        console.log("Error connecting database ...");
    }
});

module.exports=connection;
