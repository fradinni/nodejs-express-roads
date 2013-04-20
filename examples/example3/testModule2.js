if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require) {

	var test2 = function(param) {
		console.log('Param: ' + param);
	};

	return {
		test2: test2
	}
});