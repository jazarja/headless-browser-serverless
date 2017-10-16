/**
 * This package allows using Nightmare with Electron on AWS Lambda.
 *
 * Package was inspired by the approach taken by:
 * https://github.com/justengland/phantomjs-lambda-pack/
 *
 *
 * https://github.com/justengland/phantomjs-lambda-pack/blob/master/index.js
 */

// var debug = require('debug')('nightmare-lambda-pack');
var child_process = require('child_process');

var pack = exports = module.exports = {};


var SECOND = 1000; // millis

var config = {
    tmpdir: '/tmp',
    zipPath: 'phantomjs' // path to electron executable within the path
};

pack.isRunningOnLambdaEnvironment = Boolean(process.env['AWS_LAMBDA_FUNCTION_NAME']);

/**
 * Downloads file to temp dir
 * @return full path to downloaded file
 */
pack._downloadFileSync = function (url, destFilename) {
    notEmpty(url, 'url parameter cannot be empty');
    notEmpty(destFilename, 'destFilename parameter cannot be empty');

    var destFilepath = `${config.tmpdir}/${destFilename}`;
    child_process.execFileSync('curl', ['--silent', '--show-error', '-L', '-o', destFilepath, url], {
        encoding: 'utf-8'
    });

    return destFilepath;

};


/**
 * Copy contents of srcDir into existing targetDir
 * @srcDir eg. '/var/task'  ("/*" will be added automatically )
 * @targetDir eg. '/tmp/app'
 */
pack._copySync = function(srcDir, targetDir){
    child_process.execSync(`cp -r ${srcDir}/* ${targetDir}`);
}

pack._chmod = function(permission, target){
    child_process.execSync(`chmod ${permission} ${target}`);
}

pack._df = function(){
    var stdout = child_process.execSync('df -h');
    return stdout.toString();
};

pack._mkdirSync = function (dirName) {
    child_process.execSync(`mkdir -p ${dirName}`);
}

pack._unzipFileSync = function (zipFile, destFolder) {
    // how to run syn
    child_process.execSync(`unzip -o ${zipFile} -d ${destFolder}`, { timeout: 60 * SECOND });
};


pack._walkSync = function(currentDirPath, callback, excluded_files) {
    excluded_files = excluded_files || [];
    var fs = require('fs'),
        path = require('path');
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile()) {
            callback(filePath, stat);
        } else if (stat.isDirectory() && (excluded_files.indexOf(name) < 0) )  {
            pack._walkSync(filePath, callback, excluded_files);
        }
    });
}


/*
 * This is synchronous
 * @opts.electronPackageUrl url to the electron package zip.
 * @return electron path
 */
pack.installPhantom = function (opts) {

    var zipFile, zipPath;

    opts = opts || {};

    zipPath = opts.zipPath || config.zipPath;

    //zipFile = pack._downloadFileSync(url, `pck.zip`);

    zipFile = process.env.LAMBDA_TASK_ROOT+"/libs/phantomjs.zip";

    pack._unzipFileSync(zipFile, '/tmp');

    pack._chmod(777, `/tmp/${zipPath}`);

    return `/tmp/${zipPath}`;
};


pack.installPhantomOnLambdaEnvironment = function(opts){
    if ( !pack.isRunningOnLambdaEnvironment ) return;

    return pack.installPhantom(opts);

};


function notEmpty(argValue, msg) {
    if (!argValue) throw new Error(msg);
}