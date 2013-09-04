// CircuitBreaker
// ==============
//
// Hystrix-like circuit breaker for JavaScript.

(function() {
  var CircuitBreaker = function(opts) {
    opts = opts || {};

    this.windowDuration  = opts.windowDuration  || 10000; // milliseconds
    this.numBuckets      = opts.numBuckets      || 10;    // number
    this.timeoutDuration = opts.timeoutDuration || 3000;  // milliseconds
    this.errorThreshold  = opts.errorThreshold  || 50;    // percentage
    this.volumeThreshold = opts.volumeThreshold || 5;     // number

    this.onCircuitOpen   = opts.onCircuitOpen   || function() {};
    this.onCircuitClose  = opts.onCircuitClose  || function() {};

    this._buckets = [this._createBucket()];
    this._state = CircuitBreaker.CLOSED;

    this._startTicker();
  };

  CircuitBreaker.OPEN = 0;
  CircuitBreaker.HALF_OPEN = 1;
  CircuitBreaker.CLOSED = 2;

  // Public API
  // ----------

  CircuitBreaker.prototype.run = function(command, fallback) {
    if (this.isOpen()) {
      this._executeFallback(fallback || function() {});
    }
    else {
      this._executeCommand(command);
    }
  };

  CircuitBreaker.prototype.forceClose = function() {
    this._forced = this._state;
    this._state = CircuitBreaker.CLOSED;
  };

  CircuitBreaker.prototype.forceOpen = function() {
    this._forced = this._state;
    this._state = CircuitBreaker.OPEN;
  };

  CircuitBreaker.prototype.unforce = function() {
    this._state = this._forced;
    this._forced = null;
  };

  CircuitBreaker.prototype.isOpen = function() {
    return this._state == CircuitBreaker.OPEN;
  };

  // Private API
  // -----------

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

        if (self.isOpen()) {
          self._state = CircuitBreaker.HALF_OPEN;
        }
      }

      self._buckets.push(self._createBucket());
    };

    setInterval(tick, bucketDuration);
  };

  CircuitBreaker.prototype._createBucket = function() {
    return { failures: 0, successes: 0, timeouts: 0, shortCircuits: 0 };
  };

  CircuitBreaker.prototype._lastBucket = function() {
    return this._buckets[this._buckets.length - 1];
  };

  CircuitBreaker.prototype._executeCommand = function(command) {
    var self = this;
    var timeout;

    var increment = function(prop) {
      return function() {
        if (!timeout) { return; }

        var bucket = self._lastBucket();
        bucket[prop]++;

        if (self._forced == null) {
          self._updateState();
        }

        clearTimeout(timeout);
        timeout = null;
      };
    };

    timeout = setTimeout(increment('timeouts'), this.timeoutDuration);

    command(increment('successes'), increment('failures'));
  };

  CircuitBreaker.prototype._executeFallback = function(fallback) {
    fallback();

    var bucket = this._lastBucket();
    bucket.shortCircuits++;
  };

  CircuitBreaker.prototype._calculateMetrics = function() {
    var totalCount = 0, errorCount = 0, errorPercentage = 0;

    for (var i = 0, l = this._buckets.length; i < l; i++) {
      var bucket = this._buckets[i];
      var errors = (bucket.failures + bucket.timeouts);

      errorCount += errors;
      totalCount += (errors + bucket.successes);
    }

    errorPercentage = (errorCount / (totalCount > 0 ? totalCount : 1)) * 100;

    return { totalCount: totalCount, errorCount: errorCount, errorPercentage: errorPercentage };
  };

  CircuitBreaker.prototype._updateState = function() {
    var metrics = this._calculateMetrics();

    if (this._state == CircuitBreaker.HALF_OPEN) {
      var lastCommandFailed = !this._lastBucket().successes && metrics.errorCount > 0;

      if (lastCommandFailed) {
        this._state = CircuitBreaker.OPEN;
      }
      else {
        this._state = CircuitBreaker.CLOSED;
        this.onCircuitClose(metrics);
      }
    }
    else {
      var overErrorThreshold = metrics.errorPercentage > this.errorThreshold;
      var overVolumeThreshold = metrics.totalCount > this.volumeThreshold;
      var overThreshold = overVolumeThreshold && overErrorThreshold;

      if (overThreshold) {
        this._state = CircuitBreaker.OPEN;
        this.onCircuitOpen(metrics);
      }
    }
  };

  var assign = function(name, obj) {
    var commonJS = typeof module != 'undefined' && module.exports;

    if (commonJS) {
      module.exports = obj;
    }
    else {
      window[name] = obj;
    }
  };

  assign('CircuitBreaker', CircuitBreaker);
})();
