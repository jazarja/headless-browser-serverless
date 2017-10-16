'use strict';

const binaryPack = require('./libs/bootstrap/nightmare-lambda-pack');
const Xvfb = require('./libs/bootstrap/xvfb');
const {NodeVM} = require('vm2');
const isOnLambda = binaryPack.isRunningOnLambdaEnvironment;
const electronPath = binaryPack.installNightmareOnLambdaEnvironment();
const TIMEOUT = 60000;

module.exports.execute = (event, context, callback) => {
    console.log("Event", JSON.stringify(event));

    let body = JSON.parse(event.body);

    const xvfb = new Xvfb({
        xvfb_executable: '/tmp/pck/Xvfb',  // Xvfb executable will be at this path when unpacked from nigthmare-lambda-pack
        dry_run: !isOnLambda         // in local environment execute callback of .start() without actual execution of Xvfb (for running in dev environment)
    });

    xvfb.start((err, xvfbProcess) => {

        if (err) {
            console.error("General error", err);
            callback(err);
        }

        function done(err, result) {
            xvfb.stop((err) => {
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
                            error: error,
                            status: "error",
                        }),
                    };

                    callback(null, response);
                }
            });
        }

        const runScript = function (script) {
            const SCRIPT_INIT =
                'let Promise = global.library.Promise;' +
                'let Nightmare = global.library.Nightmare;' +
                'let $l = global.library;' +
                'let _ = global.library._;' +
                'let moment = global.library.moment;' +
                'let numeral = global.library.numeral;' +

                'const nightmare = Nightmare(' +
                '{ ' +
                'show: true,' +
                'electronPath: "'+electronPath+'" ' +
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
                        "Promise" : require('bluebird'),
                        "Nightmare" : require('nightmare')
                    }
                },
                'wrapper' : 'none', // Retrieve value that returned by script
                "timeout": TIMEOUT
            });


            try {
                let fullScript =
                    SCRIPT_INIT+
                    script;

                console.log("Full script", fullScript);

               vm.run(fullScript)
                    .then(function (result) {
                        console.log("Execution result",result);
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
    });
};
