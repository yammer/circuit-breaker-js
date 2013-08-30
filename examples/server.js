var express = require('express');
var app = express();

app.get('/success', function(req, res) {
  res.end("Success");
});

app.get('/fail', function(req, res) {
  res.setHeader('Status-Code', 500);
  res.end("Failure");
});

app.get('/timeout', function(req, res) {
  setTimeout(function() {
    res.end("Timed out");
  }, 10000);
});

app.get('/flaky', function(req, res) {
  if (Math.random > 0.5) {
    res.setHeader('Status-Code', 500);
  }

  res.end("Flaky");
});

app.listen(3000);
