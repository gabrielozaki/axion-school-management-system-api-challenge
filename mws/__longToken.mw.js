import logger from '../libs/logger.js';

export default ({ meta, config, managers }) => {
  return ({ req, res, next }) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      logger.error('token required but not found');
      return managers.responseDispatcher.dispatch(res, {
        ok: false,
        code: 401,
        errors: 'unauthorized',
      });
    }
    let decoded = null;
    try {
      decoded = managers.token.verifyLongToken({ token: authHeader.split(' ')[1] });
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
    next(decoded);
  };
};
