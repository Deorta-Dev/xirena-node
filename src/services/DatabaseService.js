let debug = process.argv.includes('--debug-database');
let GlobalConfig = {};

function getConnection(name) {
    let config = GlobalConfig[name] || GlobalConfig['default'];
    if (Array.isArray(config.connections) && config.connections.length > 2) {
        let connection = config.connections.shift();

        function backrest() {
            if (config.connections.length < config.instances) {
                createConnection(name)
                    .then(c => createConnection(name).then(backrest));
            }
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

        switch (config.connection) {
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

                    if (!config.firstConnect || debug) {
                        console.log('\x1b[34m', 'Connect Database: ' + config['database'] + ' | PostgreSQL', '\x1b[0m');
                    }
                    config.firstConnect = true;
                    client.$finalize = function () {
                        client.end();
                        if (Array.isArray(config.connections))
                            config.connections.forEach((con, i) => {
                                if (client === con) {
                                    config.connections.splice(i, 1);
                                }
                            })
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
                        if (!config.firstConnect || debug) {
                            console.log('\x1b[34m', 'Connect Database: ' + config['database'] + '|Mysql', '\x1b[0m');
                        }
                        config.firstConnect = true

                        con.$finalize = function () {
                            client.close();
                            if (Array.isArray(config.connections))
                                config.connections.forEach((con, i) => {
                                    if (client === con) {
                                        config.connections.splice(i, 1);
                                    }
                                });
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
                        if (!config.firstConnect || debug) {
                            console.log('\x1b[34m', 'Connect Database: ' + config['database'] + '|Mongodb', '\x1b[0m');
                        }
                        config.firstConnect = true;
                        let instance = db.db(config['database']);
                        instance.$finalize = function () {
                            db.close();
                            if (Array.isArray(config.connections))
                                config.connections.forEach((con, i) => {
                                    if (db === con) {
                                        config.connections.splice(i, 1);
                                    }
                                })
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