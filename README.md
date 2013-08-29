# circuit-breaker.js

Hystrix-like system for javascript.

## Install

  npm install

## Testing

  grunt test

or

  grunt test:browser

## Usage

```js
  var breaker = new CircuitBreaker;

  var command = function(success, failed) {
    restCall()
      .done(success)
      .fail(failed);
  };

  var fallback = function() {
    alert("Service is down");
  };

  breaker.run(command, fallback);
```

## API

### CircuitBreaker([config])

Create a new instance of a circuit breaker. Accepts the following config options:
- threshold: percentage of errors allowed. Defaults to 15%.
- minErrors: minimum number of errors allowed before circuit is broken. Defaults to 3.
- duration: rolling window for checking errors. Defaults to 10000.
- numOfBuckets: number of time buckets within the rolling window. Defaults to 10.
- timeout: how long requests should wait before assuming a timeout. Defaults to 3000.

### run(command, [fallback])

Runs a command if circuit is closed, otherwise defaults to a fallback if provided. The command is called with success and failure handlers which you need to call at the appropriate point in your command. For example, if an ajax request succeeds then the success function should be called to notify the breaker. If neither success or failed are called then the command it's assumed the command timed out.

### isOpen

Checks whether the breaker is currently accepting requests.
