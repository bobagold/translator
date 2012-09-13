describe('publicInterface', function(){

    it('finds translation pairs', function() {
        var translate = new MuzzyTranslator('de', '/');
        spyOn(translate.t.keysFinder, 'testElement');

        translate.bindEvents();

        expect(translate.t.keysFinder.testElement).toHaveBeenCalled();
    });

    it('removes special mark up', function() {
        var translate = new MuzzyTranslator('de', '/');
        spyOn(translate.t.keysFinder, 'removeMarkUp');

        translate.bindEvents();

        expect(translate.t.keysFinder.removeMarkUp).toHaveBeenCalled();
    });

    it('attaches handlers per every key', function() {
        var translate = new MuzzyTranslator('de', '/');
        translate.t.keysStorage = {
            keys: [{anchor:{}, keys:['key1']}, {anchor:{}, keys:['key2']}]
        };

        spyOn(translate.t.handler, 'install');

        translate.bindEvents();

        expect(translate.t.handler.install).toHaveBeenCalledWith({}, ['key1']);
        expect(translate.t.handler.install).toHaveBeenCalledWith({}, ['key2']);
    });

    it('obligated to be at t.* subdomain', function() {
        expect(document.location.hostname).toMatch(/^t\..+/);
    });

});