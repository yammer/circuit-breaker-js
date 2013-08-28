var CircuitBreaker = function() {
};

CircuitBreaker.prototype.run = function(command) {
  command();
};
