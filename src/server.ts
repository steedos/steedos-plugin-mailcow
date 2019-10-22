var server = require('@steedos/meteor-bundle-runner');
var steedos = require('@steedos/core')
var express = require('express');
import unread from './message';
var app = express();
console.log('unread', unread)
app.use(unread);
declare var WebApp;
server.Fiber(function () {
    try {
        server.Profile.run("Server startup", function () {
            server.loadServerBundles();
            WebApp.connectHandlers.use(app);
            steedos.init();
            server.callStartupHooks();
            server.runMain();
        })
    } catch (error) {
       console.error(error.stack)
    }
}).run()
