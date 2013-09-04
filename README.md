# CircuitBreaker [![Build Status](https://travis-ci.org/yammer/circuit-breaker-js.png)](https://travis-ci.org/yammer/circuit-breaker-js)

[Hystrix](https://github.com/Netflix/Hystrix)-like circuit breaker for JavaScript.


## Usage

```js
var breaker = new CircuitBreaker();

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

#### windowDuration

Duration of statistical rolling window in milliseconds. This is how long metrics are kept for the circuit breaker to use and for publishing.

The window is broken into buckets and "roll" by those increments.

*Default Value:* 10000

#### numBuckets

Number of buckets the rolling statistical window is broken into.

*Default Value:* 10

#### timeoutDuration

Time in milliseconds after which a command will timeout.

*Default Value:* 3000

#### errorThreshold

Error percentage at which the circuit should trip open and start short-circuiting requests to fallback logic.

*Default Value:* 50

#### volumeThreshold

Minimum number of requests in rolling window needed before tripping the circuit will occur.

For example, if the value is 20, then if only 19 requests are received in the rolling window (say 10 seconds) the circuit will not trip open even if all 19 failed.

*Default Value:* 5

#### onCircuitOpen(metrics)

Function that is run whenever the circuit is opened (i.e. the threshold is reached). Receives the metrics for the current window as an argument.

*Default Value:* no-op

#### onCircuitClose(metrics)

Function that is run whenever the circuit is closed (i.e. the service is back up). Receives the metrics for the current window as an argument.

*Default Value:* no-op


### run(command, [fallback])

Runs a command if circuit is closed, otherwise defaults to a fallback if provided. The command is called with success and failure handlers which you need to call at the appropriate point in your command. For example, if an ajax request succeeds the the success function should be called to notify the breaker. If neither success or failed are called then the command it's assumed the command timed out.

### isOpen

Checks whether the breaker is currently accepting requests.

### forceOpen

Forces the circuit to open.

Metrics will not be collected while the circuit is forced.

### forceClose

Forces the circuit to close.

Metrics will not be collected while the circuit is forced.

### unforce

Returns the circuit to its last unforced state.


## Contributing

Install the dependencies

```sh
npm install
```

Run the tests with:

```sh
grunt test
```

or

```sh
grunt test:browser
```
