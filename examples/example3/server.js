var requirejs = require('requirejs');

console.log("__dirname: ", __dirname);

requirejs.config({
    //Pass the top-level main.js/index.js require
    //function to requirejs so that node modules
    //are loaded relative to the top-level JS file.
    nodeRequire: require,
    baseUrl: __dirname
});

requirejs(['underscore', 'http', 'express', './testModule.js'],
function   (_, http, express, testModule) {
    
    testModule.test('OK');

    var app = express();

    /**
    * Set ENV variables
    */
    app.set('PORT', 5000);


    /**
    * Initialize Application routes
    */
    app.use(app.routes);

    //
    // Start listening...
    //
    http.createServer(app).listen(app.get('PORT'), function(){
      console.log("[Started] Server is listening on port: " + app.get('PORT'));
    });

});