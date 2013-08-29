var CircuitBreaker = function(opts) {
  opts = opts || {};

  this.windowDuration  = opts.windowDuration  || 10000; // milliseconds
  this.numBuckets      = opts.numBuckets      || 10;    // number
  this.timeoutDuration = opts.timeoutDuration || 3000;  // milliseconds
  this.errorThreshold  = opts.errorThreshold  || 50;    // percentage
  this.volumeThreshold = opts.volumeThreshold || 5;     // number

  this._buckets = [this._createBucket()];
  this._state = 'closed';

  var self = this;
  var count = 0;

  this._ticker = window.setInterval(function() {
    if (self._buckets.length > self.numBuckets) {
      self._buckets.shift();
    }

    count++;

    if (count > self.numBuckets) {
      count = 0;
      self._state = 'half open';
    }

    self._buckets.push(self._createBucket());
  }, this.windowDuration / this.numBuckets);
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
  }, this.timeoutDuration);

  var success = function() {
    if (timedOut) {
      return;
    }

    var bucket = self._lastBucket();
    bucket.successes++;

    window.clearTimeout(timeout);
    self._updateState();
  };

  var failed = function() {
    if (timedOut) {
      return;
    }

    var bucket = self._lastBucket();
    bucket.failures++;

    window.clearTimeout(timeout);
    self._updateState();
  };

  command(success, failed);
};

CircuitBreaker.prototype._updateState = function() {
  var totalCount = 0, errorCount = 0, errorPercentage = 0;

  for (var i = 0, l = this._buckets.length; i < l; i++) {
    var bucket = this._buckets[i];

    var errors = (bucket.failures + bucket.timeouts + bucket.shortCircuits);

    errorCount += errors;
    totalCount += (errors + bucket.successes);
  }

  errorPercentage = (errorCount / (totalCount > 0 ? totalCount : 1)) * 100;

  if (this._state == 'half open' && this._lastBucket().successes && errorCount == 0) {
    this._state = 'closed';
  }
  else if (this._state == 'half open' && !this._lastBucket().successes && errorCount > 0) {
    this._state = 'open';
  }
  else if (errorPercentage > this.errorThreshold && totalCount > this.volumeThreshold) {
    this._state = 'open';
  }
  else {
    this._state = 'closed';
  }
};
