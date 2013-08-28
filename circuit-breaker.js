var CircuitBreaker = function() {
  this._successCount = 0;
  this._failCount = 0;
};

CircuitBreaker.prototype.run = function(command) {
  var self = this;

  var success = function() {
    self._successCount++;
  };

  var failed = function() {
    self._failCount++;
  };

  command(success, failed);
};
