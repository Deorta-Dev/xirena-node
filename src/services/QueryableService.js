let queryable = require('queryable');
let collections = {};
function getCollection(name){
    if(collections[name]) return collections[name];
    else{
        return collections[name] =  queryable.open(name);
    }
}
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
                return getCollection(dbName);
            }
        }
    }
};