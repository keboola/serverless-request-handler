## serverless-request-handler

[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)
[![Build Status](https://travis-ci.org/keboola/serverless-request-handler.svg?branch=master)](https://travis-ci.org/keboola/serverless-request-handler)

Wrapper for AWS Lambda functions with API Gateway creating unified response for error states. 

By default the handler adds `'Access-Control-Allow-Origin': '*'` and `'Content-Type': 'application/json; charset=utf-8'` headers to the response.  


### Installation

1. Install npm package: `yarn add @keboola/serverless-request-handler`
2. Wrap each of your lambda handlers with this code:
```js
const { RequestHandler } = require('@keboola/serverless-request-handler');

module.exports.handler = (event, context, callback) => RequestHandler.handler(() => {
  const promise = new Promise(res => res());
  const code = 204;
  return RequestHandler.responsePromise(promise, event, context, callback, code);
}, event, context, callback);
```
  - `RequestHandler.handler()` catches uncaught exceptions
  - `RequestHandler.responsePromise()` catches rejected promises and formats output for resolved promise chain

You can also return status code and headers in the resolved promise:

```js
module.exports.handler = (event, context, callback) => RequestHandler.handler(() => {
  const promise = new Promise((res) => {
    // ...
    res({
      headers: { 'Access-Control-Allow-Headers': 'Token' },
      body: {
        message: 'Resource was created',
      },
      statusCode: 201,
    });
  });
  return RequestHandler.responsePromise(promise, event, context, callback);
}, event, context, callback);
```

### Request logging

Each request is logged to Cloudwatch in this json format:

```json
{
  "event": {
    "requestId": "4d4f1e1e-ca29-11e7-87c4-2fcc57c44b2d",
    "apiRequestId": "369391fb-ca29-11e7-90b1-95afd12f3597",
    "function": "developer-portal-prod-users",
    "httpMethod": "GET",
    "path": "/users/gdpr@test.keboola.com"
  },
  "statusCode": 200
}
```

### User Errors

If you want to return a user error, use `UserError` class which is handled by the handler automatically and the output is formatted in appropriate way. The class offer several static functions as shortcuts for most common user errors:
- `badRequest(msg = 'Bad Request')` - for 400 errors 
- `unauthorized(msg = 'Unauthorized')` - for 401 errors
- `notFound(msg = 'Not Found')` - for 404 errors
- `unauthorized(msg = 'Unauthorized')` - for 401 errors
- `unprocessable(msg = 'Unprocessable')` - for 422 errors
- `error(msg = 'Error', code = 400)` - for other errors

The handler also supports [`http-errors`](https://www.npmjs.com/package/http-errors) and recognizes errors with status code < 500 as user errors automatically.
  
#### Example:
```js
const { UserError } = require('@keboola/serverless-request-handler');

if (!token) {
  throw UserError.unauthorized('Token is missing');
}
```
User then gets such response with status code 401:
```json
{
  "errorMessage": "Token is missing",
  "errorType": "Unauthorized",
  "requestId": "4d4f1e1e-ca29-11e7-87c4-2fcc57c44b2d"
}
```
And CloudWatch log of the request is enriched with `error` field containing the error message. 
