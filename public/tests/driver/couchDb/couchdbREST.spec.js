describe('couchdbREST', function() {

    var rest;

    function successCallback() {}
    function error404Callback() {}

    function fakeGetRequest() {
        spyOn(jQuery, 'ajax');
        rest.get('/location', successCallback, error404Callback);
        return jQuery.ajax.mostRecentCall.args[0];
    }

    function fakePutRequest(data) {
        spyOn(jQuery, 'ajax');
        rest.put('/location', data || {}, successCallback, error404Callback);
        return jQuery.ajax.mostRecentCall.args[0];
    }

    function fakeDeleteRequest(data) {
        spyOn(jQuery, 'ajax');
        rest.del('/location', successCallback, error404Callback);
        return jQuery.ajax.mostRecentCall.args[0];
    }

//--------------------------------------------------------------------------------------------------

    beforeEach(function() {
        rest = new MuzzyTranslatorCouchDbDriver().t.restInterface;
    });

    it('has access to couchDb server', function() {
        var returnValue;
        rest.get('/couchdb/', function(data) {returnValue = data;});
        waitsFor(function(){return returnValue !== undefined;}, 'CouchDb server is not responding');
    });

//--------------------------------------------------------------------------------------------------

    it('calls jQuery on get request', function() {
        fakeGetRequest();
        expect(jQuery.ajax).toHaveBeenCalled();
    });

    it('uses GET method for get request', function() {
        var args = fakeGetRequest();
        expect(args.type).toBe('GET');
    });

    it('defines Json data format', function() {
        var args = fakeGetRequest();
        expect(args.contentType).toBe('application/json');
        expect(args.dataType).toBe('json');
    });

    it('passes through url', function() {
        var args = fakeGetRequest();
        expect(args.url).toBe('/location');
    });

    it('passes through callbacks', function() {
        var args = fakeGetRequest();
        expect(args.success).toBe(successCallback);
        expect(args.statusCode['404']).toBe(error404Callback);
    });

//--------------------------------------------------------------------------------------------------

    it('calls jQuery on put request', function() {
        fakePutRequest();
        expect(jQuery.ajax).toHaveBeenCalled();
    });

    it('uses PUT method for put request', function() {
        var args = fakePutRequest();
        expect(args.type).toBe('PUT');
    });

    it('passes through url', function() {
        var args = fakePutRequest();
        expect(args.url).toBe('/location');
    });

    it('defines Json data format', function() {
        var args = fakePutRequest();
        expect(args.contentType).toBe('application/json');
        expect(args.dataType).toBe('json');
    });

    it('passes through data', function() {
        var args = fakePutRequest({"data": 1});
        expect(args.data).toEqual('{"data":1}');
    });

    it('passes through callbacks', function() {
        var args = fakePutRequest();
        expect(args.success).toBe(successCallback);
        expect(args.statusCode['404']).toBe(error404Callback);
    });

//--------------------------------------------------------------------------------------------------

    it('calls jQuery on delete request', function() {
        fakeDeleteRequest();
        expect(jQuery.ajax).toHaveBeenCalled();
    });

    it('passes through url', function() {
        var args = fakeDeleteRequest();
        expect(args.url).toEqual('/location');
    });

});