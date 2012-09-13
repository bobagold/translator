describe('translations', function() {

    var dbDriverStub,
        localizedStringObject = {
            defaultTranslation: 'Eins',
            pageTranslations: {index : 'eins.', form : 'eine'}
        };

    function translations(driverStub, pageId) {
        dbDriverStub = driverStub;
        return new MuzzyTranslations('de_CH', pageId || 'index/index', driverStub);
    }

//--------------------------------------------------------------------------------------------------

    it('obligated to be at t.* subdomain', function() {
        expect(document.location.hostname).toMatch(/^t\..+/);
    });

//--------------------------------------------------------------------------------------------------

    it('delegates reading a translation', function() {

        translations({readObject: jasmine.createSpy()}).translate('Cancel');

        expect(dbDriverStub.readObject)
                .toHaveBeenCalledWith('de_CH', 'Cancel', jasmine.any(Function));
    });

    it('returns global translation value for unlisted pageId', function() {
        var result;

        translations({
            readObject: function(locale, key, successCallback){
                successCallback(localizedStringObject);
            }
        }).translate('foo', function(t) { result = t; });

        expect(result).toEqual('Eins');
    });

    it('returns translation key for not existing translation', function() {
        var result;

        translations({
            readObject: function(locale, key, successCallback){
                successCallback({defaultTranslation:null, pageTranslations: {}});
            }
        }).translate('foo', function(t) { result = t; });

        expect(result).toEqual('foo');
    });

    it('returns local page translation of defined', function() {
        var result;

        translations(
            {
                readObject: function(locale, key, successCallback){
                    successCallback(localizedStringObject);
                }
            },
            'form'
        ).translate('foo', function(t) { result = t; });

        expect(result).toEqual('eine');
    });

//--------------------------------------------------------------------------------------------------

    it('delegates reading of translations of a page', function() {
        translations({readPageObjects: jasmine.createSpy()}).all();

        expect(dbDriverStub.readPageObjects)
            .toHaveBeenCalledWith('de_CH', 'index/index', jasmine.any(Function));
    });

    it('creates key-value map of page translations', function() {
        var result,
            arrayOfRecordsFromDb = [
                {key:'123', defaultTranslation:'glob', pageTranslations:{}},
                {key:'456', defaultTranslation:'glob2', pageTranslations:{'index/index': 'loc'}}
            ];

        translations({
            readPageObjects: function(locale, key, successCallback){
                successCallback(arrayOfRecordsFromDb);
            }
        }).all(function(o) { result = o; });

        expect(result).toEqual({
            '123': 'glob',
            '456': 'loc'
        });
    })
});
