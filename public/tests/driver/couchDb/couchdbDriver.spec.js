describe('couchdbDriver', function() {

    var locale = 'de_CH',
        pageId = 'page/Id',
        localizedStringObject = {
            defaultTranslation: 'Eins',
            pageTranslations: {index : 'eins.', form : 'eine'}
        };

    function mockedDriver(restMock, installerMock) {
        return new MuzzyTranslatorCouchDbDriver({
            restInterface: restMock,
            dbInstaller: installerMock
        });
    }

    function callDriverMethodAndCatchRestUri(method, args) {
        var collectedGetUri,
            collectedPutUri,
            collectedDelUri,
            driverMethod = mockedDriver({
                get: function(uri){
                    collectedGetUri = uri;
                },
                put: function(uri, data){
                    collectedPutUri = uri;
                },
                del: function(uri){
                    collectedDelUri = uri;
                }
            })[method];

        driverMethod.apply(driverMethod, args);

        return {
            get : collectedGetUri,
            put : collectedPutUri,
            del : collectedDelUri
        };
    }

//--------------------------------------------------------------------------------------------------

    it('queries correct URI on reading translation object', function() {
        expect(
            callDriverMethodAndCatchRestUri(
                'readObject',
                [locale, '1234567890']
            ).get
        ).toEqual('/couchdb/de_ch/1234567890');
    });

//--------------------------------------------------------------------------------------------------

    it ('calls correct view on reading page ids', function() {
        expect(
            callDriverMethodAndCatchRestUri(
                'readPageIds',
                [locale]
            ).get
        ).toEqual('/couchdb/de_ch/_design/pages/_view/all_ids?group=true');
    });

    it ('calls correct view on reading page objects', function() {
        expect(
            callDriverMethodAndCatchRestUri(
                'readPageObjects',
                [locale, pageId]
            ).get
        ).toEqual('/couchdb/de_ch/_design/objects/_view/by_page_id?key="page/Id"');
    });

//--------------------------------------------------------------------------------------------------

    it ('deletes locale', function() {
        expect(
            callDriverMethodAndCatchRestUri(
                'deleteTranslations',
                [locale]
            ).del
        ).toEqual('/couchdb/de_ch');
    });

//--------------------------------------------------------------------------------------------------

    it ('reads localized string before writing translation', function() {
        var getUri, putUri;

        mockedDriver({
            get: function(uri, successCallback){
                getUri = uri;
                putUri = null;
                successCallback(localizedStringObject);
            },
            put: function(uri, data){
                putUri = uri;
            }
        }).writeTranslation(locale, pageId, 'one', 'eins');

        expect(getUri).toEqual('/couchdb/de_ch/one');
        expect(putUri).toEqual('/couchdb/de_ch/one');
    });

    it ('creates localized string object for new translation', function() {
        var putUri, putData;

        mockedDriver({
            get: function(uri, successCallback, notFoundCallback){
                notFoundCallback();
            },
            put: function(uri, data){
                putUri = uri;
                putData = data;
            }
        }).writeTranslation(locale, pageId, 'one', 'eins');

        expect(putUri).toContain('/de_ch/one');
        expect(putData).toEqual({defaultTranslation: 'eins' , pageTranslations: {'page/Id': null}});
    });

    it ('can create database for a locale', function() {

        var installerSpy = jasmine.createSpy('install');

        mockedDriver(
            {
                get: function(url, successCallback, notFoundCallback) {
                    notFoundCallback();
                },
                put: function(url, data, successCallback, notFoundCallback) {
                    notFoundCallback({responseText: '"no_db_file"'});
                }
            },
            { install: installerSpy }
        )
            .writeTranslation(locale, pageId, 'one', 'eins');

        expect(installerSpy).toHaveBeenCalledWith('de_CH', jasmine.any(Function));

    });

//--------------------------------------------------------------------------------------------------

    it('calls success callback on reading page ids', function() {
        var spy = jasmine.createSpy();
        mockedDriver({
            get: function(url, successCallback){
                successCallback({rows:[]});
            }
        }).readPageIds(locale, spy);
        expect(spy).toHaveBeenCalled();
    });

    it('calls success callback on reading page objects', function() {
        var spy = jasmine.createSpy();
        mockedDriver({
            get: function(url, successCallback){
                successCallback({rows:[]});
            }
        }).readPageObjects(locale, pageId, spy);
        expect(spy).toHaveBeenCalled();
    });

});