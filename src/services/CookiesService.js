module.exports = {
    "cookie": {
        /**
         * @param kernel {Kernel}
         * @param application {Application}
         */
        build: (kernel, application) => {
        },
        instance: (services) => {
            let cookieInstance = (name) => {
                let {$request} = services;
                let cookiesMap = {};
                if (typeof $request.headers.cookie === 'string')
                    $request.headers.cookie.split(';').forEach(stringCookie => {
                        let [c, v] = stringCookie.split('=');
                        while (c.startsWith(' ')) c = c.slice(1);
                        while (c.endsWith(' ')) c = c.slice(0, -1);
                        cookiesMap[c] = v;
                    });
                return decodeURIComponent(cookiesMap[name]);
            }
            return cookieInstance;
        }
    }
};