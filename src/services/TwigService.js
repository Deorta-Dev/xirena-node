const Twig = require('twig');
const fs = require('fs');
const path = require('path')
let config;
let globalConfig;
module.exports = {
    render: {
        /**
         *
         * @param kernel {Kernel}
         * @param application {Application}
         */
        build: (kernel, application) => {
            config = kernel.getConfig('twig');
            globalConfig = kernel.globalConfig;
            config.src = path.join(kernel.projectDir, config.src);

        },
        instance: (services) => {
            return (twigFile, data) => {
                (({$response, $request, $kernel}) => {
                    let template = fs.readFileSync(path.join(config.src, twigFile), 'utf8');
                    Twig.extendFunction("asset", value => {
                        if (globalConfig.prod && globalConfig.domain)
                            return globalConfig.domain + '/' + value;
                        return $request.protocol + '://' + $request.get('host') + '/' + value;
                    });
                    let compiled = Twig.twig({
                        data: template,
                        namespaces: {
                            'views': config.src
                        },
                    }).render(data);
                    $response.send(compiled);
                })(services);
            }
        }
    }
};