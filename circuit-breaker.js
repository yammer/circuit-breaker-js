var CircuitBreaker = function(opts) {
  var opts = opts || {};
  this.threshold = opts.threshold || 15;
  this.minErrors = opts.minErrors || 3;
  this.duration = opts.duration || 10000;
  this.numOfBuckets = opts.numOfBuckets || 10;
  this.timeout = opts.timeout || 3000;
  this._buckets = [{ failures: 0, successes: 0, timeouts: 0 }];

  var self = this;

  this._ticker = window.setInterval(function() {
    var bucket = { failures: 0, successes: 0, timeouts: 0 };

    if (self._buckets.length > self.numOfBuckets) {
      self._buckets.shift();
    }

    self._buckets.push(bucket);
  }, this.duration / this.numOfBuckets);
};

CircuitBreaker.prototype.run = function(command) {
  if (this.isBroken()) return;

  var self = this;

  var timeout = window.setTimeout(function() {
    var bucket = self._buckets[self._buckets.length - 1];
    bucket.timeouts++;
  }, this.timeout);

  var success = function() {
    var bucket = self._buckets[self._buckets.length - 1];
    bucket.successes++;
  };

  var failed = function() {
    var bucket = self._buckets[self._buckets.length - 1];
    bucket.failures++;
  };

  command(success, failed);
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

  return failedPercent > this.threshold && failures > this.minErrors;
};
