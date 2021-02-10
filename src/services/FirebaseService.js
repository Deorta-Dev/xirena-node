const firebaseAdmin = require('firebase-admin');
let firebaseApp = null;
module.exports = {
    "firebase":{
        /**
         *
         * @param kernel {Kernel}
         * @param application {Application}
         */
        build: (kernel, application)=>{
            const config = kernel.getConfig('firebase');
            if(config){
                firebaseApp = firebaseAdmin.initializeApp({
                    credential: firebaseAdmin.credential.cert(config),
                    databaseURL: "https://" + config["project_id"] + ".firebaseio.com"
                });
                console.log();
                console.log('\x1b[34m','Connect Firebase Project: '+config["project_id"], '\x1b[0m');
            }
        },
        instance: () =>{
            return { admin : firebaseAdmin, app: firebaseApp }
        }
    }
};