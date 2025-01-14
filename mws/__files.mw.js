import logger from '../libs/logger.js';

export default ({ meta, config, managers }) => {
  return async ({ req, res, next }) => {
    try {
      await managers.fm.upload(req, res);
    } catch (err) {
      logger.error('Erorr', err);
    }

    next(req.files);
  };
};
