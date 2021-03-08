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
        let params = this.defaultParams({}, []);
        let dataParams = [];
        args.forEach((arg)=>{
            dataParams.push(params[arg]);
        });
        Reflect.apply(fn, ctrl, dataParams);
        setTimeout(function (){
            for (let key in params) {
                if (typeof params[key].$finalizer === 'function')
                    params[key].$finalize();
            }
        }, 60000);
    }

}

module.exports = {
    'Initializer': function () {
        return new InitializerAnnotation();
    }
};