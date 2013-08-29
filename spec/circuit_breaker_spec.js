describe('CircuitBreaker', function() {

  var breaker;

  beforeEach(function() {
    spyOn(Math, 'random').andReturn(1);
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
      var command = function(success) {
        success();
      };

      breaker.run(command);

      var bucket = breaker._buckets[breaker._buckets.length - 1];
      expect(bucket.successes).toBe(1);
    });

    it('should be able to notify the breaker if the command failed', function() {
      var command = function(success, failed) {
        failed();
      };

      breaker.run(command);

      var bucket = breaker._buckets[breaker._buckets.length - 1];
      expect(bucket.failures).toBe(1);
    });
  });

  describe('with a broken service', function() {

    it('should not run the command', function() {
      spyOn(breaker, 'isBroken').andReturn(true);

      var command = jasmine.createSpy();
      breaker.run(command);

      expect(command).not.toHaveBeenCalled();
    });
  });

  describe('isBroken', function() {

    it('should be false with successful calls', function() {
      breaker.success();

      expect(breaker.isBroken()).toBe(false);
    });

    it('should be true with failed calls', function() {
      breaker.minErrors = 0;
      breaker.failed();

      expect(breaker.isBroken()).toBe(true);
    });

    it('should be false if errors are below the threshold', function() {
      breaker.threshold = 75;

      breaker.failed();
      breaker.failed();
      breaker.failed();
      breaker.success();

      expect(breaker.isBroken()).toBe(false);
    });

    it('should be true if errors are above the threshold', function() {
      breaker.threshold = 75;

      breaker.failed();
      breaker.failed();
      breaker.failed();
      breaker.failed();
      breaker.success();

      expect(breaker.isBroken()).toBe(true);
    });

    it('should ignore errors outside of the current time window', function() {
      breaker.threshold = 75;

      breaker.failed();
      breaker.failed();
      breaker.failed();
      breaker.failed();
      breaker.success();

      jasmine.Clock.tick(11001);

      expect(breaker.isBroken()).toBe(false);
    });

    it('should include errors within of the current time window', function() {
      breaker.threshold = 75;

      breaker.failed();
      breaker.failed();
      breaker.failed();
      breaker.failed();
      breaker.success();

      jasmine.Clock.tick(1001);

      expect(breaker.isBroken()).toBe(true);
    });

    it('should not be broken without having more than minumum number of errors', function() {
      breaker.threshold = 25;
      breaker.minErrors = 1;

      breaker.failed();

      expect(breaker.isBroken()).toBe(false);
    });
  });
});
