/**
 * Test dependencies.
 */

var cache;
var should = require('should');

describe("unit:cache", function() {
  
  before(function(){
    cache = require("../lib/cache.js");
    cache = cache.cache({interval: 1,
                         evict: 'LRU',
                         size: 3});
  });

  it('should return cached value', function(done){
    //used to assert the getter got called
    var called = false;
    var numcall = 0;

    var getter = function(key, cb) {
      var blockingMock = {hello : "world"};
      called = true;
      cb(null, blockingMock[key]);
      numcall++;
      if(numcall > 1)
        throw new Error('getter called on supossedly cached value');
    };

    cache.get("hello", { getter: getter,
                         timeout: 2}, function(err, val) {
                           should.equal(val, "world");
                           //assert cache miss
                           true.should.equal(called);
                           called = false;
                         });


    cache.get("hello", { getter: getter,
                         timeout: 2}, function(err, val) {
                           should.equal(val, "world");
                           //assert cache hit
                           false.should.equal(called);
                           done();
                         });
  }); 
  
  
  it('should hit the cache two times, testing timeout', function(done){
    //used to assert the getter got called
    var called = false;
    
    var getter = function(key, cb) {
      var blockingMock = {hello : "world"};
      called = true;
      cb(null, blockingMock[key]);
    };
    
    cache.invalidate();
    
    cache.get("hello", { getter: getter,
                         timeout: 2}, function(err, val) {
                           should.equal(val, "world");
                           //assert cache hit
                           true.should.equal(called);
                           called = false;
                         });
    
    setTimeout(function() {
      cache.get("hello", { getter: getter,
                           timeout: 2}, function(err, val) {
                             should.equal(val, "world");
                             //assert cache hit
                             true.should.equal(called);
                             called = false;
                             done();
                           });
    }, 5);
  });
  
  //many concurrent hits
  it('should do one cache hit', function(done) {
    var called = false;
    var getter = function(key, cb) {
      var blockingMock = {hello : "world"};
      called = true;
      cb(null, blockingMock[key]);
    };
    
    cache.invalidate();
    
    cache.get("hello", { getter: getter,
                         timeout: 2}, function(err, val) {
                           should.equal(val, "world");
                           //assert cache hit
                           true.should.equal(called);
                           called = false;
                         });

    cache.get("hello", { getter: getter,
                         timeout: 2}, function(err, val) {
                           should.equal(val, "world");
                           //assert no cache hit
                           false.should.equal(called);
                         });
    
    cache.get("hello", { getter: getter,
                         timeout: 2}, function(err, val) {
                           should.equal(val, "world");
                           //assert no cache hit
                           false.should.equal(called);
                         });
    
    cache.get("hello", { getter: getter,
                         timeout: 2}, function(err, val) {
                           should.equal(val, "world");
                           //assert no cache hit
                           false.should.equal(called);
                           done();
                         }); 
  });
  
  it('should invalidate keys staring with "h" ', function(done) {
    var called = false;
    var getter = function(key, cb) {
      var blockingMock = {hello : "world"};
      called = true;
      cb(null, blockingMock[key]);
    };
    
    cache.invalidate();
    
    cache.get("hello", { getter: getter,
                         timeout: 2}, function(err, val) {
                           should.equal(val, "world");
                           //assert cache hit
                           true.should.equal(called);
                           called = false;
                         }); 
    var re = /^h/;
    cache.invalidate(re);
    
    cache.get("hello", { getter: getter,
                         timeout:2}, function(err, val) {
                           should.equal(val, "world");
                           //assert cache hit
                           true.should.equal(called);
                           called = false;
                           done();
                         });
    // test w/ 3 values 2 matching one non matching
  });

  it("woo", function(done) {
    
    var getter = function(key, cb) {
      var blockingMock = [0, 1, 2, 3, 4];
      setTimeout(function() {
        cb(null, blockingMock[key]); 
      }, 5);
    };
    
    cache.invalidate();
    
    for(var i = 0; i < 5 ; i++) {
      (function(i) {
        setTimeout(function() {
          cache.get(i, { getter: getter }, function(err, val) {
            should.equal(val, i);
            if(i == 4) {
              done();
            }
          });
        }, i);
      })(i);
    }
    
  });

  describe("LRU",function() {
    it('should invalidate least used element when the cache is full', function(done){
      //used to assert the getter got called
      var called = false;
      
      var getter = function(key, cb) {
        var blockingMock = {
          Switzerland : "Geneva",
          France: "Paris",
          Germany: "Berlin",
          UK: "London"
        };
        called = true;
        cb(null, blockingMock[key]);
      };
      
      cache.invalidate();
      
      cache.get("Switzerland", { getter: getter },
                function(err, val) {
                  should.equal(val, "Geneva");
                  //assert cache hit
                  true.should.equal(called);
                  called = false;
                  done();
                  });
      
      setTimeout(function() {
        cache.get("France", { getter: getter},
                  function(err, val) {
                    should.equal(val, "Paris");
                    //assert cache hit
                    true.should.equal(called);
                    called = false;
                  });
        
        cache.get("Germany", { getter: getter},
                  function(err, val) {
                    should.equal(val, "Berlin");
                    //assert cache hit
                    true.should.equal(called);
                    called = false;
                  });
        
        cache.get("UK", { getter: getter},
                  function(err, val) {
                    should.equal(val, "London");
                    //assert cache hit
                    true.should.equal(called);
                    called = false;
                  });
        
        
        cache.get("Switzerland", { getter: getter },
                  function(err, val) {
                    should.equal(val, "Geneva");
                    //assert cache hit
                    true.should.equal(called);
                    called = false;
                    done();
                  });
      }, 4);
      
    });
  });    
});
