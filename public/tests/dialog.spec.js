describe('dialog', function() {

    beforeEach(function() {
        $('body').append($('<div id="translateDialogContainer"></div>'));
    });

    afterEach(function() {
        $('#translateDialogContainer').remove();
    });

//--------------------------------------------------------------------------------------------------

    it('reads multilanguage strings for every provided key', function() {
        var dialog = (new MuzzyTranslator('de_CH', '/')).t.dialog;
        spyOn(dialog.t, 'readStringObjects');
        dialog.popUp(['123', '456']);
        expect(dialog.t.readStringObjects).toHaveBeenCalledWith(['123', '456'], jasmine.any(Function));
    });

    it('collects string objects array in one object', function() {
        var driver = {
                readObject: function(locale, key, successCallback){
                    successCallback({object: key});
                }
            },
            dialog = (new MuzzyTranslator('de_CH', '/', driver)).t.dialog;

        dialog.t.readStringObjects(['key1', 'key2'], function(o) {
            expect(o).toEqual({
                key1: {object: 'key1'},
                key2: {object: 'key2'}
            });
        });
    });

    it('writes dialog form data as translations', function() {
        var driver = {
                writeTranslation: jasmine.createSpy()
            },
            dialog = (new MuzzyTranslator('de_CH', '/', driver)).t.dialog;

        dialog.t.writeTranslations(
            [{name: '123456', value: 'translated'},{name: '45234', value: 'translated too'}]
        );

        expect(driver.writeTranslation).toHaveBeenCalledWith('de_CH', '/', '123456', 'translated');
        expect(driver.writeTranslation).toHaveBeenCalledWith('de_CH', '/', '45234', 'translated too');
    });
});