export default class UserError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
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
