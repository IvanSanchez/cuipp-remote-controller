var Connection = require('ssh2');

var iconv = require('iconv-lite');	/// FIXME!!!
iconv.extendNodeEncodings();


var requested = false;
var receivingRecords = false;
var buff = '';


// The only parameter must be like:
// {
//   host: '1.2.3.4',
//   port: 22,
//   username: 'ccmadministrator',
//   password: 'Tip@dmin'
// }
// See *ssh2* documentation for alternative forms of specifying servers with different SSH authentication schemes.

function getPhonesFromRisDb(risDbServer, callback) {


var conn = new Connection();
conn.on('ready', function() {
	console.log('Connection :: ready');

	conn.shell('', function(err, stream) {
		
// 			stream.setEncoding('ISO-8859-1');
		
		if (err) throw err;
		stream.on('exit', function(code, signal) {
			console.log('Stream :: exit :: code: ' + code + ', signal: ' + signal);
		}).on('close', function() {
			console.log('Stream :: close');
			conn.end();
		}).on('data', function(data) {
		console.log('STDOUT: ' + data);
		
		if (data == 'admin:' && requested) {
			console.log("All done!");
// 				console.log(buff.split('\r\n'));
			stream.end();
			conn.end();
			parseRisDbOutput(buff.split('\r\n'), callback);
		}
		if(data == 'admin:' && !requested) {
			console.log("Asking for 'show risdb query phone'");
			stream.write('show risdb query phone\n');
			requested = true;
		}
		if (data.slice(0,41) == '----------- Phone Information -----------') {
			receivingRecords = true;
			console.log('Starting to receive records');
		}
		
		if (receivingRecords) {
// 				buff += data.toString('utf8');
// 				buff += iconv.decode(data, 'iso-8859-1');
			buff += data;
		}
		
		
		}).stderr.on('data', function(data) {
			console.log('STDERR: ' + data);
		});
	});

}).connect(risDbServer);

conn.on('error',callback);

}


function parseRisDbOutput(lines,callback){
	// This assumes a lot of things from the lines array: the field definition starts at line 6 (0-based index 5), and the first blank line marks the end of the data.
	
	var fieldDefs = lines[5].split(', ');
	console.log('field Def:', fieldDefs);
	var phones = [];
	var dataEnd = false;
	
	for (var i=6; i<lines.length; i++){
		if (!lines[i]) {
			dataEnd = true;
		}
		if (!dataEnd) {
			var fields = lines[i].split(', ');
			var phone = {};
			for (var j in fieldDefs) {
				phone[fieldDefs[j]] = fields[j];
			}
			phones.push(phone);
		}
	}
	
	callback(undefined,phones);
};



/// Debug!
/*
getPhonesFromRisDb({
  host: '1.2.3.4',
  port: 22,
  username: 'ccmadministrator',
  password: 'Tip@dmin'
}, function(err,res){
	
	/// FIXME!!!!
	console.log(res);
});*/




module.exports = getPhonesFromRisDb;
