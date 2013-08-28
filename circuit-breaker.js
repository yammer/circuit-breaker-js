var CircuitBreaker = function() {
  this._successCount = 0;
  this._failCount = 0;
  this.threshold = 15;

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
  var total = this._failCount + this._successCount;
  if (total == 0) total = 1;

  var failedPercent = (this._failCount / total) * 100;

  return failedPercent > this.threshold;
};
