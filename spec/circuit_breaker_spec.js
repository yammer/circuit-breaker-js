describe('CircuitBreaker', function() {

  var breaker;

  var success = function() {
    var command = function(success) {
      success();
    };

    breaker.run(command);
  };

  var fail = function() {
    var command = function(success, failed) {
      failed();
    };

    breaker.run(command);
  };

  var timeout = function() {
    var command = function() {};
    breaker.run(command);

    jasmine.Clock.tick(1000);
    jasmine.Clock.tick(1000);
    jasmine.Clock.tick(1000);
  };

  beforeEach(function() {
    jasmine.Clock.useMock();
    breaker = new CircuitBreaker;
  });

  describe('with a working service', function() {

    it('should run the command', function() {
      var command = jasmine.createSpy();
      breaker.run(command);

      expect(command).toHaveBeenCalled();
    });

    it('should be able to notify the breaker if the command was successful', function() {
      success();

      var bucket = breaker._buckets[breaker._buckets.length - 1];
      expect(bucket.successes).toBe(1);
    });

    it('should be able to notify the breaker if the command failed', function() {
      fail();

      var bucket = breaker._lastBucket();
      expect(bucket.failures).toBe(1);
    });

    it('should record a timeout if not a success or failure', function() {
      timeout();

      var bucket = breaker._lastBucket();
      expect(bucket.timeouts).toBe(1);
    });

    it('should not call timeout if there is a success', function() {
      success();

      jasmine.Clock.tick(1000);
      jasmine.Clock.tick(1000);
      jasmine.Clock.tick(1000);

      var bucket = breaker._lastBucket();
      expect(bucket.timeouts).toBe(0);
    });

    it('should not call timeout if there is a failure', function() {
      fail();

      jasmine.Clock.tick(1000);
      jasmine.Clock.tick(1000);
      jasmine.Clock.tick(1000);

      var bucket = breaker._lastBucket();
      expect(bucket.timeouts).toBe(0);
    });

    it('should not record a success when there is a timeout', function() {
      var command = function(success) {
        jasmine.Clock.tick(1000);
        jasmine.Clock.tick(1000);
        jasmine.Clock.tick(1000);

        success();
      };

      breaker.run(command);

      var bucket = breaker._lastBucket();
      expect(bucket.successes).toBe(0);
    });

    it('should not record a failure when there is a timeout', function() {
      var command = function(success, fail) {
        jasmine.Clock.tick(1000);
        jasmine.Clock.tick(1000);
        jasmine.Clock.tick(1000);

        fail();
      };

      breaker.run(command);

      var bucket = breaker._lastBucket();
      expect(bucket.failures).toBe(0);
    });
  });

  describe('with a broken service', function() {

    beforeEach(function() {
      spyOn(breaker, 'isOpen').andReturn(true);
    });

    it('should not run the command', function() {
      var command = jasmine.createSpy();
      breaker.run(command);

      expect(command).not.toHaveBeenCalled();
    });

    it('should run the fallback if one is provided', function() {
      var command = jasmine.createSpy();
      var fallback = jasmine.createSpy();

      breaker.run(command, fallback);

      expect(fallback).toHaveBeenCalled();
    });

    it('should record a short circuit', function() {
      var command = jasmine.createSpy();
      breaker.run(command);

      expect(command).not.toHaveBeenCalled();

      var bucket = breaker._lastBucket();
      expect(bucket.shortCircuits).toBe(1);
    });
  });

  describe('isOpen', function() {

    it('should be false if errors are below the threshold', function() {
      breaker.errorThreshold = 75;

      fail();
      fail();
      fail();
      success();

      expect(breaker.isOpen()).toBe(false);
    });

    it('should be true if errors are above the threshold', function() {
      breaker.errorThreshold = 75;

      fail();
      fail();
      fail();
      fail();
      success();

      expect(breaker.isOpen()).toBe(true);
    });

    it('should be true if timeouts are above the threshold', function() {
      breaker.errorThreshold = 25;
      breaker.volumeThreshold = 1;

      timeout();
      timeout();
      success();

      expect(breaker.isOpen()).toBe(true);
    });

    it('should maintain failed state after window has passed', function() {
      fail();
      fail();
      fail();
      fail();

      jasmine.Clock.tick(11001);

      fail();

      expect(breaker.isOpen()).toBe(true);
    });

    it('should retry after window has elapsed', function() {
      fail();
      fail();
      fail();
      fail();

      jasmine.Clock.tick(11001);

      var command = jasmine.createSpy();
      breaker.run(command);

      expect(command).toHaveBeenCalled();
    });

    it('should include errors within the current time window', function() {
      breaker.errorThreshold = 75;

      fail();
      fail();
      fail();
      fail();
      success();

      jasmine.Clock.tick(1001);

      expect(breaker.isOpen()).toBe(true);
    });

    it('should not be broken without having more than minumum number of errors', function() {
      breaker.errorThreshold = 25;
      breaker.volumeThreshold = 1;

      fail();

      expect(breaker.isOpen()).toBe(false);
    });
  });
});
