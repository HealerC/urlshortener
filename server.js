const cors = require('cors');
require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dns = require('dns');		// To verify a submitted url

/* Connects to a database */
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

/* Mount a middleware that allows parsing of the payload of a POST request */
app.use(bodyParser.urlencoded({extended: false}));


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

//APP
app.post('/api/shorturl/new', (req, res, next) => {
	let url = req.body.url;
	const httpRegex = /^https?:\/\//i;		// Doesn't accept hostname with protocols
	url = url.replace(httpRegex, "");		// Removed "http://" or "https://"

	dns.lookup(url, function(err, address, family) {
		if (err) {
			req.error = err;
		}
		next();
	});
}, (req, res) => {
	if (req.error) {
		res.json({
			error: "invalid url",
			original_url: req.error.hostname
		});
	} else {
		res.json({original_url: req.body.url});
	}
});



app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
