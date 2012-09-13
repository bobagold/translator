/*global jQuery*/

function MuzzyTranslator(locale, pageId, dbDriver, deps) {
    "use strict";

    if (undefined === deps) {
        deps = {};
    }

    var di = deps.dialog || this.dialog(jQuery, locale, pageId, dbDriver),
        ks = deps.keysStorage || this.keysStorage(jQuery),
        kf = deps.keysFinder || this.keysFinder(jQuery, ks),
        ha = deps.handler || this.handler(jQuery, di);

    return this.publicInterface(jQuery, di, kf, ks, ha);
}

MuzzyTranslator.prototype.dialog = function($, locale, pageId, dbDriver) {
    "use strict";

    function iframeInParent() {return $('#translate', parent.document); }
    function dialogContainer() {return $('#translateDialogContainer'); }
    function dialogForm() {return $('#translateDialogContainer form'); }

    function raiseIframe() {
        iframeInParent().attr({
            width : $(parent.document).outerWidth(),
            height : $(parent.document).outerHeight()
        }).css({
            position: 'absolute',
            zIndex: 5000,
            top: 0,
            left: 0
        }).show();
    }

    function textarea(name, value) {
        return $('<textarea/>').attr({type: 'text', name: name}).html(value);
    }

    function iTag(content) {
        return $('<i/>').html(content);
    }

    function readStringObjects(keys, doneCallback) {
        var o = {},
            length = function(o){
                var count = 0, k;
                for (k in o) if (o.hasOwnProperty(k)) count++;
                return count;
            };

        $.each(
            keys,
            function(i, key) {
                dbDriver.readObject(locale, key, function(data) {
                    o[key] = data;

                    if (length(o) === keys.length) {
                        doneCallback(o);
                    }
                });
            }
        );
    }

    function drawDialog(stringObjects, submitCallback) {
        raiseIframe();
        dialogForm().empty();

        $.each(
            stringObjects,
            function (key, str) {
                iTag(str.key).appendTo(dialogForm());
                textarea(
                    key,
                    str.pageTranslations[pageId] || str.defaultTranslation || str.key
                ).appendTo(dialogForm());
            }
        );

        dialogForm()
            .unbind('.translate')
            .bind(
                'submit.translate',
                function () {
                    dialogContainer().dialog('close');
                    submitCallback($(this).serializeArray());
                }
            );

        dialogContainer().dialog({
            title: 'Translate to ' + locale,
            autoOpen: true,
            width: 600,
            close: function () {iframeInParent().hide(); },
            position: ['center', $(parent.window).scrollTop() + $(parent.window).outerHeight()/4],
            buttons: {
                "Ok": function () {
                    $(this).dialog("close");
                    submitCallback(dialogForm().serializeArray());
                },
                "Cancel": function () {
                    $(this).dialog("close");
                }
            }
        });
    }

    function writeTranslations(a) {
        var i;
        for (i=0; i < a.length; i++) {
            dbDriver.writeTranslation(locale, pageId, a[i].name, a[i].value);
        }
    }

    return {
        t: {
            readStringObjects: readStringObjects,
            writeTranslations: writeTranslations
        },

        popUp : function (keys) {
            var translate = this;
            this.t.readStringObjects(keys, function(o){
                drawDialog(o, translate.t.writeTranslations);
            });
        }
    };
};

MuzzyTranslator.prototype.keysFinder = function ($, keysStorage) {
    "use strict";

    var keyRegexp = /\u2018([^\u2019]{32})\u2019/gm;

    function everyTranslationInChildTextNodes(el, callback) {
        var i, match;

        if (el.childNodes.length > 0) {
            for (i = 0; i < el.childNodes.length; i += 1) {
                if (el.childNodes[i].nodeType === 3) {
                    while ((match = keyRegexp.exec(el.childNodes[i].textContent)) !== null) {
                        callback(el.childNodes[i], match[1]);
                    }
                }
            }
        }
    }

    function everyTranslationInAttributes(el, callback) {
        var i, match;

        for (i = 0; i < el.attributes.length; i += 1) {
            while ((match = keyRegexp.exec(el.attributes[i].value)) !== null) {
                callback(el.attributes[i], match[1]);
            }
        }
    }

    return {
        testElement: function (el) {
            everyTranslationInChildTextNodes(el, function(childNode, key) {
                keysStorage.register($(childNode).parent(), key);
            });
            everyTranslationInAttributes(el, function(attribute, key) {
                keysStorage.register($(el), key);
            });
        },
        removeMarkUp: function(el) {
            everyTranslationInChildTextNodes(el, function(childNode) {
                childNode.textContent = childNode.textContent
                    .replace(keyRegexp, '\u2018');
            });
            everyTranslationInAttributes(el, function(attribute, key) {
                attribute.value = attribute.value.replace(keyRegexp, '\u2018');
            });
        }
    };
};

MuzzyTranslator.prototype.keysStorage = function($) {
    "use strict";

    var keys = [];

    function registeredAnchorIdx(el) {
        var i;

        for (i in keys) {
            if (keys.hasOwnProperty(i) && (keys[i].anchor === el)) {
                return i;
            }
        }
        return undefined;
    }

    function selectBestContainerInDOM($el) {

        if ($el.is(':hidden')) {
            $el = $el.closest(':visible');
        }

        if (['body', 'head', 'html'].indexOf($el.get(0).tagName.toLowerCase()) !== -1) {
            return $('body', parent.document);
        }

        if ($el.is('li,th,td,dd,dl')) {
            var $span = $el.children('.__mlsHandlerAnchor');
            if (!$span.length) {
                $span = $('<span class="__mlsHandlerAnchor"/>');
                $el.append($span);
            }
            return $span;
        }

        return $el;
    }

    return {
        register: function (el, key) {
            var $el = selectBestContainerInDOM($(el)),
                i = registeredAnchorIdx($el.get(0));

            if (i) {
                if (keys[i].keys.indexOf(key) === -1) {
                    keys[i].keys.push(key);
                }
            } else {
                keys.push(
                    {anchor: $el.get(0), keys: [key]}
                );
            }
        },
        keys: keys
    };
};

MuzzyTranslator.prototype.handler = function($, dialog) {
    "use strict";

    var translateHandleStyles = {
            position: 'absolute',
            display: 'inline',
            textDecoration: 'none',
            fontSize : '30px',
            color: 'red',
            padding: 0,
            margin: 0,
            border: 'none',
            zIndex: 100,
            fontWeight: 'normal',
            'float': 'none',
            opacity: 0.5
        };
    
    function handle(clickCallback) {
        return $('<a href="javascript:;"/>').attr({
                'class': '__mlsHandle',
                onclick: 'if(event)event.stopPropagation()'
            })
            .append('*')
            .bind('click.translate', clickCallback)
            .css(translateHandleStyles);
    }

    function dialogCallback(keys) {
        return function() {dialog.popUp(keys);};
    }

    return {
        install: function(anchor, keys) {
            $(anchor).before(
                handle(dialogCallback(keys))
            );
        }
    };
};

MuzzyTranslator.prototype.publicInterface = function ($, dialog, keysFinder, keysStorage, handler) {
    "use strict";

    function findTranslationKeys(kf) {
        $('*', parent.document).each(
            function () {
                kf.testElement(this);
            }
        );
    }

    function removeSpecialMarkUp(kf) {
        $('*', parent.document).each(
            function () {
                kf.removeMarkUp(this);
            }
        );
    }

    function attachHandlers(ks, ha) {
        $.each(ks.keys, function () {
            ha.install(this.anchor, this.keys);
        });
    }

    return {
        t: {
            dialog: dialog,
            keysFinder: keysFinder,
            keysStorage: keysStorage,
            handler: handler
        },

        bindEvents: function () {
            findTranslationKeys(this.t.keysFinder);
            removeSpecialMarkUp(this.t.keysFinder);
            attachHandlers(this.t.keysStorage, this.t.handler);
        }
    };
};