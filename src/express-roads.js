/******************************************************************************
 * Node JS Express Roads
 * ----------------------------------------------------------------------------
 * Version: 0.0.1
 * Authors: Nicolas FRADIN
 * Date: 04/2013
 */

if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require) {

	var _ = require('underscore')
	   ,fs = require('fs')
	   ,path = require('path');

	var __DEBUG = false;

	/**
	* Define Logger
	*/
	logger = console;


	/**
	* Initialize variable to handle Application
	*/
	var Application;

	/**
	*
	*/
	var __dirname;

	/**
	* Define routes base directory
	*/
	var __routesBaseDir;

	/**
	* Define if API routing mechanism is used
	*/
	var USE_API = false;

	/**
	* Define API Files base directory
	*/
	var __apiBaseDir;

	/**
	* List of allowed files extensions in lowercase.
	* Only files with these extensions will be loaded
	*/
	var __allowedExts;

	/**
	* Init API versions
	*/
	var apiVersions;

	/**
	* Init DEFAULT API version
	*/
	var defaultApiVersion;


	/**
	* Initialize API versions structure. All routes of this application
	* are described here. This apiVersion structure just handle routes
	* to initialize in Application Router.
	*
	* API is structured like:
	*
	* 	var API_MODULES = { 
	*		"v1": [
	*			{name: 'users', module: [Object]},
	*			{name: 'contacts', module: [Object]}
	*		],
	*		"v2": [
	*			{name: 'users', module: [Object]},
	*			{name: 'contacts', module: [Object]}
	*		]	
	* 	}
	*/
	var API_MODULES = {};

	/**
	* Initialize APPLICATION Routes structure. All routes of this application
	* are described here. This apiVersion structure just handle routes
	* to initialize in Application Router.
	*
	* APP Routes are structured like:
	*
	* 	var APP_MODULES = [
	*		{name: 'users', module: [Object]},
	*		{name: 'contacts', module: [Object]}
	* 	];
	* 
	* This structure is destroyed when all routes are defined in Application Router
	*/
	var APP_MODULES = {};



	///////////////////////////////////////////////////////////////////////////



	/**
	* Initialize routes for Jnuine. This module is used to provide a 
	* versionned API mechanism.
	*
	* @param app {Application}
	* @param params {Object}
	* @param callback {Function}
	*/
	var initialize = function(app, params, callback) {
		params = params || {};
		__DEBUG = params.debug || false;

		logger.log('[Routes] Initialize Express Roads...');

		if(!app) {
			throw new Error('[Routes] Application is not defined !');
		}

		if(!params.baseDir) {
			throw new Error('[Routes] Base directory is not defined !');
		}
		__dirname = params.baseDir;


		if(!params.routesDir) {
			throw new Error('[Routes] How can we setup routes without a base directory ??? Please specify it {params.routesDir} :)');
		}


		// By default only Javascript files will be loaded
		__allowedExts = params.allowedExts || ['js'];
		if(__DEBUG) logger.log("[Routes] -> Allowed extensions: ", JSON.stringify(__allowedExts));

		// Set routes base directory
		__routesBaseDir = path.normalize(__dirname + '/' + params.routesDir);
		if(__DEBUG) logger.log("[Routes] -> Routes basedir: ", __routesBaseDir);

		/**
		* Check if Environment variables are correctly set.
		* To work properly, API Mechanism needs two parameters:
		*
		* - API_VERSIONS :
		* This is the list of version to use when HTTP Backend is running.
		* You can create more versions than needed and use only specified versions
		* in production. For example, a 'dev' API version with special methods accecible in
		* development only.
		*
		* - DEFAULT_API_VERSION:
		* This indicates the default version API to use if no version is specified in URL.
		* For example, if DEFAULT_API_VERSION=v1, calling /api/my_methods is the same as
		* calling /api/v1/my_method.
		*/	
		if(params.useAPI && !process.env.API_VERSIONS && !app.get('API_VERSIONS')) {
			throw new Error("[Routes] No API version is specified ! Please set API_VERSIONS environment variable.");
		}
		if(params.userAPI && !process.env.DEFAULT_API_VERSION && !app.get('DEFAULT_API_VERSION')) {
			throw new Error("[Routes] Default API version is not specified ! Please set DEFAULT_API_VERSION environment variable.");	
		}


		// Set Application
		Application = app;


		/**
		* Check if API mechanism will be used and setup corresponding variables
		*/
		if(params.useAPI && !params.apiBaseDir) {
			throw new Error('[Routes] How can we setup API routes without an API base directory ??? Please specify it {params.apiBaseDir} :)');
		}
		if(params.useAPI) {
			// CHeck if API directory exists
			if(!__APIDirectoryExists(__dirname +'/'+params.apiBaseDir)) {
				throw new Error('[Routes] Unable to find API directory: ' + params.apiBaseDir);
			}

			/**
			* Init API versions
			*/
			
			apiVersions = (process.env.API_VERSIONS || app.get('API_VERSIONS') || '').split(',');
			if(!apiVersions || apiVersions.length < 1) {
				throw new Error('[Routes] Unable to detremine which version of API to use !');
			}

			/**
			* Init DEFAULT API version
			*/
			defaultApiVersion = process.env.DEFAULT_API_VERSION || app.get('DEFAULT_API_VERSION' || '');
			if(!defaultApiVersion) {
				throw new Error('[Routes] Unable to detremine default API version !');
			}

			__apiBaseDir = path.normalize(__dirname + '/' + params.apiBaseDir);
			USE_API = true;
			if(__DEBUG) logger.log("[Routes] -> API is ON");
			if(__DEBUG) logger.log("[Routes] -> API basedir: " + __apiBaseDir);
		} else {
			if(__DEBUG) logger.log("[Routes] -> API mechanism is OFF");
		}

		/**
		* Load Routes
		*/
		if(USE_API) {
			loadAPIRoutes(function() {
				loadAPPRoutes(function() {
					createRoutes();
					if(callback) callback();
				});
			});
		} else {
			loadAPPRoutes(function() {
				createRoutes();
				if(callback) callback();
			});
		}
	}



	///////////////////////////////////////////////////////////////////////////



	/**
	* Creates Application routes corresponding to each
	* API method for each API version.
	*
	* It takes API variables where loaded modules are stored,
	* parse it and add corresponding route to Application routes
	*/
	var createRoutes = function(callback) {
		
		/**
		* Create API Routes
		*/
		if(USE_API) {

			// Iterate on API structure
			_.each(API_MODULES, function(modules, version) {
				if(__DEBUG) logger.log('[Routes] Creating routes for API ' + version);

				// Iterate on each module of current API version
				_.each(modules, function(versionModule) {

					// Retrieve routes of current module
					var moduleRoutes = versionModule.routes;

					// Iterate on each route
					_.each(moduleRoutes, function(route) {

						// Set route in application
						setNativeRoute(route, true, version);
					});
				});
			});
		}

		/**
		 * Create Application Routes
		 */
		_.each(APP_MODULES, function(module) {
			if(__DEBUG) logger.log('[Routes] Creating routes for Application');

			// Retrieve routes of current module
			var moduleRoutes = module.routes;

			// Iterate on each route
			_.each(moduleRoutes, function(route) {

				// Set route in application
				setNativeRoute(route);
			});
		});
	}

	/**
	* Set a route in Application from a route module.
	* A route module is formatted like:
	*
	* 	var route = {
	*		path: '/user/:id'
	*	   ,method: 'POST'		
	*	   ,fn: function(req, req, next){}
	*	   ,auth: true
	* 	}
	*/
	var setNativeRoute = function(route, api, apiVersion) {
		api = api || false;
		apiVersion = apiVersion || process.env.DEFAULT_API_VERSION;

		// If route is an API route, check if API version is specified
		if(api && !apiVersion) {
			throw new Error('[Routes] Unable to dermine API version for route: ' + JSON.stringify(route))
		}

		// Define route path
		var routeExplicitPath
		   ,routeShortcutPath;

		// If route is an API route
		if(api) {
			var apiPath = '/api';
			routeExplicitPath = apiPath + '/' + apiVersion;
			routeShortcutPath = (apiVersion == defaultApiVersion ? apiPath : null);
		} 
		// If route is an Application route
		else {
			routeExplicitPath = '';
		}

		// Append route to path
		var routePath = ((route.path.indexOf('/') == 0 ? '' : '/') + route.path );
		routeExplicitPath += routePath;
		if(routeShortcutPath) routeShortcutPath += routePath;

		/**
		* Create correct application route according to 'method'
		* param of current route
		*/
		switch(route.method.toUpperCase()) {
			case "GET":
				if(__DEBUG) logger.log("[Routes] -> Set route: [GET] -> '"+routeExplicitPath+"'" + (routeShortcutPath ? (" [Default]: '"+routeShortcutPath+"'" ) : ''));
				Application.get(routeExplicitPath, route.fn);
				if(routeShortcutPath) Application.get(routeShortcutPath, route.fn);
				break;

			case "POST":
				if(__DEBUG) logger.log("[Routes] -> Set route: [POST] -> '"+routeExplicitPath+"'" + (routeShortcutPath ? (" [Default]: '"+routeShortcutPath+"'" ) : ''));
				Application.post(routeExplicitPath, route.fn);
				if(routeShortcutPath) Application.post(routeShortcutPath, route.fn);
				break;

			case "PUT":
				if(__DEBUG) logger.log("[Routes] -> Set route: [PUT] -> '"+routeExplicitPath+"'" + (routeShortcutPath ? (" [Default]: '"+routeShortcutPath+"'" ) : ''));
				Application.put(routeExplicitPath, route.fn);
				if(routeShortcutPath) Application.put(routeShortcutPath, route.fn);
				break;

			case "DELETE":
				if(__DEBUG) logger.log("[Routes] -> Set route: [DELETE] -> '"+routeExplicitPath+"'" + (routeShortcutPath ? (" [Default]: '"+routeShortcutPath+"'" ) : ''));
				Application.delete(routeExplicitPath, route.fn);
				if(routeShortcutPath) Application.delete(routeShortcutPath, route.fn);
				break;

			default:
				throw new Error('[Routes] -X Unable to bind HTTP method: ' + route.method);
				break;
		}
	}

	/**
	* Load all files/routes corresponding to versions of API used by application.
	* It's possible to specify which version of API are used
	* by application by setting an ENV variable named API_VERSIONS.
	*
	* Exemple:
	*    API_VERSIONS=v1,v2,dev
	*
	* Each API version files are stored in ./api/{api_version}/:
	*    ./api/v1
	*    ./api/debug
	*/
	var loadAPPRoutes = function(callback) {
		if(__DEBUG) logger.log("[Routes] Load Application Routes files...");

		if(!__APPDirectoryExists(__routesBaseDir)) {
			throw new Error('[Routes] Unable to find routes base directory: ' + __routesBaseDir);
		}

		// Load modules asynchronously
		__loadModulesRecursively(__routesBaseDir, { except: [__apiBaseDir] } , function(err, modules) {
			if(err) {
				return callback(err);
			}

			// Add version modules to API
			APP_MODULES = modules;
			return callback();
		});
	}

	/**
	* Load all files/routes corresponding to versions of API used by application.
	* It's possible to specify which version of API are used
	* by application by setting an ENV variable named API_VERSIONS.
	*
	* Exemple:
	*    API_VERSIONS=v1,v2,dev
	*
	* Each API version files are stored in ./api/{api_version}/:
	*    ./api/v1
	*    ./api/debug
	*/
	var loadAPIRoutes = function(callback) {

		if(__DEBUG) logger.log("[Routes] Load API Routes files...");

		var nbVersions = apiVersions.length;

		// Iterate on each specified API version
		_.each(apiVersions, function(version) {

			// Check if API version exists
			if(!__APIVersionDirectoryExists(version)) {
				throw new Error('[Routes] Unable to find API Version: ' + version);
			}

			// Load routes for current API version
			loadAPIVersionRoutes(version, function(err) {
				if(err) {
					throw new Error('[Routes] Unable to load modules for API version: ' + version + '! Error: ' + err);
				}

				/*
				* Check if all versions are loaded by decrementing
				* nbVersions before executing test on it. When nbVersion
				* is equals to 0, the test becomes true.
				*
				* Explanation: 
				* 	In javascript testing a boolean is like testing an Integer value
				*	greater than 0 or equals to 0.
				*
				*	if(n) -> true	[with n > 0]
				*	if(0) -> false
				*
				*	So the opposite of these tests is:
				*
				*	if(!n) -> false [with n > 0]
				*	if(!0) -> true
				*/
				if(!--nbVersions) callback();
			});

		}, this);
	}

	/**
	* Load all API files/routes for a specific API version
	* This method is parsing specified API version directory
	* and loads recursively all files found.
	* 
	* An API file should return an Array of API routes
	* defined like :
	*
	* 	return [{
	*		path: '/user/:id'
	*	   ,method: 'POST'		
	*	   ,fn: function(req, req, next){}
	*	   ,auth: true
	*      ,apiVersions: ["v1", "v2"]
	* 	}]
	*
	* API Route Parameters:
	* 	- path: 		Path of API route ralative to API version dir
	*	- method: 		Value in ["GET", "POST", "PUT", "DELETE"]
	*	- fn: 			Function called when route is reached
	*	- auth: 		Indicates if user should be authenticated to perform this request
	*	- apiVersions: 	Indicated in which API version method is available
	*
	*/
	var loadAPIVersionRoutes = function(apiVersion, callback) {

		// Initialize API Version directory path
		var __versionBaseDir = __apiBaseDir + '/' + apiVersion;

		// Load files asynchronously
		__loadModulesRecursively(__versionBaseDir, {}, function(err, versionModules) {
			if(err) {
				return callback(err);
			}

			// Add version modules to API
			API_MODULES[apiVersion] = versionModules;
			return callback();
		});
	}

	/**
	* Load files in specified directory recursively and Async.
	* @param baseDir {String} Path of base directory to parse
	*
	* It's possible to bypass directories by specifying {params.except}
	*
	* Example : 
	*	__loadModulesRecursively(baseDir, {except: 'src/myfolder'}, function(){});
	*
	* It returns an Array of objects formatted like:
	*
	* 	var modules = [{
	* 		name: "file1",		// Filename without extension
	*		routes: [Object]	// Loaded Routes from Module
	* 	},
	* 	{
	*		name: "file2",
	*		routes: [Object]
	* 	}];
	*
	*/
	var __loadModulesRecursively = function(baseDir, params, callback) {

		// Init params
		params = params || {};
		params.except = params.except || [];

		// Init modules array
		var modules = [];

		/**
		* Read base directory Iterate on each entry
		*/
		fs.readdir(baseDir, function(err, entries) {
			if(err) return callback(err);

			var nbEntries = entries.length;
			if(!nbEntries) return callback(null, modules);

			_.each(entries, function(entry) {
				var entryPath = baseDir + '/' + entry;

				// Check type of current entry
				fs.stat(entryPath, function(err, stat) {
					// If current entry is a directory
					if(stat && stat.isDirectory()) {

						// If directory is not in except files list
						if( !_.find(params.except, function(except) { 
							return entryPath == except; 
						}) ) {
							// Load files in subdirectory
							__loadModulesRecursively(entryPath, params.except, function(err, res) {
								modules = modules.concat(res);
								if(!--nbEntries) callback(null, modules);
							});
						} else {
							if(!--nbEntries) callback(null, modules);
						}
					} 

					// If current entry is a file
					else {

						// Get file extension
						var fileExt = path.extname(path.basename(entryPath)).substring(1).toLowerCase();

						// If file has an allowed extension, load it
						if( _.find(__allowedExts, function(ext) { return fileExt == ext; }) ){

							if(__DEBUG) logger.log("[Routes] -> Load file: " + entryPath);

							// Push module in modules list
							modules.push({
								 name: entry.substring(0, entry.lastIndexOf('.'))
								,routes: require(entryPath)
							});

						};

						if(!--nbEntries) callback(null, modules);
					}
				});
			});
		});

		return modules;
	}

	/**
	* Check if APP directory exists.
	* Returns true if directory exists.
	*/
	var __APPDirectoryExists = function(appDir) {
		// Check if API version directory exists
		try {
		    stats = fs.lstatSync(appDir);
		    if (!stats.isDirectory()) {
		    	return false;
		    }
		}
		catch (e) {
			console.log(e);
		    return false;
		}

		return true;
	}

	/**
	* Check if API directory exists.
	* Returns true if directory exists.
	*/
	var __APIDirectoryExists = function(apiDir) {
		// Check if API version directory exists
		try {
		    stats = fs.lstatSync(apiDir);
		    if (!stats.isDirectory()) {
		    	return false;
		    }
		}
		catch (e) {
		    return false;
		}

		return true;
	}

	/**
	* Check if API version directory exists in API base dir.
	* Returns true if directory exists.
	*/
	var __APIVersionDirectoryExists = function(apiVersion) {
		// Check if API version directory exists
		try {
			var normalizedPath = path.normalize(__apiBaseDir + '/' + apiVersion);
		    stats = fs.lstatSync(normalizedPath);
		    if (!stats.isDirectory()) {
		    	return false;
		    }
		}
		catch (e) {
			if(__DEBUG) logger.log('Error: ' + e);
		    return false;
		}

		return true;
	}



	///////////////////////////////////////////////////////////////////////////

	/**
	* TODO: Implement for remote control
	*/
	var activateApi = function() {

	}


	/**
	* TODO: Implement for remote control
	*/
	var disableApi = function() {

	}


	/*
	* TODO: Implement for remote control
	*/
	var activateApiVersion = function() {

	}


	/**
	* TODO: Implement for remote control
	*/
	var disableApiVersion = function() {

	}


	/**
	*
	*/
	var disableApiVersionMethod = function() {

	}


	/**
	* TODO: Implement for remote control
	*/
	var disableApiVersionMethod = function() {

	}


	///////////////////////////////////////////////////////////////////////////

	//
	// Export module methods
	//
    return {
 		initialize: initialize
	}

});
