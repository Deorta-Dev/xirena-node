let fs = require('fs');

module.exports = {
    getClassFunctions: (object) => {
        let methods = [];
        while (object = Reflect.getPrototypeOf(object)) {
            let keys = Reflect.ownKeys(object);
            keys.forEach((k) => methods.push(k));
        }
        return methods;
    },


    getClassAnnotations: (Class, annotations) => {
        if (typeof Class !== 'string') Class = Class.toString();
        let lines = Class.replace(/\r/gi, '').split('\n');
        let isComment = false, isAnnotation = false, isFunction = false, inAnnotation = false, waitFunction = false;
        let execute = '', method = '';

        function clearSpace(string) {
            string = string.replace(/\s|\t|\n/gi, '');
            return string;
        }

        let result = [];
        let r = {annotation: "", fn: "", args: []};
        let annotationString = "";

        function findNextFunction(key) {
            let inFunction = false;
            let functionString = "";
            let line;
            do {
                line = lines[key];
                if (/^(\s)*[A-Za-z0-9$@\$]{1,}(\((.)*\))/.test(line)) {
                    inFunction = true;
                }
                if (inFunction) functionString += line;
                if (inFunction && line.includes(')')) inFunction = false;
                key++;
            } while (key < lines.length);

            return functionString.replace(/\n|\t\s/, '');
        }

        let lastAnnotation;
        lines.forEach((line, key) => {
            if (!isAnnotation && waitFunction) {
                let fnString = findNextFunction(key);
                method = clearSpace(fnString.split('(')[0]);
                let argsString = clearSpace(fnString.split('(')[1].split(')')[0]);
                if (argsString.length > 0) {
                    let args = argsString.split(',');
                    args.forEach((arg, index) => {
                        args[index] = clearSpace(arg.split('=')[0]);
                    });
                    r.args = args;
                }
                r.fn = method;
                while (annotationString.startsWith(' ')) {
                    annotationString = annotationString.replace(' ', '');
                }
                r.annotation = annotationString;
                result.push(r);
                waitFunction = false;
                annotationString = '';
                r = {annotation: "", fn: "", args: []};
            }
            for (let annotation in annotations) {
                isAnnotation = line.includes('@' + annotation + ' ') || line.includes('@' + annotation+ '(');
                if (isAnnotation) {
                    //console.log("A: ", line);
                    lastAnnotation = annotation;
                    break;
                }
            }
            ;

            if (isAnnotation && !inAnnotation && clearSpace(line).includes('@' + lastAnnotation + '(')) {
                inAnnotation = true;
            }
            if (inAnnotation) {
                //console.log("In Annotation: ", line);
                let l = line.replace(/^(\s{1,}|\t{1,})\*{1,}/, '')
                    .replace(/^(\s{1,}|\t{1,})(\/\/){1,}/, '')
                    .replace(/^(\s{1,}|\t{1,})(\/\*)/, '');
                annotationString += l;
            }
            if (/(@)[A-Za-z0-9\$]{1,}(\((.)*\))/.test(line) || (inAnnotation && line.includes(')'))) {
                inAnnotation = false;
                waitFunction = true;
                isAnnotation = false;
            }
        });
        return result;
    }
};