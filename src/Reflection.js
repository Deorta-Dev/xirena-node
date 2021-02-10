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

        let lines = Class.toString().replace(/\r/gi, '').split('\n');
        let isComment = false, isAnnotation = false;
        let execute = '', method = '';

        function clearSpace(string) {
            while (string.startsWith(' ')) string = string.replace(' ', '');
            while (string.endsWith(' ')) string = string.slice(0, -1);;
            return string;
        }

        let result = [];
        let r = {"annotation": "", "fn": "", "args":[]};
        lines.forEach((line) => {
            Object.keys(annotations).forEach(function (annotation, index) {
                if (isComment == false && isAnnotation) {
                    if(!line.includes('*/') && clearSpace(line).length > 1){
                        method = clearSpace(line.split('(')[0]);
                        let argsString = clearSpace(line.split('(')[1].split(')')[0]);
                        if(argsString.length>0){
                            let args = argsString.split(',');
                            args.forEach((arg, index)=>{
                                args[index] = clearSpace(arg.split('=')[0]);
                            });
                            r.args = args;
                        }
                        r.fn = method;
                        result.push(r);
                        isAnnotation = false;
                        r = {"annotation": "", "fn": "", "args":[]};
                    }
                }
                if (line.includes('/*')) isComment = true;
                if (line.includes("@"+annotation) && isComment) {
                    execute = clearSpace(line.replace('*', ''));
                    r.annotation = execute.slice(1,execute.length);
                    isAnnotation = true;
                }
                if (line.includes('*/')) {
                    isComment = false;
                }
            });
        });
        return result;
    }
};