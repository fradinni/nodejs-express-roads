/**
* JS File Optify (Opfuscation + Minification)
*/
var fs = require('fs')
   ,compressor = require('node-minify');

console.log("Dirname: ", __dirname);

// Using UglifyJS for JS
new compressor.minify({
    type: 'uglifyjs'/*'yui-js'*/,
    fileIn: './src/express-roads.js',
    fileOut: './build/express-roads.min.js',
    callback: function(err){

    	if(err) throw err;
        
    	var minified = fs.readFileSync('./build/express-roads.min.js').toString();

		var headerTpl = "";
		headerTpl += "/******************************************************************************\n";
		headerTpl += "* Node JS Express Roads\n";
		headerTpl += "* ----------------------------------------------------------------------------\n";
		headerTpl += "* Version: ${version}\n";
		headerTpl += "* Author: ${author}\n";
		headerTpl += "* Date: ${date}\n";
		headerTpl += "* ----------------------------------------------------------------------------\n";

		var footerTpl = "*\n";
		footerTpl += "*/\n";
		 
		var author = fs.readFileSync('./AUTHOR').toString();
		var license = fs.readFileSync('./LICENSE').toString();
		var version = fs.readFileSync('./VERSION').toString();

		var currentTime = new Date()
		var month = currentTime.getMonth() + 1
		var day = currentTime.getDate()
		var year = currentTime.getFullYear()
		var date = month+'/'+day+'/'+year;


		// Build Optimized JS file
		var data = "";
		data += headerTpl;

		// Add comment to each line of license		
		var commentedLicense = "";
		var liscencePattern = "* ";

		var lines = license.split('\n', -1);
		for(var i=0; i<lines.length; i++) {
			 commentedLicense += (liscencePattern + lines[i] + '\n');
		};

		data += commentedLicense;
		data += footerTpl;

		while(data.indexOf('${author}') != -1) {
			data = data.replace('${author}', author);
		}
		data = data.replace('${version}', version);
		data = data.replace('${date}', date);

		data += minified;

		// Write files
		fs.writeFileSync('./lib/express-roads.js', data);

		// Delete tmp files
		fs.unlink('./build/express-roads.min.js');

		console.log('Optimized !');
    }
});

