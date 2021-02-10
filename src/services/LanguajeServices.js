let languagePack = {};
module.exports = {
    "$":{
        /**
         *
         * @param kernel {Kernel}
         * @param application {Application}
         */
        build: (kernel, application)=>{
            let langList = kernel.getConfig('lang');
            if(langList){
                console.log('\x1b[34m','Importing Languages', '\x1b[0m');
                langList.forEach(function (lang) {
                    languagePack[lang.id] = kernel.getConfig('lang/'+lang.id);
                    console.log('\x1b[34m',' --> ', '\x1b[0m',lang.name,'[',lang.id,']');
                });
                console.log(' ','Import Finished', ' ');
            }
        },
        instance: () =>{
            let instance = function (string, config) {
                string = string.toLowerCase();
                if (languagePack && languagePack[this.lang][string] != undefined)
                    string = languagePack[this.lang][string];
                if (config == 't') {
                    string = string.toLowerCase().split(' ');
                    for (let i = 0; i < string.length; i++) {
                        let firstLetter = 0;
                        let str = '';
                        while (!string[i].charAt(firstLetter).isLetter() && firstLetter < string[i].length) {
                            str += string[i].charAt(firstLetter);
                            firstLetter++;
                        }
                        string[i] = str + string[i].charAt(firstLetter).toUpperCase() + string[i].slice(1 + firstLetter);
                    }
                    return string.join(' ');
                } else if (config == 'f' || config == undefined) {
                    var firstLetter = 0;
                    var str = '';
                    while (!string.charAt(firstLetter).isLetter() && firstLetter < string.length) {
                        str += string.charAt(firstLetter);
                        firstLetter++;
                    }
                    return str + string.charAt(firstLetter).toUpperCase() + string.slice(1 + firstLetter);
                    //return string.charAt(0).toUpperCase() + string.slice(1);
                } else if (config == 'l') {
                    return string.toLowerCase();
                }
            }
            instance.lang = 'en';
            instance.select = (lang) => this.lang = lang;

        }
    }
};