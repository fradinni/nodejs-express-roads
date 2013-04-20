if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require) {

	var module2 = require('./testModule2');

	var test = function(param) {
		console.log('Param: ' + param);
	};

	module2.test2('OK2');

	return {
		test: test
	}
});