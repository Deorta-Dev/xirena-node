let instances = {};
let getInstance = undefined
function addInstance(instance, id) {
    instance.c = getInstance = name => {
        let instance = instances[name].shift();
        let l = instances[name].length - 20;
        for (let i = 0; i < l; i++)
            instance.$new();
        setTimeout(function (){
            if(typeof instance.$finalize === 'function')
                instance.$finalize();
        },60000);
        return instance;
    }
    if (!Array.isArray(instances[id])) instances[id] = [];
    instances[id].push(instance);
    if (instances['default'] === undefined) {
        instances['default'] = instances[id];
    }
}

module.exports = {
    "database": {
        /**
         * @param kernel {Kernel}
         * @param application {Application}
         */
        build: (kernel, application) => {
            let configs = kernel.getConfig('database');
            if (!configs) return;
            let connCount = 0, connReady = 0;
            return new Promise((resolve, reject) => {
                function ready() {
                    connReady++;
                    if (connReady >= connCount)
                        resolve();
                }

                if (!Array.isArray(configs)) configs = [configs];
                configs.forEach((config, key) => {
                    config.instances = config.instances || 20;
                    connCount += config.instances;
                    let instantiate;
                    if (config && config['connection'] === 'mongodb') {
                        let MongoClient = require('mongodb').MongoClient;
                        if (config['dns'] !== undefined) {
                            instantiate = function () {
                                MongoClient.connect(config['dns'], function (err, db) {
                                    if (err) {
                                        reject(err);
                                        throw err;
                                    } else {
                                        let instance = db.db(config['database']);
                                        instance.$new = instantiate;
                                        instance.$finalize = function (){
                                            db.close();
                                            this.$finalize = undefined;
                                        };
                                        addInstance(instance, config.id || key + '');
                                        console.log('\x1b[34m', 'Connect Database: ' + config['database'] + ': Mongodb', '\x1b[0m');
                                        ready();
                                    }
                                });
                            }
                        }
                    } else if (config && config['connection'] === 'postgres') {
                        let {user, host, database, password, port} = config;
                        const {Pool} = require("pg");
                        let poolClient = new Pool({
                            user: user,
                            host: host,
                            database: database,
                            password: password,
                            port: port | 5432,
                        });
                        instantiate = function () {
                            poolClient.connect((err, pgClient) => {
                                if (err) throw err;
                                pgClient.$new = instantiate;
                                pgClient.$finalize = function (){
                                    pgClient.end();
                                    this.$finalize = undefined;
                                };
                                addInstance(pgClient, config.id || key + '');
                                console.log('\x1b[34m', 'Connect Database: ' + config['database'] + ': Postgres', '\x1b[0m');
                                ready();
                            });
                        }
                    } else if (config && config['connection'] === 'mysql') {
                        let {user, host, database, password, port} = config;
                        if (user && host && database && password) {
                            let mysql = require('mysql');
                            let con = mysql.createConnection({
                                host: host,
                                user: user,
                                password: password,
                                database: database,
                                port: port || 3306
                            });
                            instantiate = function () {
                                con.connect(function (err, client) {
                                    if (err) throw err;
                                    con.$new = instantiate;
                                    con.$finalize = function (){
                                        client.close();
                                        this.$finalize = undefined;
                                    };
                                    addInstance(con, config.id || key + '');
                                    console.log('\x1b[34m', 'Connect Database: ' + config['database'] + ': Mysql', '\x1b[0m');
                                    ready();
                                });
                            };
                        }
                    } else {
                        console.log('\x1b[34m', 'No Connect Database | ' + config['connection']);
                        ready();
                    }
                    if (typeof instantiate === 'function') {
                        for (let i = 0; i < config.instances; i++) {
                            instantiate();
                        }
                    }
                });

            });

        },
        instance: () => {
            return getInstance('default');
        }
    }
};