/**
 * Created by nael on 08.08.16.
 */

/**
 *  TODO:
 *
 *      - check node version
 */


"use strict";



const path = require('path');
const shell = require('shelljs');

//const DIR = process.env.PWD;
const DIR = shell.pwd().toString();

const spawn = require('child_process').spawn;
var log4js = require('log4js');
var log = log4js.getLogger('Init on process ' + process.pid);
var fs = require('fs');
var jsonfile = require('jsonfile');
var file = 'init.json';

var services = jsonfile.readFileSync(file);
var watchr = require('watchr');


var witout_dependency = [];

for(let i = 0; i < services.microservice.length; i++) {
    let split = services.microservice[i].split("/");
    let _p = path.join(DIR, split.slice(0, split.length - 1).join('/'));

    if(!fs.existsSync(path.join(_p, "node_modules"))) {
        witout_dependency.push(_p);
    }

}
var path_count = witout_dependency.length;

var iterator = iterate();
if(!path_count) {
    start_micro_services();
    //   startClient();
}else{
    iterator.next();
}
function* iterate() {

    for(let i = 0; i < witout_dependency.length; i++) {
        yield install_dependency(witout_dependency[i], function (err, code) {
            path_count--;
            if(code === 0) {
                if(path_count === 0) {
                    log.info("All dependencies installed, ready to start processing");
                }else {
                    iterator.next();
                }
            }else if(code !== 0){
                log.error(`Error for ${witout_dependency[i]} -> code ${code} show log file!`);
                process.exit(1);
            }
        });// suspend ...
        // continues here if call next()
    }
}

function startClient() {
    let client = path.join(DIR, services.client);
    shell.cd(client);
    spawn("npm", ["run","dev"], {
        // file descriptors
        stdio: [process.stdin, process.stdout, process.stderr]
    });
    shell.cd(DIR);
}

function install_dependency (path, callback) {
    log.info(`Install modules for ${path}`);
    shell.cd(path);
    // var child = shell.exec('npm install &> log', {async:true});

    let child = spawn("npm", ["install"], {
        // file descriptors
        stdio: [process.stdin, process.stdout, process.stderr]
    });

    child.on("exit", function (code, signal) {
        log.info(`Process for path ${path} exit with code ${code}`);
        callback(null, code);
    });

    shell.cd(DIR);

}



function start_micro_services () {
    const processObject = {};
    const processMap = {};

    let remove_ipcs = shell.exec(`rm *.ipc`);


    log.info("Start micro services ...");
    for (let _path of services.microservice) {
        // ##########################################################################
        // init file
        let executeable = path.join(DIR, _path);
        // array from path
        let split = _path.split("/");
        // create watching path
        let watch = path.join(DIR, split.slice(0, split.length - 1).join('/'));


        // ##########################################################################
        // create new process
        let childProc = spawn("node", [executeable], { // nodemon
            // file descriptors
            stdio: [process.stdin, process.stdout, process.stderr]
        });

        log.info("Root process for " + split[1] + " start on pid:", childProc.pid);
        // ##########################################################################

        // -cut-



        processMap[watch] = {};
        processMap[watch].pid = childProc.pid;
        processMap[watch].executeable = executeable;

        const reload = function(path){
            // create array from string
            let newPath = path.split("/");
            // splice init file from path
            let _newPath = newPath.splice(0, newPath.length - 1).join("/");
            let _alt = path.split("/");
            _alt = _alt.splice(0, _alt.length - 2).join("/");
            let _pid = processMap[_newPath] ? processMap[_newPath].pid : (_newPath = _alt) && processMap[_alt].pid;
            if(_pid && processMap[_newPath]) {
                log.info(`Path ${_newPath} with root process ${processMap[_newPath].pid} change`);

                // ein prozess welches wegen einem syntax fehler nicht
                // gestartet ist, kann nicht gekillt werden, weil es nicht
                // mehr existiert

                // wenn der prozess das erste mal veraender wurde, befindet es sich noch
                // nicht in processObject, es darf beendet werden, da es mit sicher noch laeuft
                // es sei denn beim ersten start, ist schon ein fehler aufgetretten. TODO

                // Wenn der prozess nicht beendet wurde (code !== 1) kann er beendet werden

                if(!processObject[_newPath] || processObject[_newPath].exitCode !== 1) {
                    // kill process
                    process.kill(processMap[_newPath].pid);
                }

                // restart process
                let childProc = spawn("node", [processMap[_newPath].executeable], {  // can have error
                    stdio: [process.stdin, process.stdout, process.stderr]
                });
                // error handler

                processObject[_newPath] = childProc;

                processMap[_newPath].pid = "";

                // update process map
                processMap[_newPath].pid = childProc.pid;

            }
        };

        watchr.open(watch, function (changeType, path, currentStat, previousStat) {

            switch ( changeType ) {
                case 'update':
                    log.info('The file', path, 'was updated');
                    reload(path);
                    break;
                case 'create':
                    log.info('the file', path);
                    reload(path);
                    break;
                case 'delete':
                    console.log('the file', path, 'was deleted', previousStat);
                    break
            }

        }, function (err) {
            if ( err )  return console.log('watch failed on', path, 'with error', err);
            console.log('watch successful on', watch)
        });

    }

}
