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
  });
});
