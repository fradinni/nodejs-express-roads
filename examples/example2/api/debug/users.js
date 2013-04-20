var users_list = function(req, res, next) {
	res.send([
		{name: "User 1", email: "user1@domain.com"}
	   ,{name: "User Z", email: "user2@domain.com"}
	   ,{name: "User 3", email: "user3@domain.com"}
	   ,{name: "User 4", email: "user4@domain.com"}
	]);
};

var user_get = function(req, res, next) {
	res.send({
		name: "User " + req.params.id
	   ,email: "user" + req.params.id + "@domain.com"
	});
}


// Export routes
module.exports = [
	{
		path: "/users"
	   ,method: "GET"
	   ,fn: users_list
	},
	{
		path: "/user/:id"
	   ,method: "GET"
	   ,fn: user_get
	}
]	