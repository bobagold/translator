describe('keysStorage', function() {
    var storage;

    function attachToBodyVisibleDiv(innerHtml) {
        jQuery('body').append(jQuery('<div id="keysStorageTestDiv"/>'));
        if (innerHtml) {
            testElement().append(jQuery(innerHtml));
        }
    }

    function testElement() {
        return jQuery('#keysStorageTestDiv');
    }

//--------------------------------------------------------------------------------------------------

    beforeEach(function() {
        storage = new MuzzyTranslator('de', '/').t.keysStorage;
    });

    afterEach(function() {
        testElement().remove();
    });

//--------------------------------------------------------------------------------------------------

    it('registers a key, remembers visible node as anchor', function(){
        attachToBodyVisibleDiv();

        storage.register(testElement().get(0), '123456');

        expect(storage.keys).toEqual([
            {anchor: testElement().get(0), keys: ['123456']}
        ]);
    });

    it('correctly registers two keys attached to same node', function() {
        attachToBodyVisibleDiv();

        storage.register(testElement().get(0), 'key1');
        storage.register(testElement().get(0), 'key2');

        expect(storage.keys).toEqual([
            {anchor: testElement().get(0), keys: ['key1', 'key2']}
        ]);
    });

    it('registers body and html containers to body anchor', function() {
        storage.register(document.body, 'key1');
        storage.register(document.head, 'key2');

        expect(storage.keys).toEqual([
            {anchor: document.body, keys: ['key1', 'key2']}
        ]);
    });

    it('registers parent as anchor for invisible element', function() {
        attachToBodyVisibleDiv('<select><option>123</option></select>');

        storage.register($('option', testElement()).get(0), 'key1');

        expect(storage.keys).toEqual([
            {anchor: $('select', testElement()).get(0), keys: ['key1']}
        ]);

    });

    it('appends span anchor inside HTML elements as li,th,td,dd,dl', function() {
        attachToBodyVisibleDiv('<li/>');
        
        storage.register($('li', testElement()).get(0), 'key1');

        expect(storage.keys).toEqual([
            {anchor: $('li > span.__mlsHandlerAnchor', testElement()).get(0), keys: ['key1']}
        ]);
    });

    it('keeps keys array for a anchor unique', function() {
        storage.register(document.body, 'key');
        storage.register(document.body, 'key');

        expect(storage.keys).toEqual([
            {anchor: document.body, keys: ['key']}
        ]);

    });
});