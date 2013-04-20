var requirejs = require('requirejs');
requirejs.config({
    baseUrl: __dirname,
    nodeRequire: require
});

requirejs([
	'http', 
	'express', 
	'path',
	'../../lib/express-roads'
], function (http, express, path, ExpressRoads) {

	/**
	* Create new Express application
	*/
	var app = express();

	/**
	* Add Express Middlewares
	*/
	app.use(express.favicon());
	app.use(express.compress());
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser('Secret'));
	app.use(express.session({secret: 'Secret'}));

	/**
	* Set ENV variables
	*/
	app.set('PORT', 5000);


	/**
	* Initialize Application routes
	*/
	app.use(app.routes);

	// Initialize Express Roads
	ExpressRoads.initialize(app, {
		baseDir: __dirname,
		routesDir: './routes',
		debug: true
	}, function() {

		//
		// Public directory to serve
		//
		app.use(express.static(path.join(__dirname, 'www')));


		//
		// Start listening...
		//
		http.createServer(app).listen(app.get('PORT'), function(){
		  console.log("[Started] Server is listening on port: " + app.get('PORT'));
		});


	});

});
