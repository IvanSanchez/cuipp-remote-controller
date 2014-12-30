

// These examples imply the phone initiating the communication, pulling
//   the payloads from node (via express).
// Note how all payloads are wrapped in the express.js handlers.

var cuipp = require('cuipp');

var express = require('express');
var app = express();



// Express.js configuration
app.set('view engine','ejs');

app.use(express.static(__dirname + '/static'));


/// TODO: Fetch port, username and passwd from a database or file
var defaultPhonePort = 80;
var defaultPhoneUsername = 'user';
var defaultPhonePasswd = 'passwd';


// When queried "/", reply with the list of known phones and a couple links to administrative functions.
app.get('/', function (req, res) {
	
	res.render('list');
	
})



app.get('/phone/:phone',function(req,res) {
	
	var templateVariables = {};
	
	templateVariables.phone = req.params.phone;
	templateVariables.imageUrl = "http://" + defaultPhoneUsername + ':' + defaultPhonePasswd + '@' + req.params.phone + ':' + defaultPhonePort + "/CGI/Screenshot"
	
	res.render('phone', templateVariables);
	
});



app.get('/push/:phone/:key', function (req, res) {

	var command = 'Key:' + req.params.key;
	var commandArray = {};
	commandArray[command] = 0;	// 0 = execute immediatly

	var phone = { host:'localhost',port:defaultPhonePort,username:defaultPhoneUsername,password:defaultPhonePasswd};
	
	cuipp.send(phone, cuipp.execute( commandArray ),function(err,res2){
		// Send back to the web browser the response fromthe phone, even
		//   if the browser won't care about it right now.
		if (err) {
			res.status(502).send(err.toString());
		} else {
			res.status(200).send(res2);
		}
	});
	
	
})



var server = app.listen(3002, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('cuipp-remote-controller listening at http://%s:%s', host, port)

})
