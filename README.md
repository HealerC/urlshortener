# [URL Shortener Microservice](https://www.freecodecamp.org/learn/apis-and-microservices/apis-and-microservices-projects/url-shortener-microservice)
A short program that allows the user to type in the URL and submit it. It returns a JSON object.

The URL is looked up first to make sure the domain is valid. Then it is searched for in the database.
If the URL can be found, its response is JSON with the shorturl of the URL. If it can't be found,
it is added to the database and it also responds with JSON that has the shorturl of the URL.

If the api endpoint /api/shorturl/:short-url (with "short:url" representing the short url number) is requested,
the client is redirected to the url it corresponds to.