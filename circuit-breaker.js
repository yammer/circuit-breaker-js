var CircuitBreaker = function(opts) {
  var opts = opts || {};
  this.threshold = opts.threshold || 15;
  this.minErrors = opts.minErrors || 3;
  this.duration = opts.duration || 10000;
  this.numOfBuckets = opts.numOfBuckets || 10;
  this.retryRate = opts.retryRate || 0.1;
  this._buckets = [{ failures: 0, successes: 0 }];

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

    if (self._buckets.length > self.numOfBuckets) {
      self._buckets.shift();
    }

    self._buckets.push(bucket);
  }, this.duration / this.numOfBuckets);
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

  return (failedPercent > this.threshold && failures > this.minErrors) && 
    Math.random() > this.retryRate;
};
