var breaker = new CircuitBreaker({
  timeoutDuration: 1000,
  volumeThreshold: 1,
  errorThreshold: 50
});

breaker.onCircuitOpen = function(metrics) {
  console.warn('Circuit open', metrics);
};

breaker.onCircuitClose = function(metrics) {
  console.warn('Circuit close', metrics);
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
  $('.success').click(function() {
    requestWithFallback('/success', fallback);
  });

  $('.fail').click(function() {
    requestWithFallback('/fail', fallback);
  });

  $('.timeout').click(function() {
    requestWithFallback('/timeout', fallback);
  });

  $('.flaky').click(function() {
    requestWithFallback('/flaky', fallback);
  });

  $('.open').click(function() {
    breaker.forceOpen();
  });

  $('.close').click(function() {
    breaker.forceClose();
  });

  $('.unforce').click(function() {
    breaker.unforce();
  });
});
