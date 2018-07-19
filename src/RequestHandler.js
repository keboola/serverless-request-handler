import _ from 'lodash';
import UserError from './UserError';

export default class RequestHandler {
  /**
   * Logs API request to console
   */
  static logRequest(context, err, event, res = null) {
    const log = {
      event: {
        requestId: _.get(context, 'awsRequestId'),
        function: _.get(context, 'functionName'),
        httpMethod: _.get(event, 'httpMethod'),
        path: _.get(event, 'path'),
      },
    };
    _.assign(log, RequestHandler.getContextLog(event));
    _.assign(log, RequestHandler.getResultLog(res));

    if (err) {
      if ((err instanceof UserError)) {
        log.error = err.message;
      } else {
        _.assign(log, RequestHandler.getErrorLog(err));
      }
    }

    // eslint-disable-next-line no-console
    console.log(JSON.stringify(log));
    return log;
  }

  static getContextLog(event) {
    const res = {
      event: {},
    };
    if (_.has(event, 'requestContext')) {
      res.event.apiRequestId = _.get(event, 'requestContext.requestId');
      if (_.has(event, 'requestContext.identity.sourceIp')) {
        res.event.ipAddress = _.get(event, 'requestContext.identity.sourceIp');
      }
      if (_.has(event, 'requestContext.identity.userAgent')) {
        res.event.userAgent = _.get(event, 'requestContext.identity.userAgent');
      }
    }
    return res;
  }

  static getResultLog(result) {
    const res = {};
    if (result && _.has(result, 'statusCode')) {
      res.statusCode = _.get(result, 'statusCode');
    }
    return res;
  }

  static getErrorLog(err) {
    const res = {
      statusCode: 500,
      error: {
        name: err.name,
        message: err.message,
      },
    };
    if (_.has(err, 'stack')) {
      res.error.stack = err.stack.split('\n');
    }
    if (_.has(err, 'fileName')) {
      res.error.fileName = err.fileName;
    }
    if (_.has(err, 'lineNumber')) {
      res.error.lineNumber = err.lineNumber;
    }
    return res;
  }

  /**
   * Encapsulates each lambda handler and handles uncaught errors
   */
  static async handler(fn, event, context, callback) {
    try {
      const res = await fn();
      callback(null, res);
    } catch (err) {
      let res;
      if (err instanceof UserError) {
        res = RequestHandler.getResponseBody(err, null, context);
        if (_.isObject(res.body)) {
          res.body = JSON.stringify(res.body);
        }
      }
      RequestHandler.logRequest(context, err, event, res);
      callback(null, res);
    }
  }

  /**
   * Formats response for API
   */
  static getResponseBody(err, res, context, statusCode = 200, headers = {}) {
    let response;
    if (_.has(res, 'headers') && _.has(res, 'body') && _.has(res, 'statusCode') && _.size(_.keys(res)) === 3) {
      response = res;
    } else {
      response = { headers, body: res, statusCode };
    }
    if (!_.has(response.headers, 'Access-Control-Allow-Origin')) {
      response.headers['Access-Control-Allow-Origin'] = '*';
    }
    if (!_.has(response.headers, 'Content-Type')) {
      response.headers['Content-Type'] = 'application/json; charset=utf-8';
    }
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

  static response(err, res, event, context, code = 200, headers = {}) {
    if (err && !(err instanceof UserError)) {
      RequestHandler.logRequest(context, err, event);
      throw err;
    }
    const response = RequestHandler.getResponseBody(err, res, context, code, headers);

    RequestHandler.logRequest(context, err, event, response);

    response.body = response.body ? JSON.stringify(response.body) : '';
    return response;
  }
}
