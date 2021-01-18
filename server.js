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

/* Confirm whether mongoose is online */
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Connected successfully to DB");
});

/* Schema and model */
const urlSchema = new mongoose.Schema({
	url: String,
	shortURL: Number
});
const URLModel = mongoose.model('URLModel', urlSchema);

let shortURLCount = 0;

/* Get the number of documents in the database so we can number new short url's from
the next number */
(async function() {
	await URLModel.find({}).exec(function(err, data) {
		try {
			shortURLCount = data.length;
		} catch(err) {
			shortURLCount = 0;
		} 
	});
})()

app.post('/api/shorturl/new', (req, res, next) => {
	console.log("POST", req.body.url);
	let url = req.body.url;						// The new URL

	let modifiedURL = modifyURLForLookup(url);	// Strip the URL to the domain name
												// and use that for dns.lookup()
	

	dns.lookup(modifiedURL, function(err, address, family) {
		if (err) {
			// Perhaps no such domain name found.
			req.error = err;
			next();
		} else {
			/* The protocols (https://, http://) are not to be saved with the url
			string. So before checking and saving in the database, 
			they have to be removed */
			const protocolRegex = /^\w+:\/\/*/i;
			url = url.replace(protocolRegex, "");
			checkDatabase(url, req, next);
		}
	});
	
}, (req, res) => {
	if (req.error) {
		res.json({
			error: "invalid url",
			original_url: req.error.hostname
		});
	} else {
		res.json(req.result);
	}
});

/* A short url (number) is in the parameters of a get route. Check whether such 
short url exists. If it doesn't exist, then send an error message */
app.get('/api/shorturl/:short', function(req, res) {
	console.log("PARAMS", req.params.short);
	URLModel.findOne({shortURL: req.params.short}, function(err, doc) {
		if (err) {
			console.error(err);
			return;
		}
		if (!doc) {
			res.json({
				error: "No such shorturl available",
				short_url: req.params.short
			})
		} else {
			const url = doc.url;
			res.redirect("https://" + url);
		}
	});
});

/* Check the database for a URL. If none found, Add it. If found, add new properties
to the request object that will be sent in the handler function */
function checkDatabase(url, req, next) {
	URLModel.findOne({url: url}, function(err, result) {
		if (err) console.error(err);
		if (!result) {
			addURLToDatabase(url, req, next);
		} else {
			req.result = {
				original_url: "https://" + result.url,
				short_url: result.shortURL
			};
			next();
		}
	});
}

/* The URL was not found. Add a new URL to the database and also send response */
function addURLToDatabase(url, req, next) {
	shortURLCount++;

	const newURL = new URLModel({url: url,
								 shortURL: shortURLCount
								});
	
	newURL.save(function(err, result) {
		if (err) {
			console.log("Error saving ", err)
			next();
		};
		req.result = {
			original_url: "https://" + result.url,
			short_url: result.shortURL
		};
		next();
	});
}

/* DNS works only on domain names. This function strips it off all other 
text so it can be tested by dns.lookup() */
function modifyURLForLookup(url) {
	const protocolRegex = /^\w+:\/\/*/i;		// Doesn't accept hostname with protocols
	
	/* Makes sure http:// or https:// is the only allowed protocol */
	if (protocolRegex.test(url)) {
		const protocol = url.match(protocolRegex)[0].toLowerCase(); // The protocol
		
		/* Protocol perhaps is ftp:/. In that case, return the url as it is
		It probably would not be successful verified by dns.lookup() as it still has
		the protocol */
		if (protocol !== "http://" && protocol !== "https://") {
			return url;
		}
	}

	/* Use a slightly modified regex when there are more than one dots. 
	(URLs containing subdomains) */
	let dots = url.match(/[.]/g).length;
  	let regex = null;
  	if (dots > 1) {
  		regex = /(?<=\.)(\w+\-*\w*\.\w+\-*\w*)/g;
  	} else {
    	regex = /\w+\-*\w*\.\w+\-*\w*/g;
  	}
  	const matches = url.match(regex);
  	
  	url = matches[0];			// Just the main domain name
  	return url;
}

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
