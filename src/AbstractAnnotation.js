class AbstractAnnotation{

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

    build (){

    }

}

module.exports = AbstractAnnotation;