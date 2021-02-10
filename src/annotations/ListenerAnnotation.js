const AbstractAnnotation = require('../AbstractAnnotation.js');
class ListenerAnnotation extends AbstractAnnotation{

    constructor() {
        super();
        this._name = '';
        this._option = '';
        this._condition = '';
    }

    build() {
        let kernel = this.kernel;
        let args = this.args;
        let fn = this.fn;
        let ctrl = this.ctrl;
        kernel.addListener(this.name, function (socket, data, scope, appScope) {
            let params = {data: data};
            params['$kernel'] = kernel;
            params['$application'] = kernel.application;
            params['$socket'] = socket;
            params['$scope'] = scope;
            params['$appScope'] = appScope;
            let services = kernel.services;
            Object.keys(services).forEach( (key)=>{
                params['$' + key] = services[key].instance();
            });
            let dataParams = [];
            args.forEach((arg)=>{
                dataParams.push(params[arg] || data);
            });
            Reflect.apply(fn, ctrl, dataParams);
        }, this.condition);
    }

    get name() {
        return this._name;
    }

    set name(value) {
        this._name = value;
    }

    get option() {
        return this._option;
    }

    set option(value) {
        this._option = value;
    }

    get condition() {
        return this._condition;
    }

    set condition(value) {
        this._condition = value;
    }
}

module.exports = {
    'Listener': function (name, condition = 'true') {
        let annotation = new ListenerAnnotation();
        annotation.name = name;
        annotation.condition = condition;
        return annotation;
    }
};