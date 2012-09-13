function MuzzyTranslations(locale, pageId, dbDriver) {
    "use strict";

    function translate(key, o) {
        if (undefined === o) {
            o = {defaultTranslation: undefined, pageTranslations: {}};
        }
        return o.pageTranslations[pageId] || o.defaultTranslation || key;
    }

    return {
        translate: function(key, successCallback) {
            dbDriver.readObject(locale, key, function(o) {
                if (successCallback) successCallback(
                    translate(key, o)
                );
            });
        },
        all: function(successCallback) {
            dbDriver.readPageObjects(locale, pageId, function(arr) {
                if (successCallback) {
                    var keyToTranslationMap={}, i;
                    for(i=0; i< arr.length; i++) {
                        keyToTranslationMap[arr[i].key] = translate(arr[i].key, arr[i]);
                    }

                    successCallback(keyToTranslationMap);
                }
            });
        }
    };
}