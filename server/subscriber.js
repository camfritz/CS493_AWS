var fs = require('fs');

const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();
const redis = require('redis');
const bodyParser = require('body-parser');

const channel = 'reporting';

var subscriber = redis.createClient(6379, 'reporting.muemj7.ng.0001.use1.cache.amazonaws.com');

subscriber.on('connect', function() {
  console.log('Redis subscriber successfully connected..');
});

subscriber.on('error', function(err) {
  console.log('Redis subscriber failed to connect. Reason: ' + err);
});

subscriber.subscribe(channel, (error, count) => {
  if(error) throw err;
  else {
    console.log(`Subscribed to ${channel} channel. Waiting for updates.`)
  }
});

redis.on('message', (channel, message) => {
    console.log(`Received the following message from ${channel}: ${message}`);
});
