var hello_world = function(req, res, next) {
	res.send("Hello World !");
}


module.exports = [
	{
	  	path: "/hello"
	   ,method: "GET"
	   ,fn: hello_world
	}
]; 