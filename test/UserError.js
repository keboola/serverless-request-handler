import expect from 'unexpected';

import UserError from '../src/UserError';

describe('UserError', () => {
  it('badRequest', () => {
    const res = UserError.badRequest('bad');
    expect(res instanceof UserError, 'to be true');
    expect(res.message, 'to be', 'bad');
    expect(res.code, 'to be', 400);
  });

  it('unauthorized', () => {
    const res = UserError.unauthorized('bad');
    expect(res instanceof UserError, 'to be true');
    expect(res.message, 'to be', 'bad');
    expect(res.code, 'to be', 401);
  });

  it('notFound', () => {
    const res = UserError.notFound('bad');
    expect(res instanceof UserError, 'to be true');
    expect(res.message, 'to be', 'bad');
    expect(res.code, 'to be', 404);
  });

  it('unprocessable', () => {
    const res = UserError.unprocessable('bad');
    expect(res instanceof UserError, 'to be true');
    expect(res.message, 'to be', 'bad');
    expect(res.code, 'to be', 422);
  });

  it('error', () => {
    const res = UserError.error('bad', 419);
    expect(res instanceof UserError, 'to be true');
    expect(res.message, 'to be', 'bad');
    expect(res.code, 'to be', 419);
  });
});
