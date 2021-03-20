const AbstractAnnotation = require('../AbstractAnnotation');
let handles = [];

class RouterAnnotation extends AbstractAnnotation {
    constructor() {
        super();
        this._name = '';
        this._method = '';
        this._option = '';
        this._handles = [];
        this._executions = undefined;
    }

    build() {
        let kernel = this.kernel, handlesFunction = this._handles, $this = this, method = this.method,
            routeFunction = undefined, router = this.name, fn = this.fn;
        method = method.toUpperCase();
        let app = kernel.expressApp;
        if (!router.startsWith('/')) router = '/' + router;
        this.name = router;
        let fnx = async function (request, response) {
            if (!$this.executions)
                $this.executions = HandleAnnotation.getExecutions($this.handles, $this);

            if (Array.isArray($this.executions)) {
                let executions = $this.executions.clone(), currentExecution, dataResponse;

                function sendFn(data) {
                    dataResponse = data;
                    if (currentExecution)
                        if (!currentExecution.isController) {
                            sendFinalizeFn();
                        } else nextFn();
                }

                function nextFn() {
                    if (executions.length > 0) {
                        currentExecution = executions.shift();
                        let args = currentExecution.args;
                        let dataParams = [];
                        args.forEach((arg) => dataParams.push(params[arg] || undefined));
                        Reflect.apply(currentExecution.fn, currentExecution.ctrl, dataParams);
                    } else sendFinalizeFn();
                }

                let isSend = false;

                function sendFinalizeFn() {
                    if (!isSend) {
                        isSend = true;
                        if (typeof dataResponse === 'function') dataResponse(response);
                        else response.send(dataResponse);
                    }
                }

                let params = await $this.defaultParams(request.params);
                params['$request'] = request;
                params['$response'] = response;
                params['$next'] = nextFn;
                params['$send'] = sendFn;

                if (request.body === undefined) {
                    let body = '';
                    request.on('data', chunk => body += chunk);
                    request.on('end', () => {
                        try {
                            body = JSON.parse(body);
                        } catch (e) {
                        }
                        request.body = body;
                        nextFn();
                    });
                } else nextFn();

            }
        };
        switch (method) {
            case "GET" :
                routeFunction = app.get(router, fnx);
                break;
            case "POST" :
                routeFunction = app.post(router, fnx);
                break;
            case "PUT" :
                routeFunction = app.put(router, fnx);
                break;
            case "DELETE" :
                routeFunction = app.delete(router, fnx);
                break;
        }
        return this;
    }

    get name() {
        return this._name;
    }

    set name(value) {
        this._name = value;
        return this;
    }

    get option() {
        return this._option;
    }

    set option(value) {
        this._option = value;
        return this;
    }

    get method() {
        return this._method;
    }

    set method(value) {
        this._method = value;
        return this;
    }

    get handles() {
        return this._handles;
    }

    set handles(value) {
        if (typeof value === 'string') {
            this._handles = [value];
        } else if (Array.isArray(value)) {
            this._handles = value;
        }
        return this;
    }

    get executions() {
        return this._executions;
    }

    set executions(value) {
        this._executions = value;
        return this;
    }

}

class HandleAnnotation extends AbstractAnnotation {
    constructor() {
        super();
        this._name = '';
        this._type = true;
    }

    build() {

    }

    get name() {
        return this._name;
    }

    set name(value) {
        this._name = value;
    }

    get type() {
        return this._type;
    }

    set type(value) {
        this._type = value;
    }

    static getExecutions(handleList, annotationController) {
        let handlesBefore = [], handlesAfter = [], handlesAsync = [];
        if (annotationController) annotationController.isController = true;

        function findHandle(name) {
            handles.forEach(item => {
                if (item.name === name)
                    switch (item.type) {
                        case 'async':
                            handlesAsync.push(item);
                            break;
                        case 'after':
                            handlesAfter.push(item);
                            break;
                        case 'before':
                            handlesBefore.push(item);
                            break;
                    }
            });
        }

        findHandle("$all");
        handleList.forEach(handleName => findHandle(handleName));
        findHandle("$finally");
        if (annotationController)
            return handlesBefore
                .concat([annotationController])
                .concat(handlesAfter)
                .concat(handlesAsync);
        else
            return handlesBefore
                .concat(handlesAfter)
                .concat(handlesAsync);
    }

}

module.exports = {
    'Route': function (name, method = 'GET', options = {}) {
        let annotation = new RouterAnnotation();
        annotation.name = name;
        annotation.method = method;
        if (Array.isArray(options))
            annotation.handles = options;
        else if (typeof options === 'object' && options.handles) {
            if (Array.isArray(options.handles))
                annotation.handles = options.handles;
            else if (typeof options.handles === 'string')
                annotation.handles = [options.handles];
        } else if (typeof options === 'string')
            annotation.handles = [options];


        return annotation;
    },
    'RouteHandle': function (name, type = 'before') {
        let annotation = new HandleAnnotation();
        annotation.name = name;
        annotation.type = (type + '').toLowerCase();
        handles.push(annotation);
        return annotation;
    }
};