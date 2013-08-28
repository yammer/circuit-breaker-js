describe('CircuitBreaker', function() {

  var breaker;

  beforeEach(function() {
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
});
