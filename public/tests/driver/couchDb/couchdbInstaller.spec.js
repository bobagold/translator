describe('couchdbInstaller', function() {

    var installer,
        collectedPutUri,
        collectedPutData,
        restPutStub = {
            put: function(uri, data, successCallback) {
                collectedPutUri.push(uri);
                collectedPutData.push(data);
                if (successCallback) successCallback();
            }
        };

    beforeEach(function() {
        installer = new MuzzyTranslatorCouchDbDriver({restInterface:restPutStub}).t.dbInstaller;
        collectedPutUri = [];
        collectedPutData = [];
    });

//--------------------------------------------------------------------------------------------------

    it('first creates database for defined locale', function() {
        installer.install('ru_RU');
        expect(collectedPutUri[0]).toEqual('/couchdb/ru_ru')
    });

    it('creates views pages all_ids', function() {
        installer.install('ru_RU');
        var expectedUri = '/couchdb/ru_ru/_design/pages',
            collectedData = collectedPutData[collectedPutUri.indexOf(expectedUri)];

        expect(collectedPutUri).toContain(expectedUri);
        expect(collectedData.views.all_ids).toBeDefined();
    });

    it('creates views objects by_page_id', function() {
        installer.install('ru_RU');
        var expectedUri = '/couchdb/ru_ru/_design/objects',
            collectedData = collectedPutData[collectedPutUri.indexOf(expectedUri)];

        expect(collectedPutUri).toContain(expectedUri);
        expect(collectedData.views.by_page_id).toBeDefined();
    });

    it('creates update validate callback', function() {
        installer.install('ru_RU');
        var expectedUri = '/couchdb/ru_ru/_design/auth',
            collectedData = collectedPutData[collectedPutUri.indexOf(expectedUri)];

        expect(collectedPutUri).toContain(expectedUri);
        expect(collectedData.validate_doc_update).toBeDefined();
    });

    it('calls success callback', function() {
        var successCallback = jasmine.createSpy();
        installer.install('ru_RU', successCallback);
        expect(successCallback).toHaveBeenCalled();
    });
});