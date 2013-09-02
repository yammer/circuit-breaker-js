var breaker = new CircuitBreaker({
  timeoutDuration: 1000,
  volumeThreshold: 1,
  errorThreshold: 50
});

breaker.onCircuitOpen = function() {
  console.warn("Circuit open", this._state);
};

breaker.onCircuitClose = function() {
  console.warn("Circuit close", this._state);
};

var showLoading = function() {
  $('.content p').hide();
  $('.loading').show();
};

var showSuccessMessage = function() {
  $('.content p').hide();
  $('.successful').show();
};

var showFailureMessage = function() {
  $('.content p').hide();
  $('.failed').show();
};

var fallback = showFailureMessage;

var requestWithFallback = function(url, fallback) {
  showLoading();

  var command = function(success, failure) {
    $.ajax({ url: url })
      .done(function () {
        showSuccessMessage();
        success();
      })
      .fail(function() {
        showFailureMessage();
        failure();
      });
  };

  breaker.run(command, fallback);
};

$(function() {
  $('.success').click(function(e) {
    requestWithFallback('/success', fallback);
  });

  $('.fail').click(function(e) {
    requestWithFallback('/fail', fallback);
  });

  $('.timeout').click(function(e) {
    requestWithFallback('/timeout', fallback);
  });

  $('.flaky').click(function(e) {
    requestWithFallback('/flaky', fallback);
  });

  $('.open').click(function(e) {
    breaker.forceOpen();
  });

  $('.close').click(function(e) {
    breaker.forceClose();
  });

  $('.unforce').click(function(e) {
    breaker.unforce();
  });
});
