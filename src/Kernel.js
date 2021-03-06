const path = require('path');
const fs = require('fs');
const reflection = require('./Reflection');
const Application = require('./Application');
const express = require('express');
const app = express();
let io;
const net = require('net');
let ip = require('ip');
let appScope = {};
const Base64 = require('base64-min');
let CookieParser = require('cookie-parser');


class Kernel {
    constructor() {
        this._annotations = {};
        this._listeners = [];
        this._routers = [];
        this._servicesConfig = undefined;
        this._globalConfig = undefined;
        this._application = new Application();
        this._config = {};
        this._projectDir = "";
        this._services = {};
        this._buildReady = false;
        this._readyFns = [];
        global.$$Kernel = this;

        global.isDebug = process.argv.includes('--debug');
        require('./GlobalFunctions');

    }

    build() {
        if (isDebug)
            console.log("\x1b[31m***** MODE DEBUG ACTIVE *****", "\x1b[0m");
        let config = this.globalConfig;
        let $this = this;
        let explorer;

        function getFilesDirectory(directory, origDirectory) {
            directory = directory.replace(/\\\\/, '\\\\');
            while(directory.endsWith("\\"))directory = directory.slice(0,-1);
            origDirectory = origDirectory || directory;
            let result = [];
            let files = fs.readdirSync(directory, {withFileTypes: true});
            let javascriptER = /.*\.js$/;
            files.forEach(function (file) {
                if (file.isDirectory()) {
                    let directoryPath = path.join(directory, file.name + "\\");
                    let subResult = getFilesDirectory(directoryPath, origDirectory);
                    subResult.forEach(sub => result.push(sub))
                } else {
                    if (javascriptER.test(file.name)) {
                        file.absolute = path.join(directory, file.name);
                        file.relative = file.absolute.replace(origDirectory, '');
                        result.push(file);
                    }
                }
            });
            return result;
        }


        /**
         * Build Annotations
         */
        console.log(` Loading Annotations`);

        if (explorer = config.annotations) {
            if (!Array.isArray(explorer)) explorer = [explorer];

            function importAnnotations(files) {
                files.forEach(file => {
                    if (file.relative.endsWith('Annotation.js')) {
                        let buildFile = function () {
                            let annotations = require(file.absolute);
                            let keys = Object.keys(annotations);
                            keys.forEach(key => $this.addAnnotations(key, annotations[key]));
                        }

                        if (isDebug)
                            fs.watchFile(file.absolute, () => {
                                console.log(` ${file.relative} File Changed Annotations`);
                                buildFile();
                            });
                        console.log(` --> ${file.relative}`);
                        buildFile();
                    }
                });
            }

            explorer.forEach(exp => {
                if (!Array.isArray(exp)) {
                    if (exp['mapping'] === 'auto') {
                        let src = exp['src'];
                        let directoryPath = exp.absolute ? src : path.join(this._projectDir, src);
                        importAnnotations(getFilesDirectory(directoryPath));
                    }
                } else {
                    importAnnotations(exp.map(e => {
                        return {
                            relative: e,
                            absolute: path.join(this._projectDir, e)
                        }
                    }));
                }
            })

        }

        /**
         * Build Services
         */
        let servicesBuilds = [];
        let totalBuilds = 0;

        console.log(` Loading Services`);
        if (explorer = config.services) {
            if (!Array.isArray(explorer)) explorer = [explorer];

            function importServices(files) {
                files.forEach(file => {
                    if (file.relative.endsWith('Service.js')) {
                        let buildFunction = (rightAway) => {
                            let builds = [];
                            let services = require(file.absolute);
                            let keys = Object.keys(services);
                            keys.forEach(key => {
                                builds.push(function () {
                                    $this.addService(key, services[key]);
                                    return services[key].build($this, $this.application);
                                });
                            });
                            builds.forEach(b => {
                                if (typeof b === 'function')
                                    if (rightAway) b();
                                    else {
                                        servicesBuilds.push(b);
                                        totalBuilds++;
                                    }
                            });
                        }
                        if (isDebug)
                            fs.watchFile(file.absolute, (curr, prev) => {
                                console.log(`${file.relative} File Changed Services`);
                                buildFunction(true);
                            });
                        buildFunction(false);
                        console.log(` --> ${file.relative}`);
                    }

                });
            }

            explorer.forEach(exp => {
                if (!Array.isArray(exp)) {
                    if (exp['mapping'] === 'auto') {
                        let src = exp['src'];
                        let directoryPath = exp.absolute ? src : path.join(this._projectDir, src);
                        importServices(getFilesDirectory(directoryPath));
                    }
                } else {
                    importServices(exp.map(e => {
                        return {
                            relative: e,
                            absolute: path.join(this._projectDir, e)
                        }
                    }));
                }
            })
        }


        /**
         * Build Controllers
         */
        let controllerBuilds = [];
        console.log(` Loading Controllers`);
        if (config['controllers'] !== undefined) {
            if (config['controllers']['mapping'] === 'auto') {
                let src = config['controllers']['src'];
                let directoryPath = path.join(this._projectDir, src);
                let files = getFilesDirectory(directoryPath);
                let $this = this;
                files.forEach(function (file) {
                    if (file.relative.endsWith('Controller.js')) {
                        let buildFile = function () {
                            console.log(` --> ${file.relative}`);
                            let classController = require(file.absolute);
                            let annotations = reflection.getClassAnnotations(classController, $this.annotations);
                            if (typeof classController === 'function') {
                                let controller = new classController($this);
                                controller.kernel = $this;
                                annotations.forEach(annotation => {
                                    let evalString = "$this.annotations." + annotation.annotation.slice(1);
                                    let abstractAnnotation = eval(evalString);
                                    abstractAnnotation.fn = controller[annotation.fn];
                                    abstractAnnotation.ctrl = controller;
                                    abstractAnnotation.args = annotation.args;
                                    abstractAnnotation.kernel = $this;
                                    abstractAnnotation.build();
                                });
                            }
                        }
                        if (isDebug)
                            fs.watchFile(file.absolute, (curr, prev) => {
                                console.log(`${file.absolute} File Changed Controller`);
                                buildFile();
                            });
                        controllerBuilds.push(buildFile);
                    }
                });
            }
        }
        console.log(' Build Services');

        let buildServicesReady = 0;

        function controllersBuildFn() {
            if (buildServicesReady >= totalBuilds) {
                console.log(' Build Controllers');
                controllerBuilds.forEach(build => build());
                $this._buildReady = true;
            }
        }

        servicesBuilds.forEach(build => {
            let $return = build();
            if ($return instanceof Promise) {
                $return.then(e => {
                    buildServicesReady++;
                    controllersBuildFn();
                }).catch(e => {
                    console.error(e);
                    process.kill(process.pid);
                });
            } else {
                buildServicesReady++;
                controllersBuildFn();
            }
        });
        //this.startListeners();
    }

    startListeners() {
        let kernel = this;

        io.on('connection', socket => {
            let $socket = socket;
            let $c = {};

            kernel.listeners.forEach(listener => {
                if (listener.name === '$connection') {
                    listener.fn($socket, {}, $c, appScope);
                }
            });

            kernel.listeners.forEach((listener) => {
                if (listener.name !== '$disconnect' && listener.name !== '$connection')
                    socket.on(listener.name, function (data) {
                        if (data !== '' && data !== undefined && data !== null && typeof data === 'string') data = JSON.parse(decodeURIComponent(escape(atob(data))));
                        if (eval(listener.condition)) listener.fn($socket, data, $c, appScope);
                    });
            });

            socket.on('disconnect', function () {
                kernel.listeners.forEach((listener) => {
                    if (listener.name === '$disconnect') listener.fn($socket, {}, $c, appScope);
                });
            });
        });
    }


    startApplication(fn) {
        let config = this.globalConfig;
        app.use(express.json({type: '*/*'}));
        let publicDir = this._projectDir + '/public';
        if(config.public){
            publicDir = path.join( this._projectDir , config.public);
        }
        console.log(" Using for public directory ->", publicDir);
        app.use(express.static(publicDir));
        let appPort = config['app_port'];
        let ssl = config['ssl'];
        if (ssl) {
            let options = {key: fs.readFileSync(ssl.key), cert: fs.readFileSync(ssl.cert)};
            let server = require('https').createServer(options, app);
            io = require('socket.io')(server);
            server.listen(appPort, () => {
                console.log("\x1b[32m", '');
                console.log(' +----------------------------------------------------------+');
                let string = ' | Listening on ' + ip.address() + ':' + appPort + ' with SSL';
                while (string.length < 60) string += ' ';
                string += '|';
                console.log(string);
                console.log(' +----------------------------------------------------------+\n');
                console.log("\x1b[0m", '');
                if(typeof fn === 'function') fn();
            });
        } else {
            let options = {};
            let server = require('http').createServer(options, app);
            io = require('socket.io')(server);
            server.listen(appPort, () => {
                console.log("\x1b[32m", '');
                console.log(' +------------------------------------------------+');
                let string = ' | Listening on ' + ip.address() + ':' + appPort;
                while (string.length < 50) string += ' ';
                string += '|';
                console.log(string);
                console.log(' +------------------------------------------------+\n');
                console.log("\x1b[0m", '');
                if(typeof fn === 'function') fn();
            });
        }
    }


    onReady(fn) {
        this._readyFns.push(fn);
    }

    start() {
        let $this = this;

        function runStart() {
            if ($this._buildReady) {
                $this.startApplication(function (){
                    $this.startListeners();
                    $this._readyFns.forEach(fn => {
                        if (typeof fn === 'function')
                            fn($this);
                    });
                });
            } else setTimeout(runStart, 100);
        }

        runStart();
    }

    addListener(listener, fn, condition) {
        condition = condition.replace(/\@/, '$c.');
        this.listeners.push({name: listener, fn: fn, condition: condition});
    }

    addRoute(router, method, fn, options) {
        method = method.toUpperCase();
        if (!router.startsWith('/')) router = '/' + router;
        this._routers.push({
            route: router,
            method: method,
            fn: fn,
            options: options
        });
        let fnx = function (request, response) {
            fn(request, response, appScope);
        };
        switch (method) {
            case "GET" :
                app.get(router, fnx);
                break;
            case "POST" :
                app.post(router, fnx);
                break;
            case "PUT" :
                app.put(router, fnx);
                break;
            case "DELETE" :
                app.delete(router, fnx);
                break;
        }
    }

    get annotations() {
        return this._annotations;
    }

    set annotations(value) {
        this._annotations = value;
    }

    addAnnotations(value, fn) {
        this._annotations[value] = fn;
    }


    get appScope() {
        return appScope;
    }

    getConfig(name) {
        if (this._config[name] === undefined) {
            let dir = this.configDir ? path.join(this.configDir, name + ".json") : path.join(this._projectDir, "config/" + name + ".json");
            if (fs.existsSync(dir)) {
                if (this._config === undefined) this._config = {};
                if (this._config[name] === undefined) this._config[name] = require(dir);
            }
        }
        return this._config[name];

    }

    get globalConfig() {
        if (this._globalConfig === undefined) {
            let name = 'config';
            let dir = this.configDir ? path.join(this.configDir, name + ".json") : path.join(this._projectDir, "config/" + name + ".json");
            if (fs.existsSync(dir)) {
                this._globalConfig = require(dir);
                let explorer;
                // Add intern services
                explorer = this._globalConfig.services;
                if (!explorer) explorer = {};
                if (!Array.isArray(explorer)) explorer = [explorer];
                explorer.push({
                    mapping: 'auto',
                    absolute: true,
                    src: path.join(__dirname, '/services')
                });
                this._globalConfig.services = explorer;

                // Add intern annotations
                explorer = this._globalConfig.annotations;
                if (!explorer) explorer = {};
                if (!Array.isArray(explorer)) explorer = [explorer];
                explorer.push({
                    mapping: 'auto',
                    absolute: true,
                    src: path.join(__dirname, '/annotations')
                });
                this._globalConfig.annotations = explorer;
            }
        }
        return this._globalConfig;
    }

    set globalConfig(value) {
        this._globalConfig = value;
    }

    set configDir(value) {
        this._configDir = value;
        return this;
    }

    get configDir() {
        return this._configDir;
    }

    set projectDir(value) {
        this._projectDir = value;
        return this;
    }

    get projectDir() {
        return this._projectDir;
    }

    get listeners() {
        return this._listeners;
    }

    set listeners(value) {
        this._listeners = value;
    }

    get routers() {
        return this._routers;
    }

    set routers(value) {
        this._routers = value;
    }

    get application() {
        return this._application;
    }

    set application(value) {
        this._application = value;
    }

    get expressApp() {
        return app;
    }

    get expressIO() {
        return io;
    }

    addService(value, object) {
        this._services[value] = object;
    }

    get services() {
        return this._services;
    }

    set services(value) {
        this._services = value;
    }

}


module.exports = Kernel;