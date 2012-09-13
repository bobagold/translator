/*global jQuery*/

function MuzzyTranslatorCouchDbDriver(deps) {
    "use strict";

    if (undefined === deps) {
        deps = {};
    }

    var ri = deps.restInterface || this.restInterface(jQuery),
        di = deps.dbInstaller || this.dbInstaller(ri);

    return this.translateInterface(jQuery, ri, di);
}

MuzzyTranslatorCouchDbDriver.prototype.restInterface = function ($) {
    "use strict";

    function request(o, successCallback, notFoundCallback) {
        $.ajax(
            $.extend({
                dataType: 'json',
                contentType: 'application/json',
                success: successCallback,
                statusCode: { 404: notFoundCallback }
            }, o)
        );
    }

    return {
        get: function (url, successCallback, notFoundCallback) {
            request({type: 'GET', url: url}, successCallback, notFoundCallback);
        },
        put: function (url, data, successCallback, notFoundCallback) {
            request({type: 'PUT', url: url, data: JSON.stringify(data)}, successCallback, notFoundCallback);
        },
        del: function (url, successCallback, notFoundCallback) {
            request({type: 'DELETE', url: url}, successCallback, notFoundCallback);
        }
    };
};

MuzzyTranslatorCouchDbDriver.prototype.dbInstaller = function (restInterface) {
    "use strict";
    function emit(a, b) {} // satisfy jsHint

    var pageIds = function (doc) {
            var pageId;
            if (doc.pageTranslations) {
                for (pageId in doc.pageTranslations) {
                    if (doc.pageTranslations.hasOwnProperty(pageId)) {
                        emit(pageId, null);
                    }
                }
            }
        },
        nullReduce = function (keys, values) {
            return null;
        },
        objectsByPageId = function (doc) {
            var pageId;
            if (doc.pageTranslations) {
                for (pageId in doc.pageTranslations) {
                    if (doc.pageTranslations.hasOwnProperty(pageId)) {
                        emit(pageId, doc);
                    }
                }
            }
        },
        requireAdminRole = function (newDoc, oldDoc, userCtx, secObj) {
            if (userCtx.roles.indexOf('_admin') === -1) {
                throw ({unauthorized: "forbidden"});
            }
        };

    function createView(db, documentName, viewName, map, reduce, successCallback) {
        var document = {
            language: 'javascript',
            views: {}
        };
        document.views[viewName] = {map: map.toString()};
        if (reduce) {
            document.views[viewName].reduce = reduce.toString();
        }
        restInterface.put(
            '/couchdb/' + encodeURIComponent(db) + '/_design/' + encodeURIComponent(documentName),
            document,
            successCallback
        );
    }

    function createUpdateValidator(db) {
        restInterface.put(
            '/couchdb/' + db + '/_design/auth',
            {validate_doc_update: requireAdminRole.toString()}
        );
    }

    return {
        install: function (locale, successCallback) {
            restInterface.put('/couchdb/' + locale.toLowerCase(), null, function () {
                    createView(
                        locale.toLowerCase(), 'pages', 'all_ids', pageIds, nullReduce
                    );
                    createView(
                        locale.toLowerCase(), 'objects', 'by_page_id', objectsByPageId
                    );
                    createUpdateValidator(locale.toLowerCase());
                    if (successCallback) {
                        successCallback();
                    }
                }
            );
        }
    };
};

MuzzyTranslatorCouchDbDriver.prototype.translateInterface = function($, restInterface, dbInstaller){
    "use strict";

    function localizedstringStringSchema(data){
        return $.extend(
            data,
            {
                defaultTranslation: data.defaultTranslation || null ,
                pageTranslations: data.pageTranslations || {}
            }
        );
    }

    function createPath(locale, stringKey) {
        return '/couchdb/' + encodeURIComponent(locale.toLowerCase()) +
                       '/' + encodeURIComponent(stringKey);
    }

    function readLocalizedStringObject(locale, key, successCallback) {
        restInterface.get(
            createPath(locale, key),
            function(data) {
                var str = localizedstringStringSchema(data), pageId;
                for (pageId in str.pageTranslations) {
                    if (str.pageTranslations[pageId] == str.defaultTranslation) {
                        str.pageTranslations[pageId] = null;
                    }
                }
                successCallback(str);
            },
            function(){
                successCallback(localizedstringStringSchema({}));
            }
        );
    }

    return {
        t: {
            restInterface: restInterface,
            dbInstaller: dbInstaller
        },

        deleteTranslations: function (locale) {
            restInterface.del('/couchdb/' + locale.toLowerCase());
        },
        writeTranslation: function(locale, pageId, key, value, defaultTranslation) {
            var that = this;
            readLocalizedStringObject(locale, key, function(str){
                str.defaultTranslation = defaultTranslation || str.defaultTranslation || value;
                str.pageTranslations[pageId] = (value === str.defaultTranslation ? null : value);
                restInterface.put(
                    createPath(locale, key),
                    str,
                    null,
                    function(xhr) {
                        if(xhr.responseText.match(/no_db_file/)) {
                            dbInstaller.install(locale, function() {
                                 that.writeTranslation(locale, pageId, key, value, defaultTranslation);
                            });
                        }
                    }
                );
            });
        },
        readPageIds: function(locale, successCallback) {
            restInterface.get(
                createPath(locale, '_design') + '/pages/_view/all_ids?group=true',
                function(data) {
                    var pageIds=[], i;
                    for(i=0; i< data.rows.length; i++) {
                        pageIds.push(data.rows[i].key);
                    }
                    if (successCallback) successCallback(pageIds);
                }
            );
        },
        readPageObjects: function(locale, pageId, successCallback) {
            restInterface.get(
                createPath(locale, '_design') + '/objects/_view/by_page_id?key="' + pageId + '"',
                function(data) {
                    var objects=[], i, o;
                    for(i=0; i< data.rows.length; i++) {
                        o = localizedstringStringSchema(data.rows[i].value);
                        o.key = data.rows[i].id;
                        objects.push(o);
                    }
                    if (successCallback) successCallback(objects);
                }
            );
        },
        readObject: function(locale, key, successCallback) {
            readLocalizedStringObject(locale, key, successCallback);
        }
    };
};
