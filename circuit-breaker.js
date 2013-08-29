var CircuitBreaker = function(opts) {
  var opts = opts || {};
  this.threshold = opts.threshold || 15;
  this.minErrors = opts.minErrors || 3;
  this.duration = opts.duration || 10000;
  this.numOfBuckets = opts.numOfBuckets || 10;
  this.timeout = opts.timeout || 3000;
  this._buckets = [this._createBucket()];
  this._state = 'closed';

  var self = this;

  this._ticker = window.setInterval(function() {
    if (self._buckets.length > self.numOfBuckets) {
      self._buckets.shift();
    }

    self._buckets.push(self._createBucket());
  }, this.duration / this.numOfBuckets);
};

CircuitBreaker.prototype.isOpen = function() {
  return this._state == 'open';
};

CircuitBreaker.prototype._createBucket = function() {
  return { failures: 0, successes: 0, timeouts: 0, shortCircuits: 0 };
};

CircuitBreaker.prototype._lastBucket = function() {
  return this._buckets[this._buckets.length - 1];
};

CircuitBreaker.prototype.run = function(command, fallback) {
  if (this.isOpen()) {
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
    self._updateState();
  }, this.timeout);

  var success = function() {
    if (timedOut) return;

    var bucket = self._lastBucket();
    bucket.successes++;

    window.clearTimeout(timeout);
    self._updateState();
  };

  var failed = function() {
    if (timedOut) return;

    var bucket = self._lastBucket();
    bucket.failures++;

    window.clearTimeout(timeout);
    self._updateState();
  };

  command(success, failed);
};

CircuitBreaker.prototype._updateState = function() {
  var failures = 0, total = 0;

  for (var i = 0, l = this._buckets.length; i < l; i++) {
    var bucket = this._buckets[i];

    var errors = (bucket.failures + bucket.timeouts + bucket.shortCircuits);

    failures += errors;
    total += (errors + bucket.successes);
  }

  if (total == 0) total = 1;

  var failedPercent = (failures / total) * 100;

  if (failedPercent > this.threshold && failures > this.minErrors) {
    this._state = 'open';
  }
  else {
    this._state = 'closed';
  }
};
