let databaseInstance = undefined;
let instances = {};

function addInstance(instance, id) {
    instance.c = name => {
        return instances[name];
    }
    instances[id] = instance;
    if (databaseInstance === undefined) {
        databaseInstance = instances;
        instances['default'] = instance;
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
                    if (config && config['connection'] === 'mongodb') {
                        const MongoClient = require('mongodb').MongoClient;
                        if (config['dns'] !== undefined) {
                            MongoClient.connect(config['dns'], function (err, db) {
                                if (err) {
                                    reject(err);
                                    throw err;
                                } else {
                                    addInstance(db.db(config['database']), config.id || key + '');
                                    console.log('\x1b[34m', 'Connect Database: ' + config['database'] + ': Mongodb', '\x1b[0m');
                                    ready();
                                }
                            });
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
                        addInstance(poolClient, config.id || key + '');
                        console.log('\x1b[34m', 'Connect Database: ' + config['database'] + ': Postgres', '\x1b[0m');
                        ready();

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
                            con.connect(function (err) {
                                if (err) throw err;
                                addInstance(con, config.id || key + '');
                                console.log('\x1b[34m', 'Connect Database: ' + config['database'] + ': Mysql', '\x1b[0m');
                                ready();
                            });
                        }
                    } else {
                        console.log('\x1b[34m', 'No Connect Database | ' + config['connection']);
                        ready();
                    }
                });

            });

        },
        instance: () => {
            return databaseInstance;
        },
        finalize: () => {
        }
    }
};