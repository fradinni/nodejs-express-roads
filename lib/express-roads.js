/******************************************************************************
* Node JS Express Roads
* ----------------------------------------------------------------------------
* Version: 0.0.1
* Author: Nicolas FRADIN
* Date: 4/20/2013
* ----------------------------------------------------------------------------
* License: MIT License
* 
* Copyright (c) 2013 ${author}
* 
* Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*
*/
if(typeof define!=="function"){var define=require("amdefine")(module)}define(function(require){var _=require("underscore"),fs=require("fs"),path=require("path");var __DEBUG=false;logger=console;var Application;var __routesBaseDir;var USE_API=false;var __apiBaseDir;var __allowedExts;var apiVersions;var defaultApiVersion;var API_MODULES={};var APP_MODULES={};var initialize=function(app,params,callback){params=params||{};__DEBUG=params.debug||false;logger.log("[Routes] Initialize Express Roads...");if(!app){throw new Error("[Routes] Application is not defined !")}if(!params.routesDir){throw new Error("[Routes] How can we setup routes without a base directory ??? Please specify it {params.routesDir} :)")}__allowedExts=params.allowedExts||["js"];if(__DEBUG)logger.log("[Routes] -> Allowed extensions: ",JSON.stringify(__allowedExts));__routesBaseDir=params.routesDir;if(__DEBUG)logger.log("[Routes] -> Routes basedir: ",__routesBaseDir);if(!process.env.API_VERSIONS&&!app.get("API_VERSIONS")){throw new Error("[Routes] No API version is specified ! Please set API_VERSIONS environment variable.")}if(!process.env.DEFAULT_API_VERSION&&!app.get("DEFAULT_API_VERSION")){throw new Error("[Routes] Default API version is not specified ! Please set DEFAULT_API_VERSION environment variable.")}apiVersions=(process.env.API_VERSIONS||app.get("API_VERSIONS")).split(",");if(!apiVersions||apiVersions.length<1){throw new Error("[Routes] Unable to detremine which version of API to use !")}defaultApiVersion=process.env.DEFAULT_API_VERSION||app.get("DEFAULT_API_VERSION");if(!defaultApiVersion){throw new Error("[Routes] Unable to detremine default API version !")}Application=app;if(params.useAPI&&!params.apiBaseDir){throw new Error("[Routes] How can we setup API routes without an API base directory ??? Please specify it {params.apiBaseDir} :)")}if(params.useAPI){if(!__APIDirectoryExists(params.apiBaseDir)){throw new Error("[Routes] Unable to find API directory: "+params.apiBaseDir)}__apiBaseDir=params.apiBaseDir;USE_API=true;if(__DEBUG)logger.log("[Routes] -> API is ON");if(__DEBUG)logger.log("[Routes] -> API basedir: "+__apiBaseDir)}else{if(__DEBUG)logger.log("[Routes] -> API mechanism is OFF")}if(USE_API){loadAPIRoutes(function(){loadAPPRoutes(function(){createRoutes();if(callback)callback()})})}else{loadAPPRoutes(function(){createRoutes();if(callback)callback()})}};var createRoutes=function(callback){if(USE_API){_.each(API_MODULES,function(modules,version){if(__DEBUG)logger.log("[Routes] Creating routes for API "+version);_.each(modules,function(versionModule){var moduleRoutes=versionModule.routes;_.each(moduleRoutes,function(route){setNativeRoute(route,true,version)})})})}_.each(APP_MODULES,function(module){if(__DEBUG)logger.log("[Routes] Creating routes for Application");var moduleRoutes=module.routes;_.each(moduleRoutes,function(route){setNativeRoute(route)})})};var setNativeRoute=function(route,api,apiVersion){api=api||false;apiVersion=apiVersion||process.env.DEFAULT_API_VERSION;if(api&&!apiVersion){throw new Error("[Routes] Unable to dermine API version for route: "+JSON.stringify(route))}var routeExplicitPath,routeShortcutPath;if(api){var apiPath="/api";routeExplicitPath=apiPath+"/"+apiVersion;routeShortcutPath=apiVersion==defaultApiVersion?apiPath:null}else{routeExplicitPath=""}var routePath=(route.path.indexOf("/")==0?"":"/")+route.path;routeExplicitPath+=routePath;if(routeShortcutPath)routeShortcutPath+=routePath;switch(route.method.toUpperCase()){case"GET":if(__DEBUG)logger.log("[Routes] -> Set route: [GET] -> '"+routeExplicitPath+"'"+(routeShortcutPath?" [Default]: '"+routeShortcutPath+"'":""));Application.get(routeExplicitPath,route.fn);if(routeShortcutPath)Application.get(routeShortcutPath,route.fn);break;case"POST":if(__DEBUG)logger.log("[Routes] -> Set route: [POST] -> '"+routeExplicitPath+"'"+(routeShortcutPath?" [Default]: '"+routeShortcutPath+"'":""));Application.post(routeExplicitPath,route.fn);if(routeShortcutPath)Application.post(routeShortcutPath,route.fn);break;case"PUT":if(__DEBUG)logger.log("[Routes] -> Set route: [PUT] -> '"+routeExplicitPath+"'"+(routeShortcutPath?" [Default]: '"+routeShortcutPath+"'":""));Application.put(routeExplicitPath,route.fn);if(routeShortcutPath)Application.put(routeShortcutPath,route.fn);break;case"DELETE":if(__DEBUG)logger.log("[Routes] -> Set route: [DELETE] -> '"+routeExplicitPath+"'"+(routeShortcutPath?" [Default]: '"+routeShortcutPath+"'":""));Application.delete(routeExplicitPath,route.fn);if(routeShortcutPath)Application.delete(routeShortcutPath,route.fn);break;default:throw new Error("[Routes] -X Unable to bind HTTP method: "+route.method);break}};var loadAPPRoutes=function(callback){if(__DEBUG)logger.log("[Routes] Load Application Routes files...");if(!__APPDirectoryExists(__routesBaseDir)){throw new Error("[Routes] Unable to find routes base directory: "+__routesBaseDir)}__loadModulesRecursively(__routesBaseDir,{except:[__apiBaseDir]},function(err,modules){if(err){return callback(err)}APP_MODULES=modules;return callback()})};var loadAPIRoutes=function(callback){if(__DEBUG)logger.log("[Routes] Load API Routes files...");var nbVersions=apiVersions.length;_.each(apiVersions,function(version){if(!__APIVersionDirectoryExists(version)){throw new Error("[Routes] Unable to find API Version: "+version)}loadAPIVersionRoutes(version,function(err){if(err){throw new Error("[Routes] Unable to load modules for API version: "+version+"! Error: "+err)}if(!--nbVersions)callback()})},this)};var loadAPIVersionRoutes=function(apiVersion,callback){var __versionBaseDir=__apiBaseDir+"/"+apiVersion;__loadModulesRecursively(__versionBaseDir,{},function(err,versionModules){if(err){return callback(err)}API_MODULES[apiVersion]=versionModules;return callback()})};var __loadModulesRecursively=function(baseDir,params,callback){params=params||{};params.except=params.except||[];var modules=[];fs.readdir(baseDir,function(err,entries){if(err)return callback(err);var nbEntries=entries.length;if(!nbEntries)return callback(null,modules);_.each(entries,function(entry){var entryPath=baseDir+"/"+entry;fs.stat(entryPath,function(err,stat){if(stat&&stat.isDirectory()){if(!_.find(params.except,function(except){return entryPath==except})){__loadModulesRecursively(entryPath,params.except,function(err,res){modules=modules.concat(res);if(!--nbEntries)callback(null,modules)})}else{if(!--nbEntries)callback(null,modules)}}else{var fileExt=path.extname(path.basename(entryPath)).substring(1).toLowerCase();if(_.find(__allowedExts,function(ext){return fileExt==ext})){if(__DEBUG)logger.log("[Routes] -> Load file: "+entryPath);modules.push({name:entry.substring(0,entry.lastIndexOf(".")),routes:require(entryPath)})}if(!--nbEntries)callback(null,modules)}})})});return modules};var __APPDirectoryExists=function(appDir){try{stats=fs.lstatSync(appDir);if(!stats.isDirectory()){return false}}catch(e){return false}return true};var __APIDirectoryExists=function(apiDir){try{stats=fs.lstatSync(apiDir);if(!stats.isDirectory()){return false}}catch(e){return false}return true};var __APIVersionDirectoryExists=function(apiVersion){try{stats=fs.lstatSync(__apiBaseDir+"/"+apiVersion);if(!stats.isDirectory()){return false}}catch(e){if(__DEBUG)logger.log("Error: "+e);return false}return true};var activateApi=function(){};var disableApi=function(){};var activateApiVersion=function(){};var disableApiVersion=function(){};var disableApiVersionMethod=function(){};var disableApiVersionMethod=function(){};return{initialize:initialize}});