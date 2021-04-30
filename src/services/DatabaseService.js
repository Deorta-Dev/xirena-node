let debug = process.argv.includes('--debug-database');
let GlobalConfig = {};



function getConnection(name) {
    let config = GlobalConfig[name] || GlobalConfig['default'];

    function prepare(connection) {
        if (config.timeLife)
            setTimeout(() => connection.$finalize(), config.timeLife);
        return connection;
    }

    let now = new Date();

    if (Array.isArray(config.connectionsList) && config.connectionsList.length > 0) {
        let connection = config.connectionsList.shift();
        createConnection(name);

        return new Promise(resolve => {
            resolve(prepare(connection));
        });
    } else {
        return new Promise(resolve => {
            for (let i = 0; i < config.instances * 0.25; i++) {
                createConnection(name);
            }
            createConnection(name, false).then(connection => {
                resolve(prepare(connection));
            });
        });
    }

}

function createConnection(name, save = true) {
    return new Promise(resolve => {
        let config = GlobalConfig[name] || GlobalConfig['default'], connection;

        function ready(connection) {
            if (save) {
                if (!Array.isArray(config.connectionsList)) config.connectionsList = [connection];
                else config.connectionsList.push(connection);
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
            if (config.clientsList.length < config.clients) {
                while (config.clientsList.length < config.clients) {
                    let c = new Pool({
                        user: user,
                        host: host,
                        database: database,
                        password: password,
                        port: port | 5432,
                        max: config.max || 5
                    });
                    c.name = 'client-' + config.clientsList.length;
                    config.clientsList.push(c);
                }
            }
            let client = config.clientsList.shift();
            if (debug) console.log(new Date(), '\x1b[34mCreate new connection:' + config['database'] + ' | PostgreSQL:', client.name, '\x1b[0m', config.connectionsList.length);

            client.connect(function (err, connection) {
                if (err) {
                    function retry(resolveRetry) {
                        setTimeout(() => {
                            if (debug)
                                console.log('\x1b[31m', 'Reconnect Database: ' + config['database'] + ' | PostgreSQL', '\x1b[0m');
                            createConnectionPostgres(config).then(resolveRetry).catch(() => retry(resolveRetry));
                        }, 500);
                    }
                    retry(resolve);

                } else {

                    if (!config.firstConnect || debug) {
                        console.log('\x1b[34m', 'Connect Database: ' + config['database'] + ' | PostgreSQL', '\x1b[0m');
                    }

                    config.firstConnect = true;
                    connection.$finalize = function () {
                        try{
                            connection.release();
                            if (Array.isArray(config.connectionsList))
                                for(let [i, con] of config.connectionsList.entries()){
                                    if (connection === con) {
                                        config.connectionsList.splice(i, 1);
                                        break;
                                    }
                                }
                        }catch (e){}
                    };
                    resolve(connection);
                }
            });
            config.clientsList.push(client);
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
                if (debug) console.log('\x1b[34m', 'Create new connection:' + config['database'] + ' | Mysql', '\x1b[0m');
                config.client.connect(function (err, connection) {
                    if (err) {
                        reject(err);
                        throw err;
                    }
                    if (!config.firstConnect || debug) {
                        console.log('\x1b[34m', 'Connect Database: ' + config['database'] + ' | Mysql', '\x1b[0m');
                    }
                    config.firstConnect = true

                    connection.$finalize = function () {
                        connection.close();
                        if (Array.isArray(config.connectionsList))
                            config.connectionsList.forEach((con, i) => {
                                if (connection === con) {
                                    config.connectionsList.splice(i, 1);
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
            if (config['dns'] !== undefined) {
                if (debug) console.log('\x1b[34m', 'Create new connection:' + config['database'] + ' | Mongodb', '\x1b[0m');
                if (config.clientsList.length < config.clients) {
                    while (config.clientsList.length < config.clients) {
                        let c = new require('mongodb').MongoClient(config['dns'], {useUnifiedTopology: true});
                        c.name = 'client-' + config.clientsList.length;
                        config.clientsList.push(c);
                    }
                }
                let client = config.clientsList.shift();
                client.connect(function (err, db) {
                    if (err) {
                        function retry(resolveRetry) {
                            setTimeout(() => {
                                if (debug)
                                    console.log('\x1b[31m', 'Reconnect Database: ' + config['database'] + ' | Mongodb', '\x1b[0m');
                                createConnectionPostgres(config).then(resolveRetry).catch(() => retry(resolveRetry));
                            }, 500);
                        }
                    } else {
                        if (!config.firstConnect || debug) {
                            console.log('\x1b[34m', 'Connect Database: ' + config['database'] + ' | Mongodb', '\x1b[0m');
                        }
                        config.firstConnect = true;
                        let connection = db.db(config['database']);
                        connection.$finalize = function () {
                            db.close();
                            if (Array.isArray(config.connectionsList))
                                config.connectionsList.forEach((con, i) => {
                                    if (connection === con) {
                                        config.connectionsList.splice(i, 1);
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
                        console.log(" Database Service Ready")
                        resolve();
                    }
                }

                for (let key in configs) {
                    let config = configs[key];
                    if (config && typeof config != 'function') {
                        config.instances = config.instances || config.connections || 30;
                        config.clients = config.clients || 20;
                        config.connectionsList = [];
                        config.clientsList = [];

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
            let localConnections = [];

            function objectConnection(a, b) {
                let database = 'default', fn = undefined;
                if (b != undefined) {
                    database = a;
                    fn = b;
                } else {
                    if (typeof a === 'string') database = a;
                    else fn = a;
                }
                let promise = getConnection(database);
                return new Promise(resolve => {
                    promise.then(connection => {
                        localConnections.push(connection);
                        for (let functionName in connection) {
                            if(typeof connection[functionName] === 'function')
                                objectConnection[functionName] = () =>{ return Reflect.apply(connection[functionName], connection, arguments); }
                            else objectConnection[functionName] = connection[functionName];
                        }
                        if (typeof fn === 'function')
                            fn(connection);
                        resolve(connection);
                    });
                })
            }

            objectConnection.$finalize = function () {
                for(let connection of localConnections) connection.$$finalize();
            }
            return objectConnection;

        }
    }
};