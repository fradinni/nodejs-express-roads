var roles_list = function(req, res, next) {
	res.send([
		{name: "User 1", email: "user1@domain.com"}
	   ,{name: "User Z", email: "user2@domain.com"}
	   ,{name: "User 3", email: "user3@domain.com"}
	   ,{name: "User 4", email: "user4@domain.com"}
	]);
};


module.exports = [
	{
		path: "/roles"
	   ,method: "GET"
	   ,fn: roles_list
	}
]	