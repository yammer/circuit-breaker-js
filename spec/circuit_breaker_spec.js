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

    it('should be able to notify the service the command was successful', function() {
      var command = function(success) {
        success();
      };

      breaker.run(command);

      expect(breaker._successCount).toBe(1);
    });
  });
});
