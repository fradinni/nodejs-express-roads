nodejs-express-roads
====================

 NodeJS - Express Application and API Routes Management 
 
 
 #Installation
 
 npm install express-roads
 
 #Use
 
 var app = express();
 var ExpressRoads = require('express-roads');
 
	ExpressRoads.initialize(app, {
	   ,baseDir: __dirname
    ,routesDir: './src/routes' // Relative to baseDir
    
	   ,useAPI: true
	   ,apiBaseDir: './src/routes/api' // Relatives to baseDir
	   ,debug: true
	}, function() {

		//
		// Public directory to serve
		//
		app.use(express.static(path.join(__dirname, 'www')));


		//
		// Start listening...
		//
		http.createServer(app).listen(app.get('port'), function(){
		  console.log("\n[Started] Backend is listening on port: " + app.get('port'));
		});

	});
 
 See examples...
