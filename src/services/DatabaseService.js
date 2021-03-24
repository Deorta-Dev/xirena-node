let debug = process.argv.includes('--debug-database');


let GlobalConfig = {};

function getConnection(name) {
    let config = GlobalConfig[name] || GlobalConfig['default'];
    if (Array.isArray(config.connections) && config.connections.length > 2) {
        let connection = config.connections.shift();
        function backrest() {
            createConnection(name)
                .then(c => {
                    if (config.connections.length < 30)
                        createConnection(name).then(backrest);
                });
        }
        backrest();
        return connection;
    }
    return createConnection(name);

}

function createConnection(name) {
    return new Promise(resolve => {
        let config = GlobalConfig[name] || GlobalConfig['default'], connection;

        function ready(connection) {
            if (!Array.isArray(config.connections)) config.connections = [connection];
            else config.connections.push(connection);
            connection.c = name => {
                return createConnection(name);
            }
            resolve(connection);
        }

        switch (config.type) {
            case 'postgres':
                connection = createConnectionPostgres(config).then(ready);
                break;
            case 'mysql':
                connection = createConnectionMySql(config).then(ready);
                break;
            case 'mongodb':
                connection = createConnectionMongoDB(config).then(ready);
                break;
        }
    });
}

function createConnectionPostgres(config) {
    return new Promise((resolve, reject) => {
        if (config && config['connection'] === 'postgres') {
            let {user, host, database, password, port} = config;
            const {Pool} = require("pg");
            if (debug) console.log('\x1b[34m', 'Create new connection:' + config['database'] + ' | PostgreSQL', '\x1b[0m');
            let poolClient = new Pool({
                user: user,
                host: host,
                database: database,
                password: password,
                port: port | 5432,
            });
            poolClient.connect(function (err, client) {
                if (err) {
                    reject(err);
                    throw err;
                } else {
                    if (!config.firstConnect) {
                        console.log('\x1b[34m', 'Connect Database: ' + config['database'] + ' | PostgreSQL', '\x1b[0m');
                    }
                    config.firstConnect = true;
                    client.$finalize = function () {
                        client.end();
                    };
                    resolve(client);
                }
            });
        }
    });
}

function createConnectionMySql(config) {
    return new Promise((resolve, reject) => {
        if (config && config['connection'] === 'mysql') {
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
                let waitFirst = true;
                instantiate = async function (id) {
                    if (debug) console.log('\x1b[34m', 'Create new connection:' + config['database'] + '|Mysql', '\x1b[0m');
                    con.connect(function (err, client) {
                        if (err) {
                            reject(err);
                            throw err;
                        }
                        if (!config.firstConnect) {
                            console.log('\x1b[34m', 'Connect Database: ' + config['database'] + '|Mysql', '\x1b[0m');
                        }
                        config.firstConnect = true

                        con.$finalize = function () {
                            client.close();
                            this.$finalize = function () {
                            };
                        };
                        resolve(con);
                    });
                };
            }
        }
    });
}

function createConnectionMongoDB(config) {
    return new Promise((resolve, reject) => {
        if (config && config['connection'] === 'mongodb') {
            let MongoClient = require('mongodb').MongoClient;
            if (config['dns'] !== undefined) {
                if (debug) console.log('\x1b[34m', 'Create new connection:' + config['database'] + '|Mongodb', '\x1b[0m');
                MongoClient.connect(config['dns'], function (err, db) {
                    if (err) {
                        reject(err);
                        throw err;
                    } else {
                        if (!config.firstConnect) {
                            console.log('\x1b[34m', 'Connect Database: ' + config['database'] + '|Mongodb', '\x1b[0m');
                        }
                        config.firstConnect = true;
                        let instance = db.db(config['database']);
                        instance.$finalize = function () {
                            db.close();
                        };
                        resolve(instance);
                    }
                });
            }
        }
    });
}

module.exports = {
    database: {
        /**
         * @param kernel {Kernel}
         * @param application {Application}
         */
        build: (kernel, application) => {
            let configs = kernel.getConfig('database');
            if (!configs) return;
            if (!Array.isArray(configs)) configs = [configs];
            let connCount = 0, connReady = 0;
            return new Promise((resolve, reject) => {
                function ready() {
                    connReady++;
                    if (connReady >= connCount)
                        resolve();
                }

                if (!Array.isArray(configs)) configs = [configs];
                configs.forEach((config, key) => {
                    config.instances = config.instances || 30;
                    connCount += config.instances;
                    GlobalConfig[config.id || key + ''] = config;
                    if (GlobalConfig['default'] === undefined) GlobalConfig['default'] = config;
                    if (typeof instantiate === 'function') {
                        for (let i = 0; i < config.instances; i++) {
                            instantiate(config.id || key + '');
                        }
                    }
                });

            });

        },
        instance: () => {
            return getConnection('default');
        }
    }
};