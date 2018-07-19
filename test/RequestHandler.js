import expect from 'unexpected';

import RequestHandler from '../src/RequestHandler';
import UserError from '../src/UserError';

describe('RequestHandler', () => {
  it('getContextLog', () => {
    const res = RequestHandler.getContextLog({
      requestContext: {
        requestId: 'requestId',
        identity: {
          sourceIp: 'ipAddress',
          userAgent: 'userAgent',
        },
      },
    });
    expect(res, 'to have key', 'event');
    expect(res.event, 'to have key', 'apiRequestId');
    expect(res.event.apiRequestId, 'to be', 'requestId');
    expect(res.event, 'to have key', 'ipAddress');
    expect(res.event.ipAddress, 'to be', 'ipAddress');
    expect(res.event, 'to have key', 'userAgent');
    expect(res.event.userAgent, 'to be', 'userAgent');
  });

  it('getResultLog', () => {
    const res = RequestHandler.getResultLog({
      statusCode: 401,
    });
    expect(res, 'to have key', 'statusCode');
    expect(res.statusCode, 'to be', 401);
  });

  it('getErrorLog', () => {
    const res = RequestHandler.getErrorLog({
      name: 'name',
      message: 'message',
      stack: 's1\ns2',
      fileName: 'fileName',
      lineNumber: 101,
    });
    expect(res, 'to have key', 'statusCode');
    expect(res.statusCode, 'to be', 500);
    expect(res, 'to have key', 'error');
    expect(res.error, 'to have key', 'stack');
    expect(res.error.stack, 'to be a', 'array');
    expect(res.error.stack, 'to have length', 2);
    expect(res.error.stack[0], 'to be', 's1');
    expect(res.error.stack[1], 'to be', 's2');
    expect(res.error, 'to have key', 'fileName');
    expect(res.error.fileName, 'to be', 'fileName');
    expect(res.error, 'to have key', 'lineNumber');
    expect(res.error.lineNumber, 'to be', 101);
  });

  it('logRequest', () => {
    let res = RequestHandler.logRequest(
      {
        awsRequestId: 'awsRequestId',
        functionName: 'functionName',
      },
      {
        name: 'name',
        message: 'message',
        stack: 's1\ns2',
        fileName: 'fileName',
        lineNumber: 101,
      },
      {
        requestContext: {
          requestId: 'requestId',
          identity: {
            sourceIp: 'ipAddress',
            userAgent: 'userAgent',
          },
        },
      },
      {
        statusCode: 401,
      }
    );
    expect(res, 'to have key', 'statusCode');
    expect(res.statusCode, 'to be', 500);
    expect(res, 'to have key', 'error');
    expect(res.error, 'to have key', 'stack');
    expect(res.error.stack, 'to be a', 'array');
    expect(res.error.stack, 'to have length', 2);
    expect(res.error.stack[0], 'to be', 's1');
    expect(res.error.stack[1], 'to be', 's2');
    expect(res.error, 'to have key', 'fileName');
    expect(res.error.fileName, 'to be', 'fileName');
    expect(res.error, 'to have key', 'lineNumber');
    expect(res.error.lineNumber, 'to be', 101);
    expect(res, 'to have key', 'event');
    expect(res.event, 'to have key', 'apiRequestId');
    expect(res.event.apiRequestId, 'to be', 'requestId');
    expect(res.event, 'to have key', 'ipAddress');
    expect(res.event.ipAddress, 'to be', 'ipAddress');
    expect(res.event, 'to have key', 'userAgent');
    expect(res.event.userAgent, 'to be', 'userAgent');

    res = RequestHandler.logRequest(
      {
        awsRequestId: 'awsRequestId',
        functionName: 'functionName',
      },
      null,
      {
        requestContext: {
          requestId: 'requestId',
          identity: {
            sourceIp: 'ipAddress',
            userAgent: 'userAgent',
          },
        },
      },
      {
        statusCode: 401,
      }
    );
    expect(res, 'to have key', 'event');
    expect(res.event, 'to have key', 'apiRequestId');
    expect(res.event.apiRequestId, 'to be', 'requestId');
    expect(res.event, 'to have key', 'ipAddress');
    expect(res.event.ipAddress, 'to be', 'ipAddress');
    expect(res.event, 'to have key', 'userAgent');
    expect(res.event.userAgent, 'to be', 'userAgent');
    expect(res, 'to have key', 'statusCode');
    expect(res.statusCode, 'to be', 401);
  });

  it('handler ok', async () => {
    await RequestHandler.handler(
      () => {
        const res = { result: 'done' };
        return {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json; charset=utf-8',
          },
          statusCode: '201',
          body: JSON.stringify(res),
        };
      },
      {
        requestContext: {
          requestId: 'requestId',
          identity: {
            sourceIp: 'ipAddress',
            userAgent: 'userAgent',
          },
        },
      },
      {
        awsRequestId: 'awsRequestId',
        functionName: 'functionName',
      }, (err, res) => {
        expect(err, 'to be null');
        expect(res, 'not to be null');
        expect(res, 'to have key', 'headers');
        expect(res, 'to have key', 'statusCode');
        expect(res.statusCode, 'to be', '201');
        expect(res, 'to have key', 'body');
        expect(res.body, 'to be', '{"result":"done"}');
      }
    );
  });

  it('handler error', async () => {
    await RequestHandler.handler(
      () => {
        throw new UserError('Bad user input');
      },
      {
        requestContext: {
          requestId: 'requestId',
          identity: {
            sourceIp: 'ipAddress',
            userAgent: 'userAgent',
          },
        },
      },
      {
        awsRequestId: 'awsRequestId',
        functionName: 'functionName',
      }, (err, res) => {
        expect(err, 'to be null');
        expect(res, 'not to be null');
        expect(res, 'to have key', 'headers');
        expect(res, 'to have key', 'statusCode');
        expect(res.statusCode, 'to be', 400);
        expect(res, 'to have key', 'body');
        expect(res.body, 'to be', '{"errorMessage":"Bad user input","requestId":"awsRequestId"}');
      }
    );
  });
});
