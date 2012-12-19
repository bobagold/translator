(function() {
var mt = null;
var translator_mode = false;
window.MtLoaded = function(muzzyTranslator) {
    mt = muzzyTranslator;
    translator_mode = true;
}
var translator = function() {
    var decorate = function(key, translation) {
        if (translator_mode)
            return "\u2018" + key + "\u2019" + translation + "\u2019";
        return translation;
    }
    return {
        translate: function(text) {
            var key = hex_md5(text);
            var translation = window.translations[key];
            if (translation == '(delete)')
                translation = '';
            else if (!window.translations.hasOwnProperty(key) || translation == key)
                translation = text;
            if (translator_mode && mt) {
                mt.registerTranslation(key, text);
            }
            return decorate(key, translation);
        }
    };
}
var instance = null;
window.translator = function() {
    return instance ? instance : (instance = new translator());
}
})();