export default (class ResponseDispatcher {
  constructor() {
    this.key = 'responseDispatcher';
  }

  dispatch(res, { ok, data, code, errors, message, msg }) {
    const statusCode = code || (ok === true ? 200 : 400);
    return res.status(statusCode).send({
      ok: ok || false,
      data: data || {},
      errors: errors || [],
      message: msg || message || '',
    });
  }
});
