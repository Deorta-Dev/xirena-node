class Application {

    constructor() {
        this._collection = {};
    }

    set ( name, value ){
        this._collection [name] = value;
    }

    get ( name ){
        return this._collection [name];
    }
}

module.exports = Application;