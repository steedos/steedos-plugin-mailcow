var server = require('@steedos/meteor-bundle-runner');
var steedos = require('@steedos/core')
var express = require('express');
var app = express();
const init = require('./index').init
declare var WebApp;
server.Fiber(function () {
    try {
        server.Profile.run("Server startup", function () {
            server.loadServerBundles();
            init({ app });
            WebApp.connectHandlers.use(app);
            steedos.init();
            server.callStartupHooks();
            server.runMain();
        })
    } catch (error) {
       console.error(error.stack)
    }
}).run()
