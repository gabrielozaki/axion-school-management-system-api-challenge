import loader from './_common/fileLoader.js';
import logger from '../libs/logger.js';

export default (class MiddlewareLoader {
  constructor(injectable) {
    this.mws = {};
    this.injectable = injectable;
  }

  load() {
    const mws = loader('./mws/**/*.mw.js');
    Object.keys(mws).forEach((ik) => {
      /** call the mw builder */
      logger.info(`Loading ${ik}`);
      mws[ik] = mws[ik](this.injectable);
      return null;
    });
    return mws;
  }
});
