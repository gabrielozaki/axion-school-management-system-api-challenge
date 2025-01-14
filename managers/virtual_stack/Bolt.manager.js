import debug from 'debug';
import logger from '../../libs/logger.js';

const stackBoltDebug = debug('cp:StackBolt');
export default (class StackBolt {
  /**
   *
   * @param {object} inject managers
   */
  constructor({ mwsRepo, stack, _id, managers, req, res, onDone, onError } = {}) {
    this.mwsRepo = mwsRepo;
    this.stack = stack;
    this.managers = managers;
    this.index = 0;
    this.run = this.run.bind(this);
    this.next = this.next.bind(this);
    this.end = this.end.bind(this);
    this.req = req;
    this.res = res;
    this.results = {};
    this.onDone = onDone || (() => {});
    this.onError = onError || (() => {});
  }

  /** execute the end of the stack */
  end({ error } = {}) {
    error = error || 'Unexpected Failure';
    this.req.stackError = error;
    /** if the last node is the one that is call the end */
    if (this.index === this.stack.length - 1) {
      /** failing over as the last fn is broken. */
      stackBoltDebug('stack broke: ', error);
      if (this.res.end) this.res.end();
    } else {
      stackBoltDebug('stack error: ', error);
      this.index = this.stack.length - 1;
      this.run({ index: this.index });
    }
  }

  next(data, index) {
    this.results[this.stack[this.index]] = data || {};
    const indexToBe = index || this.index + 1;
    if (!this.stack[indexToBe]) {
      stackBoltDebug('reached end of the stack');
      this.onDone({ req: this.req, res: this.res, results: this.results });
      return;
    }
    this.index = indexToBe;
    this.run({ index: this.index });
  }

  run({ index } = {}) {
    const tIndex = index || this.index;
    // if(tIndex==0)logger.info("#", this.req.method, this.req.url);
    /** fn bludPrint */
    if (!this.stack[tIndex]) {
      // logger.info(`Index ${tIndex} not found on schema`,this.stack);
      return;
    }
    const fnKey = this.stack[tIndex];
    const fn = this.mwsRepo[fnKey];
    if (!fn) {
      logger.info('___Function not found __ Jumping ____ ');
      this.end({ error: `function not found on function ${fnKey} ` });
    } else {
      /** contains information about which app, which route, and which module
       * is using the function
       */
      /** exec the mw */
      try {
        fn({
          req: this.req,
          res: this.res,
          results: this.results,
          next: this.next,
          end: this.end,
          stack: this.stack,
          self: fn,
        });
      } catch (err) {
        logger.info(`failed to execute ${fnKey}:`, err);
        this.end({ error: `execution failed on function ${fnKey}, ${err}` });
      }
    }
  }
});
