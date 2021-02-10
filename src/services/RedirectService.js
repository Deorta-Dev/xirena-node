module.exports = {
    "redirect": {
        /**
         *
         * @param kernel {Kernel}
         * @param application {Application}
         */
        build: (kernel, application) => {
        },
        instance: (services) => {
            let instance = (url) => {
                let {$send, $request} = services;
                if (!/(http:\\\\)|(https:\\\\)/.test(url)) {
                    url = $request.protocol+'://'+$request.get('host') + '/' +url;
                }
                $send(response => {
                    response.writeHead(307,
                        {Location: url}
                    );
                    response.end();
                });
            }
            return instance;
        }
    }
};