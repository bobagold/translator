describe('handler', function() {

    var anchor;

    function installedHandle() {
        return anchor.siblings('a.__mlsHandle');
    }

    beforeEach(function() {
        anchor = jQuery('<div/>').appendTo('body');
    });

    afterEach(function() {
        installedHandle().remove();
        anchor.remove();
    });

//--------------------------------------------------------------------------------------------------

    it('attaches link before provided anchor', function() {
        var handler = new MuzzyTranslator('de', '/').t.handler;

        handler.install(anchor, []);
        expect(installedHandle().length).toEqual(1);
    });

    it('sets dialog.open() callback to handler', function() {
        var dialogStub = {
                popUp: jasmine.createSpy()
            },
            handler = new MuzzyTranslator('de', '/', {}, {dialog: dialogStub}).t.handler;

        handler.install(anchor, ['12345']);

        installedHandle().trigger('click');

        expect(dialogStub.popUp).toHaveBeenCalledWith(['12345']);
    });
});