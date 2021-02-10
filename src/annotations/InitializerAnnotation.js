const AbstractAnnotation = require('../AbstractAnnotation.js');
class InitializerAnnotation extends AbstractAnnotation{

    constructor() {
        super();
    }

    build() {
        let kernel = this.kernel;
        let args = this.args;
        let fn = this.fn;
        let ctrl = this.ctrl;
        function initializer(){
            let params = {};
            params['$kernel'] = kernel;
            params['$application'] = kernel.application;
            params['$appScope'] = kernel.appScope;
            let services = kernel.services;
            Object.keys(services).forEach( (key)=>{
                params['$' + key] = services[key].instance();
            });
            let dataParams = [];
            args.forEach((arg)=>{
                dataParams.push(params[arg]);
            });
            Reflect.apply(fn, ctrl, dataParams);
        }
        initializer();
    }

}

module.exports = {
    'Initializer': function () {
        return new InitializerAnnotation();
    }
};