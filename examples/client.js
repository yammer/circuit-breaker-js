var breaker = new CircuitBreaker({
  timeoutDuration: 1000,
  volumeThreshold: 1,
  errorThreshold: 10
});

breaker.onCircuitOpen = function() {
  console.log('threshold reached');
};

var fallback = function() {
  alert("Service is down");
};

var requestWithFallback = function(url, fallback) {
  var command = function(success, failure) {
    $.ajax({ url: url })
      .done(success)
      .fail(failure);
  };

  breaker.run(command, fallback);
};

$('.success', function(e) {
  requestWithFallback('/success', fallback);
});

$('.fail', function(e) {
  requestWithFallback('/fail', fallback);
});

$('.timeout', function(e) {
  requestWithFallback('/timeout', fallback);
});

$('.flaky', function(e) {
  requestWithFallback('/flaky', fallback);
});
