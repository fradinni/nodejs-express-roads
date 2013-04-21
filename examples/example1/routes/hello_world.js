if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require) {

	var hello_world = function(req, res, next) {
		res.send("Hello World !");
	}


	return [
		{
		  	path: "/hello"
		   ,method: "GET"
		   ,fn: hello_world
		   ,auth: true
		}
	]
});