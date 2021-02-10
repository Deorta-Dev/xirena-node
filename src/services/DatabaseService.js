let databaseInstance = null;
module.exports = {
    "database":{
        /**
         * @param kernel {Kernel}
         * @param application {Application}
         */
        build: (kernel, application)=>{
            const config = kernel.getConfig('database');
            return new Promise((resolve, reject) => {
                if(config && config['connection'] === 'mongodb'){
                    const MongoClient = require('mongodb').MongoClient;
                    if(config['dns'] !== undefined){
                        MongoClient.connect(config['dns'], function(err, db) {
                            if (err) {
                                reject(err);
                                throw err;
                            }else{
                                databaseInstance = db.db(config['database']);
                                console.log('\x1b[34m','Connect Database: '+config['database'], '\x1b[0m');
                                resolve(db);
                            }
                        });
                    }
                }
            });

        },
        instance: () => { return databaseInstance; },
        finalize: () => {}
    }
};