var CircuitBreaker = function(opts) {
  opts = opts || {};

  this.windowDuration  = opts.windowDuration  || 10000; // milliseconds
  this.numBuckets      = opts.numBuckets      || 10;    // number
  this.timeoutDuration = opts.timeoutDuration || 3000;  // milliseconds
  this.errorThreshold  = opts.errorThreshold  || 50;    // percentage
  this.volumeThreshold = opts.volumeThreshold || 5;     // number

  this._buckets = [this._createBucket()];
  this._state = CircuitBreaker.CLOSED;

  this._startTicker();
};

CircuitBreaker.OPEN = 0;
CircuitBreaker.HALF_OPEN = 1;
CircuitBreaker.CLOSED = 2;

CircuitBreaker.prototype._startTicker = function() {
  var self = this;
  var bucketIndex = 0;
  var bucketDuration = this.windowDuration / this.numBuckets;

  var tick = function() {
    if (self._buckets.length > self.numBuckets) {
      self._buckets.shift();
    }

    bucketIndex++;

    if (bucketIndex > self.numBuckets) {
      bucketIndex = 0;
      self._state = CircuitBreaker.HALF_OPEN;
    }

    self._buckets.push(self._createBucket());
  };

  window.setInterval(tick, bucketDuration);
};

CircuitBreaker.prototype.isOpen = function() {
  return this._state == CircuitBreaker.OPEN;
};

CircuitBreaker.prototype._createBucket = function() {
  return { failures: 0, successes: 0, timeouts: 0, shortCircuits: 0 };
};

CircuitBreaker.prototype._lastBucket = function() {
  return this._buckets[this._buckets.length - 1];
};

CircuitBreaker.prototype._executeCommand = function(command) {
  var self = this;
  var timedOut = false;

  var recordTimeout = function() {
    var bucket = self._lastBucket();
    bucket.timeouts++;
    timedOut = true;
    self._updateState();
  };

  var timeout = window.setTimeout(recordTimeout, this.timeoutDuration);

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

CircuitBreaker.prototype._executeFallback = function(fallback) {
  fallback();

  var bucket = this._lastBucket();
  bucket.shortCircuits++;
};

CircuitBreaker.prototype.run = function(command, fallback) {
  if (this.isOpen()) {
    this._executeFallback(fallback || function() {});
  }
  else {
    this._executeCommand(command);
  }
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

  if (this._state == CircuitBreaker.HALF_OPEN && this._lastBucket().successes && errorCount == 0) {
    this._state = CircuitBreaker.CLOSED;
  }
  else if (this._state == CircuitBreaker.HALF_OPEN && !this._lastBucket().successes && errorCount > 0) {
    this._state = CircuitBreaker.OPEN;
  }
  else if (errorPercentage > this.errorThreshold && totalCount > this.volumeThreshold) {
    this._state = CircuitBreaker.OPEN;
  }
  else {
    this._state = CircuitBreaker.CLOSED;
  }
};
