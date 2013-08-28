describe('CircuitBreaker', function() {

  var breaker;

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
      var command = function(success) {
        success();
      };

      breaker.run(command);

      expect(breaker._successCount).toBe(1);
    });

    it('should be able to notify the breaker if the command failed', function() {
      var command = function(success, failed) {
        failed();
      };

      breaker.run(command);

      expect(breaker._failCount).toBe(1);
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

      jasmine.Clock.tick(10001);

      expect(breaker.isBroken()).toBe(false);
    });
  });
});
