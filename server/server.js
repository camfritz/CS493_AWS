var fs = require('fs');

const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

var AWS = require('aws-sdk');
var uuid = require('node-uuid');

var s3 = new AWS.S3();

var ddb = new AWS.DynamoDB.DocumentClient();

var params = {
	Bucket: "cf-privatebucket01"
 };

 var genre_ddb_params = {
 	TableName: 'music',
 	ExpressionAttributeValues: {
 		":letter1": "A",
 		":letter2": "z"
 	},
 	FilterExpression: "genre between :letter1 and :letter2"
 }


function artists_genre_ddb_params(genreName) {
 return {
 	TableName: 'music',
 	ExpressionAttributeValues: {
 		":gn": `${genreName}`,
 		":letter1": "A",
 		":letter2": "z"
 	},
 	FilterExpression: "genre = :gn and artist between :letter1 and :letter2"
 }
}

function albums_artist_ddb_params(artistName) {
 return {
 	TableName: 'music',
 	IndexName: "artist_gsi",
 	ExpressionAttributeValues: {
 		":an": `${artistName}`,
 	},
 	KeyConditionExpression: "artist = :an"
 }
}

function songs_album_ddb_params(albumName) {
 return {
 	TableName: 'music',
 	ExpressionAttributeValues: {
 		":an": `${albumName}`
 	},
 	FilterExpression: "contains(artist_album_song, :an)"
 }
}

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

app.get('/genres', function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	ddb.scan(genre_ddb_params, function(err, data) {
		if(err) {
			console.log('ERROR: ' + err);
		}
		else {
			console.log('Scan succeeded');
			var currentGenre = ''
			var resItems = []
			data.Items.forEach(function(item) {
				if(item.genre != currentGenre) {
					resItems.push(item.genre)
				}
				currentGenre = item.genre;
			})
			console.log(resItems)
			res.send(resItems);
		}
	})
})

app.get('/artists/for/genre', function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	var url = req.url;
	url = (url.split('?')[1]).split('=')[1]

	ddb.scan(artists_genre_ddb_params(url), function(err, data) {
		if(err) {
			console.log('ERROR: ' + err);
		}
		else {
			console.log('Scan succeeded');
			var currentArtist = ''
			var resItems = []
			data.Items.forEach(function(item) {
				if(item.artist != currentArtist) {
					resItems.push(item.artist)
				}
				currentArtist = item.artist;
			})
			console.log(resItems)
			res.send(resItems);
		}
	})
})

app.get('/albums/for/artist', function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	var url = req.url;
	url = (url.split('?')[1]).split('=')[1]

	ddb.query(albums_artist_ddb_params(url), function(err, data) {
		if(err) {
			console.log('ERROR: ' + err);
		}
		else {
			console.log('Scan succeeded');
			var currentAlbum = ''
			var resItems = []
			data.Items.forEach(function(item) {
				if(item.artist_album_song != currentAlbum) {
					resItems.push(item.artist_album_song.split('#')[1])
				}
				currentArtist = item.artist_album_song;
			})
			console.log(resItems)
			res.send(resItems);
		}
	})
})

app.get('/songs/for/album', function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	var url = req.url;
	url = (url.split('?')[1]).split('=')[1]

	ddb.scan(songs_album_ddb_params(url), function(err, data) {
		if(err) {
			console.log('ERROR: ' + err);
		}
		else {
			console.log('Scan succeeded');
			var currentSong = ''
			var resItems = []
			data.Items.forEach(function(item) {
				if(item.artist_album_song != currentSong) {
					var AlbumTitle = item.artist_album_song.split('#')[1]
					if(AlbumTitle == url) {
						resItems.push(item.artist_album_song.split('#')[2])
					}
				}
				currentSong = item.artist_album_song;
			})
			console.log(resItems)
			res.send(resItems);
		}
	})
})

app.get('/song', function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	var url = req.url;
	url = (url.split('?')[1]).split('=')[1]

	if(url == 'wonderwall') {
		s3.listObjects(params, function(err, data) {
		if(err) {
			console.log('ERROR: ' + err);
		}
		else {
			res.send('https://s3-us-west-2.amazonaws.com/cf-privatebucket01/' + data.Contents[0].Key)
			}
		})
	}
})

app.post('/save-user', function(req, res) {
	console.log(req.body.id);
	ddb.put({
		TableName: 'users',
		Item: {
			'id': req.body.id,
			'name': req.body.name,
			'email': req.body.email
		}
	}, function(err, data) {
		if(err) throw err;
		else {
			console.log(data);
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
