var CircuitBreaker = function() {
  this._successCount = 0;
};

CircuitBreaker.prototype.run = function(command) {
  var self = this;

  var success = function() {
    self._successCount++;
  };

  command(success);
};
