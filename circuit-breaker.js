var CircuitBreaker = function() {
  this._successCount = 0;
  this._failCount = 0;

  var self = this;

  this.success = function() {
    self._successCount++;
  };

  this.failed = function() {
    self._failCount++;
  };
};

CircuitBreaker.prototype.run = function(command) {
  if (this.isBroken()) return;

  command(this.success, this.failed);
};

CircuitBreaker.prototype.isBroken = function() {
  return this._failCount > this._successCount;
};
