let queryable = require('queryable');


module.exports = {
    "queryable": {
        /**
         *
         * @param kernel {Kernel}
         * @param application {Application}
         */
        build: (kernel, application) => {
            let configs = kernel.getConfig('queryable');
            if(Array.isArray(configs)){
               for(let config of configs){

               }
            }
        },
        instance: () => {
            return function (dbName = 'default'){
                return queryable.open(dbName);
            }
        }
    }
};