'use strict';

const binaryPack = require('./libs/bootstrap/phantomjs-lambda-pack');
const {NodeVM} = require('vm2');
const isOnLambda = binaryPack.isRunningOnLambdaEnvironment;
const phantomPath = binaryPack.installPhantomOnLambdaEnvironment();
const TIMEOUT = 60000;

module.exports.execute = (event, context, callback) => {
    console.log("Event", JSON.stringify(event));

    let body = JSON.parse(event.body);

    function done(err, result) {
        if (!err) {
            const response = {
                statusCode: 200,
                body: JSON.stringify({
                    result: result,
                    status: "success",
                }),
            };

            callback(null, response);
        } else {
            const response = {
                statusCode: 200,
                body: JSON.stringify({
                    error: err.message,
                    status: "error",
                }),
            };

            callback(null, response);
        }
    }

    const runScript = function (script) {
        const SCRIPT_INIT =
            'let Promise = global.library.Promise;' +
            'let Horseman = global.library.Horseman;' +
            'let $l = global.library;' +
            'let _ = global.library._;' +
            'let moment = global.library.moment;' +
            'let numeral = global.library.numeral;' +

            'const horseman = new Horseman(' +
            '{ ' +
                'phantomPath: "' + phantomPath + '" ' +
            '});'
        ;

        const vm = new NodeVM({
            "console": 'inherit',
            'require': {
                external: ['moment', 'numeral', 'lodash', 'string']
            },
            "sandbox": {
                "library": {
                    "moment": require('moment'),
                    "numeral": require('numeral'),
                    "_": require('lodash'),
                    "S": require('string'),
                    "Promise": require('bluebird'),
                    "Horseman": require('node-horseman')
                }
            },
            'wrapper': 'none', // Retrieve value that returned by script
            "timeout": TIMEOUT
        });

        try {
            let fullScript =
                SCRIPT_INIT +
                script;

            console.log("Full script", fullScript);

            vm.run(fullScript)
                .then(function (result) {
                    console.log("Execution result", result);
                    done(null, result);
                })
                .catch(function (error) {
                    console.error("Error", error);
                    done(error);
                });
        }
        catch (err) {
            console.log("Script execution error", err);
            done(err);
        }

    };


    runScript(body.script);


};
