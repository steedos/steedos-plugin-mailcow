var server = require('@steedos/meteor-bundle-runner');
var objectql = require("@steedos/objectql")
var path = require('path');
server.Fiber(function () {
    server.Profile.run("Server startup", function () {
        server.loadServerBundles();
        try {
            var steedosSchema = objectql.getSteedosSchema()
            steedosSchema.addDataSource('mailcow', {
                driver: "mysql",
                host: "127.0.0.1",
                port: 13306,
                username: "mailcow",
                password: "kSwR8tkHWwPYaMpv06faAw6rNYBP",
                database: "mailcow",
                objectFiles: [path.resolve(__dirname, "./src")],
                appFiles: [path.resolve(__dirname, "./src")]
            });
            steedosSchema.getDataSource('mailcow').init();
        } catch (error) {
            console.log(error)
        }
        server.callStartupHooks();
        server.runMain();
    });
}).run();