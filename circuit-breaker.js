var CircuitBreaker = function() {
  this._buckets = [{ failures: 0, successes: 0 }];
  this.threshold = 15;
  this.rollingWindow = 10000;
  this.numOfBuckets = 10;

  var self = this;

  this.success = function() {
    var bucket = self._buckets[self._buckets.length - 1];
    bucket.successes++;
  };

  this.failed = function() {
    var bucket = self._buckets[self._buckets.length - 1];
    bucket.failures++;
  };

  this._ticker = window.setInterval(function() {
    var bucket = { failures: 0, successes: 0 };

    if (self._buckets.length > 10) {
      self._buckets.shift();
    }

    self._buckets.push(bucket);
  }, this.rollingWindow / this.numOfBuckets);
};

CircuitBreaker.prototype.run = function(command) {
  if (this.isBroken()) return;

  command(this.success, this.failed);
};

CircuitBreaker.prototype.isBroken = function() {
  var failures = 0, successes = 0;

  for (var i = 0, l = this._buckets.length; i < l; i++) {
    var bucket = this._buckets[i];

    failures += bucket.failures;
    successes += bucket.successes;
  }

  var total = failures + successes;
  if (total == 0) total = 1;

  var failedPercent = (failures / total) * 100;

  return failedPercent > this.threshold;
};
