/**
 * Metodo para desencriptar de Base64
 * @param string
 */
global.btoa = function (string) {
    const Buffer = global.Buffer || require('buffer').Buffer;
    return new Buffer(string, 'binary').toString('base64');
}
/**
 * Metodo para encriptar a Base64
 * @param string
 */
global.atob = function (string) {
    const Buffer = global.Buffer || require('buffer').Buffer;
    return new Buffer(string, 'base64').toString('binary');
}
String.prototype.normalize = function (string) {
    let rp = this;
    return rp
        .replaceAll("á", 'a')
        .replaceAll("é", 'e')
        .replaceAll("í", 'i')
        .replaceAll("ó", 'o')
        .replaceAll("ú", 'u')
        .replaceAll("ü", 'u')
        .replaceAll("ñ", 'n')
        .replaceAll("Á", 'A')
        .replaceAll("É", 'E')
        .replaceAll("Í", 'I')
        .replaceAll("Ó", 'O')
        .replaceAll("Ú", 'U')
        .replaceAll("Ü", 'U')
        .replaceAll("Ñ", 'N');
};
String.prototype.isLetter = function () {
    if (this.length === 1 && this.match(/[a-z]/i))
        return true;
    else return false
};
String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};
String.prototype.toUnicode = function () {
    return this
        .replaceAll("á", '\u00E1')
        .replaceAll("é", '\u00E9')
        .replaceAll("í", '\u00ED')
        .replaceAll("ó", '\u00F3')
        .replaceAll("ú", '\u00FA')
        .replaceAll("ü", '\u00FC')
        .replaceAll("ñ", '\u00F1')
        .replaceAll("Á", '\u00C1')
        .replaceAll("É", '\u00C9')
        .replaceAll("Í", '\u00CD')
        .replaceAll("Ó", '\u00D3')
        .replaceAll("Ú", '\u00DA')
        .replaceAll("Ü", '\u00DC')
        .replaceAll("Ñ", '\u00D1');
};

function toProperCase(string) {
    if (string)
        return string.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    else return "";
};
String.prototype.toProperCase = toProperCase;
String.prototype.replaceAll = function (search, replacement) {
    let target = this;
    return target.replace(new RegExp(search), replacement);
};
String.prototype.replaceIgAll = function (search, replacement) {
    let target = this;
    return target.replace(new RegExp(search, 'ig'), replacement);
};
String.prototype.hasIgnoreFormat = function (string) {
    let find = this;
    find = find.toLowerCase();
    string = string.toLowerCase();
    find = this.normalize(find);
    string = this.normalize(string);
    return new RegExp(find).test(string);
};
String.prototype.cleanAccents = function () {
    let rp = this;
    return rp.replaceAll("á", 'a')
        .replaceAll("é", 'e')
        .replaceAll("í", 'i')
        .replaceAll("ó", 'o')
        .replaceAll("ú", 'u')
        .replaceAll("ü", 'u')
        .replaceAll("ñ", 'n')
        .replaceAll("Á", 'A')
        .replaceAll("É", 'E')
        .replaceAll("Í", 'I')
        .replaceAll("Ó", 'O')
        .replaceAll("Ú", 'U')
        .replaceAll("Ü", 'U')
        .replaceAll("Ñ", 'N');
};
String.prototype.htmlEncode = function () {
    let rp = this;
    rp = rp.replaceAll("á", '&aacute;');
    rp = rp.replaceAll("é", '&eacute;');
    rp = rp.replaceAll("í", '&iacute;');
    rp = rp.replaceAll("ó", '&oacute;');
    rp = rp.replaceAll("ú", '&uacute;');
    rp = rp.replaceAll("ñ", '&ntilde;');
    rp = rp.replaceAll("ü", '&uuml;');
    rp = rp.replaceAll("Á", '&Aacute;');
    rp = rp.replaceAll("E", '&Eacute;');
    rp = rp.replaceAll("Í", '&Iacute;');
    rp = rp.replaceAll("Ó", '&Oacute;');
    rp = rp.replaceAll("Ú", '&Uacute;');
    rp = rp.replaceAll("Ñ", '&Ntilde;');
    rp = rp.replaceAll("Ü", '&Uuml;');
    return rp;
};
String.prototype.htmlDecode = function () {
    let rp = this;
    rp = rp.replaceAll("&aacute;", 'á');
    rp = rp.replaceAll("&eacute;", 'é');
    rp = rp.replaceAll("&iacute;", 'í');
    rp = rp.replaceAll("&oacute;", 'ó');
    rp = rp.replaceAll("&uacute;", 'ú');
    rp = rp.replaceAll("&ntilde;", 'ñ');
    rp = rp.replaceAll("&uuml;", 'ü');
    rp = rp.replaceAll("&Aacute;", 'Á');
    rp = rp.replaceAll("&Eacute;", 'É');
    rp = rp.replaceAll("&Iacute;", 'Í');
    rp = rp.replaceAll("&Oacute;", 'Ó');
    rp = rp.replaceAll("&Uacute;", 'Ú');
    rp = rp.replaceAll("&Ntilde;", 'Ñ');
    rp = rp.replaceAll("&Uuml;", 'Ü');
    return rp;
};
String.prototype.firstWord = function () {
    return this.split(' ')[0];
};


Array.prototype.clone = function () {
    return this.slice(0);
};

Array.prototype.find = function (parameters) {
    let is = true;
    let objects = [];
    for (let i = 0; i < this.length; i++) {
        is = true;
        for (let key in parameters) {
            if (this[i][key] !== parameters[key]) {
                is = false;
                break;
            }
        }
        if (is) {
            objects.push(this[i]);
        }
    }
    return objects;
};

Array.prototype.replace = function (parameters, object) {
    let is = true;
    for (let i = 0; i < this.length; i++) {
        is = true;
        for (let key in parameters) {
            if (this[i][key] !== parameters[key]) {
                is = false;
                break;
            }
        }
        if (is) {
            this[i] = object;
        }
    }
    return this;
};

Array.prototype.exists = function (parameters) {
    for (let i = 0; i < this.length; i++) {
        let is = true;
        for (let key in parameters) {
            if (this[i][key] !== parameters[key]) {
                is = false;
                break;
            }
        }
        if (is) return true;
    }
    return false;
};

Array.prototype.count = function (parameters) {
    let objects = [];
    for (let i = 0; i < this.length; i++) {
        let is = true;
        for (let key in parameters) {
            if (this[i][key] !== parameters[key]) {
                is = false;
                break;
            }
        }
        if (is) {
            objects.push(this[i]);
        }
    }
    return objects.length;
};

Array.prototype.getIndexFind = function (parameters) {
    for (let i = 0; i < this.length; i++) {
        let is = true;
        for (let key in parameters) {
            if (this[i][key] !== parameters[key]) {
                is = false;
                break;
            }
        }
        if (is) return i;
    }
    return -1;
};

Array.prototype.remove = function (x) {
    this.splice(x, 1);
};

Array.prototype.removeObject = function (object) {
    for (let i = 0; i < this.length; i++) {
        if (this[i] === object) {
            this.remove(i);
            break;
        }
    }
};

Array.prototype.removeObject = function (object) {
    for (let i = 0; i < this.length; i++) {
        if (this[i] === object) {
            this.remove(i);
            break;
        }
    }
};


