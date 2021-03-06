class AbstractAnnotation {

    constructor() {
        this._kernel = null;
        this._fn = null;
        this._args = null;
    }

    /**
     * @param kernel {Kernel}
     */
    set kernel(kernel) {
        this._kernel = kernel;
    }

    get kernel() {
        return this._kernel;
    }

    /**
     *
     * @param value {function}
     */
    set fn(value) {
        this._fn = value;
    }

    get fn() {
        return this._fn;
    }

    get args() {
        return this._args;
    }

    set args(value) {
        this._args = value;
    }

    build() {

    }

    defaultParams(params = {}, requires = []) {
        let kernel = this.kernel;
        params['$kernel'] = kernel;
        params['$application'] = kernel.application;
        params['$scope'] = {};
        params['$socket'] = kernel.expressIO;
        params['$appScope'] = kernel.appScope;
        let services = kernel.services;
        Object.keys(services).forEach(key => {
            if (!requires || requires.length === 0 || requires.includes('$' + key) || requires.includes(key))
                params['$' + key] = services[key].instance(params);
        });
        return params;
    }

}

module.exports = AbstractAnnotation;