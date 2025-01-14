import logger from '../libs/logger';

export default ({ meta, config, managers }) => {
  return ({ req, res, next }) => {
    if (!req.headers.token) {
      logger.error('token required but not found');
      return managers.responseDispatcher.dispatch(res, {
        ok: false,
        code: 401,
        errors: 'unauthorized',
      });
    }
    let decoded = null;
    try {
      decoded = managers.token.verifyShortToken({ token: req.headers.token });
      if (!decoded) {
        logger.error('Failed to decode-1');
        return managers.responseDispatcher.dispatch(res, {
          ok: false,
          code: 401,
          errors: 'unauthorized',
        });
      }
    } catch (err) {
      logger.error('Failed to decode-2');
      return managers.responseDispatcher.dispatch(res, {
        ok: false,
        code: 401,
        errors: 'unauthorized',
      });
    }

    return next(decoded);
  };
};
