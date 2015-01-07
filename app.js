

// These examples imply the phone initiating the communication, pulling
//   the payloads from node (via express).
// Note how all payloads are wrapped in the express.js handlers.

var cuipp = require('cuipp');

var express = require('express');
var app = express();

var config = require('config');
var async  = require('async');

var knownPhones = {};


// Express.js configuration
app.set('view engine','ejs');

app.use(express.static(__dirname + '/static'));



// When queried "/", reply with the list of known phones and a couple links to administrative functions.
app.get('/', function (req, res) {
	
	// The list of phones needs to be minimally formatted, in
	//   order to be put into a dataTable. We don't want
	//   to show all data, and we want to show a link or two
	//   per phone.
	
	var tableData = [];
	for (var i in knownPhones) {
		var phone = knownPhones[i];
		var tableRow = [];
		
		tableRow.push(knownPhones[i].DeviceName); // SEP
		tableRow.push(knownPhones[i].Descr); // Person
		tableRow.push(knownPhones[i].Ipaddr);
		tableRow.push(knownPhones[i].DeviceModel);
		tableRow.push(knownPhones[i].modelNumber);
		
		var regStatus = knownPhones[i].RegStatus;
		if (regStatus == 'unr' ) {regStatus = '<span class="label label-warning">unr</span>'}
		if (regStatus == 'reg' ) {regStatus = '<span class="label label-success">reg</span>'}
		if (regStatus == 'rej' ) {regStatus = '<span class="label label-danger">rej</span>'}
		tableRow.push(regStatus);
		
		var networkStatus = knownPhones[i].networkStatus;
		if (networkStatus == 'OK' ) {networkStatus = '<span class="label label-success">OK</span>'}
		if (networkStatus == 'UNKNOWN' ) {networkStatus = '<span class="label label-default">UNKNOWN</span>'}
		if (networkStatus.search('Error') != -1 ) {networkStatus = '<span class="label label-danger">' + networkStatus + '</span>'}
		
		tableRow.push(networkStatus);
		
		//tableRow.push(knownPhones[i].HTTPsupport);
		tableRow.push("<a href='/phone/" + knownPhones[i].Ipaddr + "'>Remote control</a>");
		// tableRow.push("<img src='http://" + config.defaultPhoneUser + ':' + config.defaultPhonePasswd + '@' + knownPhones[i].Ipaddr + ':' + config.defaultPhonePort + "/CGI/Screenshot'>");
		
		tableData.push(tableRow);
	}
	
	
	res.render('list',{phones: JSON.stringify(tableData)});
	
})


// When queried "/updatePhonesFromRisDb", reply with the list of known phones and a couple links to administrative functions.
app.get('/updatePhonesFromRisDb', function (req, res) {
	
	/// TODO: Use async.js to merge results from 
	///   several RIS DB servers.
	
 	//require('./getPhonesFromRisDb-stub')(config.risDBservers[0], function(err,res2){
	//console.log(config.risDBservers[0].host);
	require('./getPhonesFromRisDb')(config.risDBservers[0], function(err,res2){
		
		if (err) {
			res.send(500,err.toString());
			return;
		}
		
		for (var i in res2){
			var phone = res2[i];
			knownPhones[ phone.DeviceName ] = phone;
			knownPhones[ phone.DeviceName ].networkStatus = 'UNKNOWN';
			knownPhones[ phone.DeviceName ].modelNumber = 'UNKNOWN';
			
			/// FIXME: Add better business logic for
			/// registered/unregistered phones.
			/// TODO: call getDeviceInformation() to
			/// fetch extra info and check online/offline
			/// status
		}
		res.writeHead(302,{'Location':'/'});
		res.send();
// 		res.header('Phones updated from RIS DB! (hit "back")');
	});
})



// When queried "/updateNetworkStatus", query the device information from every phone, and update
// a field on the knownPhones structure, with the network status or network error.
app.get('/updateNetworkStatus', function (req, res) {
	
	var funcs = [];
	for (var i in knownPhones) {
		funcs.push(updateNetworkStatusOfPhone(knownPhones[i].DeviceName,knownPhones[i].Ipaddr));
	}
	
	async.parallelLimit(funcs,50,function(err,res2){
		res.writeHead(302,{'Location':'/'});
		res.send();
	});
	
})


function updateNetworkStatusOfPhone(sep,host) {
	return function(callback){
		var phone = { 
			host:host,
			port:config.defaultPhonePort,
			username:config.defaultPhoneUser,
			password:config.defaultPhonePasswd
		};
		
		cuipp.getDeviceInfo(phone,function(err,res){
			if (!err) {
				knownPhones[ sep ].networkStatus = 'OK';
				knownPhones[ sep ].modelNumber = res.modelNumber;
			} else {
				knownPhones[ sep ].networkStatus = err.toString();
			}
			callback();
		});
		
	};
}



app.get('/phone/:phone',function(req,res) {
	
	var templateVariables = {};
	
	templateVariables.phone = req.params.phone;
	templateVariables.imageUrl = "http://" + config.defaultPhoneUser + ':' + config.defaultPhonePasswd + '@' + req.params.phone + ':' + config.defaultPhonePort + "/CGI/Screenshot";
	
// 	templateVariables.imageUrl = '/img/example_phone_screenshot.jpg';	//// FIXME: Use only during debug.
	
	
	res.render('phone', templateVariables);
	
});



app.get('/push/:phone/:key', function (req, res) {

	var command = 'Key:' + req.params.key;
	var commandArray = {};
	commandArray[command] = 0;	// 0 = execute immediatly

	var phone = { 
		host:req.params.phone,
		port:config.defaultPhonePort,
		username:config.defaultPhoneUser,
		password:config.defaultPhonePasswd
	};
	
	cuipp.send(phone, cuipp.execute( commandArray ),function(err,res2){
		// Send back to the web browser the response fromthe phone, even
		//   if the browser won't care about it right now.
		if (err) {
			res.status(500).send(err.toString());
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
