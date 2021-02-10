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
                let $request= services.$request;
                let cookiesMap = {};
                if (typeof $request.headers.cookie === 'string')
                    $request.headers.cookie.split(';').forEach(stringCookie => {
                        [n, v] = stringCookie.split('=');
                        cookiesMap[n] = v;
                    });
                return decodeURIComponent(cookiesMap[name]);
            }
            return cookieInstance;
        }
    }
};