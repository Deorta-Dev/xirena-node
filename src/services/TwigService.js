const Twig = require('twig');
const fs = require('fs');

module.exports = {
    render: {
        /**
         *
         * @param kernel {Kernel}
         * @param application {Application}
         */
        build: (kernel, application) => {

        },
        instance: (services) => {
            return (twigFile, data) => {
                (({$response, $request}) => {
                    let template = fs.readFileSync(__dirname + "/../../../views/" + twigFile, 'utf8');
                    Twig.extendFunction("asset", value => {
                        return $request.protocol+'://'+$request.get('host') + '/' +value;
                    });
                    let compiled = Twig.twig({
                        data: template,
                        namespaces: {
                            'views': __dirname + "/../../../views/"
                        },
                    }).render(data);
                    $response.send(compiled);
                })(services);
            }
        }
    }
};