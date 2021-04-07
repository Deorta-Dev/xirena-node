let debug = process.argv.includes('--debug-database');
let GlobalConfig = {};

function getConnection(name) {
    let config = GlobalConfig[name] || GlobalConfig['default'];

    function prepare(connection) {
        if (config.timeLife)
            setTimeout(() => connection.$finalize(), config.timeLife);
        return connection;
    }

    if (Array.isArray(config.connections) && config.connections.length > 1) {
        let connection = config.connections.shift();
        createConnection(name);
        return prepare(connection);
    }else{
        return new Promise(resolve => {
            createConnection(name).then(connection => resolve(prepare(connection)));
        });
    }

}

function createConnection(name) {
    return new Promise(resolve => {
        let config = GlobalConfig[name] || GlobalConfig['default'];
        let waiting = true;

        function ready(connection) {
            connection.c = name => {
                return createConnection(name);
            }
            config.connections.push(connection);
            waiting = false;
            resolve(connection);
        }

        setTimeout(() => {
            if (waiting) {
                if (config.connections.length > 0) {
                    let con = config.connections.shift();
                    if (debug)
                        console.log(new Date(), "Return previous connection");
                    if (con) ready(con);
                } else {
                    console.error(new Date(), 'There are no more connections');
                }

            }

        }, 500);

        switch (config.connection) {
            case 'postgres':
                createConnectionPostgres(config).then(ready);
                break;
            case 'mysql':
                createConnectionMySql(config).then(ready);
                break;
            case 'mongodb':
                createConnectionMongoDB(config).then(ready);
                break;
        }

    });
}

function createConnectionPostgres(config) {
    return new Promise((resolve, reject) => {
        if (config && config['connection'] === 'postgres') {
            let {user, host, database, password, port, instannces} = config;
            const {Pool} = require("pg");
            if (debug) console.log(new Date(), '\x1b[34m', 'Create new connection:' + config['database'] + ' | PostgreSQL', '\x1b[0m');
            if (config.client === undefined) {
                config.client = new Pool({
                    user: user,
                    host: host,
                    database: database,
                    password: password,
                    port: port | 5432,
                    max: 80,
                });
            }
            config.client.connect(function (err, connection) {
                if (err) {
                    if (config.connections.length > 0) {
                        resolve(config.connections.shift());
                    } else {
                        reject(err);
                        throw 'The connection to the database could not be established';
                    }

                } else {

                    if (!config.firstConnect || debug) {
                        console.log('\x1b[34m', 'Connect Database: ' + config['database'] + ' | PostgreSQL', '\x1b[0m');
                    }
                    config.firstConnect = true;
                    connection.$finalize = function () {
                        if (connection.isFinalied) return;
                        connection.release();
                        if (Array.isArray(config.connections))
                            config.connections.forEach((con, i) => {
                                if (connection === con) {
                                    config.connections.splice(i, 1);
                                }
                            })
                        connection.isFinalied = true;
                    };
                    resolve(connection);
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
                if (config.client === undefined) {
                    config.client = mysql.createConnection({
                        host: host,
                        user: user,
                        password: password,
                        database: database,
                        port: port || 3306
                    });
                }
                if (debug) console.log(new Date(), '\x1b[34m', 'Create new connection:' + config['database'] + '|Mysql', '\x1b[0m');
                config.client.connect(function (err, connection) {
                    if (err) {
                        reject(err);
                        throw err;
                    }
                    if (!config.firstConnect || debug) {
                        console.log('\x1b[34m', 'Connect Database: ' + config['database'] + '|Mysql', '\x1b[0m');
                    }
                    config.firstConnect = true

                    connection.$finalize = function () {
                        connection.close();
                        if (Array.isArray(config.connections))
                            config.connections.forEach((con, i) => {
                                if (connection === con) {
                                    config.connections.splice(i, 1);
                                }
                            });
                    };
                    resolve(connection);
                });
            }
        }
    });
}

function createConnectionMongoDB(config) {
    return new Promise((resolve, reject) => {
        if (config && config['connection'] === 'mongodb') {
            let MongoClient = require('mongodb').MongoClient;
            if (config['dns'] !== undefined) {
                if (debug) console.log(new Date(), '\x1b[34m', 'Create new connection:' + config['database'] + '|Mongodb', '\x1b[0m');
                MongoClient.connect(config['dns'], function (err, db) {
                    if (err) {
                        reject(err);
                        throw err;
                    } else {
                        if (!config.firstConnect || debug) {
                            console.log('\x1b[34m', 'Connect Database: ' + config['database'] + '|Mongodb', '\x1b[0m');
                        }
                        config.firstConnect = true;
                        let connection = db.db(config['database']);
                        connection.$finalize = function () {
                            db.close();
                            if (Array.isArray(config.connections))
                                config.connections.forEach((con, i) => {
                                    if (connection === con) {
                                        config.connections.splice(i, 1);
                                    }
                                })
                        };
                        resolve(connection);
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
                if (!Array.isArray(configs)) configs = [configs];

                function ready() {
                    connReady++;
                    if (connReady >= connCount) {
                        console.log("Database Service Ready")
                        resolve();
                    }
                }

                for (let key in configs) {
                    let config = configs[key];
                    if (config && typeof config != 'function') {
                        config.instances = config.instances || 30;
                        config.connections = [];
                        GlobalConfig[config.id || key + ''] = config;
                        if (GlobalConfig['default'] === undefined) GlobalConfig['default'] = config;
                        for (let i = 0; i < config.instances; i++) {
                            connCount += 1;
                            createConnection(config.id || key + '').then(ready);
                        }
                    }

                }
            });

        },
        instance: () => {
            return getConnection('default');
        }
    }
};