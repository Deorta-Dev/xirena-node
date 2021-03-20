const AbstractAnnotation = require('../AbstractAnnotation.js');
class InitializerAnnotation extends AbstractAnnotation{

    constructor() {
        super();
    }

    build() {
        let kernel = this.kernel, $this = this;
        kernel.onReady(async function (){
            let args = $this.args;
            let fn = $this.fn;
            let ctrl = $this.ctrl;
            let params = await $this.defaultParams({}, []);
            let dataParams = [];
            args.forEach((arg)=>{
                dataParams.push(params[arg]);
            });
            Reflect.apply(fn, ctrl, dataParams);
        });
    }

}

module.exports = {
    'Initializer': function () {
        return new InitializerAnnotation();
    }
};