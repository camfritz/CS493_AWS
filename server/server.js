var fs = require('fs');

const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();

var AWS = require('aws-sdk');
var uuid = require('node-uuid');

var s3 = new AWS.S3();

var params = {
	Bucket: "cf-privatebucket01"
 };

var objects = [];

app.get('/', function(req, res) {
	objects.length = 0;
	res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	s3.listObjects(params, function(err, data) {
		if(err) {
			console.log('ERROR: ' + err);
		}
		else {
			for(i = 0; i < (data.Contents).length; i++) {
				objects.push({key: data.Contents[i].Key, url: 'https://s3-us-west-2.amazonaws.com/cf-privatebucket01/' + data.Contents[i].Key});
			}
			console.log(objects)
			res.send(objects);
		}
	})
})

app.listen(process.env.port || 3000);

/* TEST CODE
				s3.getObject({Bucket: 'cf-privatebucket01', Key: data.Contents[i].Key}, function(get_err, file_data) {
					if(err) {
						console.log('ERROR: ' + get_err);
					}
					else {
						fs.writeFile('test.txt', file_data.Body, function(save_err) {
							if(save_err) throw save_err;
							console.log('Saved!');
						})
					}
				});
*/