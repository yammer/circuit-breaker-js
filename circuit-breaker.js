var CircuitBreaker = function(opts) {
  var opts = opts || {};
  this.threshold = opts.threshold || 15;
  this.minErrors = opts.minErrors || 3;
  this.duration = opts.duration || 10000;
  this.numOfBuckets = opts.numOfBuckets || 10;
  this.timeout = opts.timeout || 3000;
  this._buckets = [this._createBucket()];

  var self = this;

  this._ticker = window.setInterval(function() {
    if (self._buckets.length > self.numOfBuckets) {
      self._buckets.shift();
    }

    self._buckets.push(self._createBucket());
  }, this.duration / this.numOfBuckets);
};

CircuitBreaker.prototype._createBucket = function() {
  return { failures: 0, successes: 0, timeouts: 0, shortCircuits: 0 };
};

CircuitBreaker.prototype._lastBucket = function() {
  return this._buckets[this._buckets.length - 1];
};

CircuitBreaker.prototype.run = function(command, fallback) {
  if (this.isBroken()) {
    if (fallback) {
      fallback();
    }
    
    var bucket = this._lastBucket();
    bucket.shortCircuits++;

    return;
  }

  var self = this;
  var timedOut = false;

  var timeout = window.setTimeout(function() {
    var bucket = self._lastBucket();
    bucket.timeouts++;
    timedOut = true;
  }, this.timeout);

  var success = function() {
    if (timedOut) return;

    var bucket = self._lastBucket();
    bucket.successes++;

    window.clearTimeout(timeout);
  };

  var failed = function() {
    if (timedOut) return;

    var bucket = self._lastBucket();
    bucket.failures++;

    window.clearTimeout(timeout);
  };

  command(success, failed);
};

CircuitBreaker.prototype.isBroken = function() {
  var failures = 0, total = 0;

  for (var i = 0, l = this._buckets.length; i < l; i++) {
    var bucket = this._buckets[i];

    var errors = (bucket.failures + bucket.timeouts + bucket.shortCircuits);

    failures += errors;
    total += (errors + bucket.successes);
  }

  if (total == 0) total = 1;

  var failedPercent = (failures / total) * 100;

  return failedPercent > this.threshold && failures > this.minErrors;
};
