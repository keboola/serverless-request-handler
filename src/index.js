'use strict';

const _ = require('lodash');

class UserError extends Error {
  constructor(...args) {
    super(...args);
    Error.captureStackTrace(this, UserError);
  }

  static badRequest(msg = 'Bad Request') {
    const err = new UserError(msg);
    err.code = 400;
    err.type = 'BadRequest';
    return err;
  }

  static unauthorized(msg = 'Unauthorized') {
    const err = new UserError(msg);
    err.code = 401;
    err.type = 'Unauthorized';
    return err;
  }

  static notFound(msg = 'Not Found') {
    const err = new UserError(msg);
    err.code = 404;
    return err;
  }

  static unprocessable(msg = 'Unprocessable') {
    const err = new UserError(msg);
    err.code = 422;
    return err;
  }

  static error(msg = 'Error', code = 400) {
    const err = new UserError(msg);
    err.code = code;
    return err;
  }
}

class RequestHandler {
  /**
   * Logs API request to console
   */
  static logRequest(context, err, event, res = null) {
    const log = {
      event: {
        requestId: context.awsRequestId,
        apiRequestId: event.requestContext.requestId,
        function: context.functionName,
        httpMethod: event.httpMethod,
        path: event.path,
      },
    };
    if (res && 'statusCode' in res) {
      log.statusCode = res.statusCode;
    }
    if (err) {
      if ((err instanceof UserError)) {
        log.error = err.message;
      } else {
        log.statusCode = 500;
        log.error = {
          name: err.name,
          message: err.message,
        };
        if ('stack' in err) {
          log.error.stack = err.stack.split('\n');
        }
        if ('fileName' in err) {
          log.error.fileName = err.fileName;
        }
        if ('lineNumber' in err) {
          log.error.lineNumber = err.lineNumber;
        }
      }
    }

    console.log(JSON.stringify(log));
  }

  /**
   * Encapsulates each lambda handler and handles uncaught user errors
   */
  static handler(fn, event, context, cb) {
    try {
      fn();
    } catch (err) {
      if (!(err instanceof UserError)) {
        RequestHandler.logRequest(context, err, event);
        throw err;
      }
      const res = RequestHandler.getResponseBody(err, null, context);
      if (_.isObject(res.body)) {
        res.body = JSON.stringify(res.body);
      }
      RequestHandler.logRequest(context, err, event, res);
      return cb(null, res);
    }
  }

  /**
   * Formats response for API
   */
  static getResponseBody(err, res, context, code = 200) {
    const response = {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json; charset=utf-8',
      },
      statusCode: code,
      body: res,
    };
    if (err) {
      response.statusCode = _.isNumber(err.code) ? err.code : 400;
      response.body = {
        errorMessage: err.message,
        errorType: err.type,
        requestId: context.awsRequestId,
      };
    }

    return response;
  }

  /**
   * Returns result of promise chain to API and handles rejection
   */
  static responsePromise(promise, event, context, callback, code = 200) {
    return promise
      .then(res => RequestHandler.response(null, res, event, context, callback, code))
      .catch(err => RequestHandler.response(err, null, event, context, callback));
  }

  static response(err, res, event, context, cb, code = 200) {
    if (err && !(err instanceof UserError)) {
      RequestHandler.logRequest(context, err, event);
      throw err;
    }
    const response = RequestHandler.getResponseBody(err, res, context, code);

    RequestHandler.logRequest(context, err, event, response);

    response.body = response.body ? JSON.stringify(response.body) : '';
    cb((err instanceof UserError) ? null : err, response);
  }
}

module.exports = { RequestHandler, UserError };
