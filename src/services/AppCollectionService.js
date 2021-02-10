let collections = {};
let lists = {};
let dir_save = null;
const fs = require('fs');

function checkUnique(unique, object) {
    if (unique) return unique;
    else if (object.id) return 'id';
    else return '_id';
}

module.exports = {
    "collection": {
        /**
         *
         * @param kernel {Kernel}
         * @param application {Application}
         */
        build: (kernel, application) => {

        },
        instance: () => {

            let collection = (name) => {
                if (lists[name] == undefined) lists[name] = [];
                if (collections[name] == undefined) {
                    let collection = {

                        /**
                         * collections
                         */

                        /**
                         *
                         * @param object {Object}
                         * @param unique {String}
                         */
                        save: (object, unique = undefined) => {
                            unique = checkUnique(unique, object);
                            if (object._id == undefined) {
                                object._id = (new Date()).getTime();
                            }
                            for (let i = 0; i < lists[name].length; i++)
                                if (lists[name][i][unique] == object[unique]) {
                                    let origin = lists[name][i];
                                    for (name_key in object) {
                                        if (object[name_key] == undefined && origin[name_key] != undefined)
                                            delete origin[name_key];
                                        else
                                            origin[name_key] = object[name_key];
                                    }
                                    lists[name][i] = origin;
                                    return origin;
                                }
                            lists[name].push(object);
                            return object;
                        },

                        /**
                         *
                         * @param parameters {JSON}
                         * @returns {Array}
                         */
                        findBy: (parameters) => {
                            if (lists[name] == undefined) lists[name] = [];
                            let is = true;
                            let objects = [];
                            for (let i = 0; i < lists[name].length; i++) {
                                is = true;
                                for (let key in parameters) {
                                    if (lists[name][i][key] != parameters[key]) {
                                        is = false;
                                        break;
                                    }
                                }
                                if (is) {
                                    objects.push(lists[name][i]);
                                }
                            }
                            return objects;
                        },

                        /**
                         *
                         * @param parameters {JSON}
                         * @returns {Array}
                         */
                        findByOne: (parameters) => {
                            if (lists[name] == undefined) lists[name] = [];
                            let result = null;
                            if (result = collections[name].findBy(parameters)) {
                                return result[0];
                            } else return false;
                        },

                        /**
                         *
                         * @param _id {Number}
                         * @returns {Array}
                         */
                        find: (_id, unique) => {
                            if (lists[name] == undefined) lists[name] = [];
                            unique = checkUnique(unique, lists[name][0] || {_id: 0});
                            let query = {};
                            query[unique] = _id;
                            return collections[name].findByOne({_id: _id});
                        },


                        /**
                         *
                         * @returns {[]|*[]}
                         */
                        findAll: () => {
                            if (lists[name] == undefined) lists[name] = [];
                            return lists[name];
                        },

                        /**
                         * @param {Array}
                         */
                        deleteBy: (parameters) => {
                            if (lists[name] == undefined) lists[name] = [];
                            let is = true;
                            let objects = [];
                            for (let i = lists[name].length - 1; i >= 0; i--) {
                                is = true;
                                for (let key in parameters) {
                                    if (lists[name][i][key] != parameters[key]) {
                                        is = false;
                                        break;
                                    }
                                }
                                if (is) {
                                    lists[name].splice(i, 1);
                                }
                            }
                            if (objects.length > 0)
                                return objects;
                            else false;
                        },

                        /**
                         * @param {Array}
                         */
                        delete: (object, unique) => {
                            unique = checkUnique(unique, object);
                            let query = {};
                            query[unique] = object[unique]
                            return collections[name].deleteBy(query);
                        }

                    };
                    collections[name] = collection;
                }
                return collections[name];
            };
            return collection;
        }
    }
};