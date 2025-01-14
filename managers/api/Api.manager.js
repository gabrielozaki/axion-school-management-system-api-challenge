import getParamNames from './_common/getParamNames.js';
import logger from '../../libs/logger.js';

export default (class ApiHandler {
  /**
   * @param {object} containing instance of all managers
   * @param {string} prop with key to scan for exposed methods
   */
  constructor({ config, cortex, cache, managers, mwsRepo, prop }) {
    this.config = config;
    this.cache = cache;
    this.cortex = cortex;
    this.managers = managers;
    this.mwsRepo = mwsRepo;
    this.mwsExec = this.managers.mwsExec;
    this.prop = prop;
    this.exposed = {};
    this.methodMatrix = {};
    this.auth = {};
    this.fileUpload = {};
    this.mwsStack = {};
    this.mw = this.mw.bind(this);
    /** filter only the modules that have interceptors */
    // logger.info(`# Http API`);
    Object.keys(this.managers).forEach((mk) => {
      if (this.managers[mk][this.prop]) {
        // logger.info('managers - mk ', this.managers[mk])
        this.methodMatrix[mk] = {};
        // logger.info(`## ${mk}`);
        this.managers[mk][this.prop].forEach((i) => {
          /** creating the method matrix */
          let method = 'post';
          let fnName = i;
          if (i.includes('=')) {
            const frags = i.split('=');
            // eslint-disable-next-line prefer-destructuring
            method = frags[0];
            // eslint-disable-next-line prefer-destructuring
            fnName = frags[1];
          }
          if (!this.methodMatrix[mk][method]) {
            this.methodMatrix[mk][method] = [];
          }
          this.methodMatrix[mk][method].push(fnName);
          let params = getParamNames(this.managers[mk][fnName], fnName, mk);
          params = params.split(',').map((i) => {
            i = i.trim();
            i = i.replace('{', '');
            i = i.replace('}', '');
            return i;
          });
          /** building middlewares stack */
          params.forEach((param) => {
            if (!this.mwsStack[`${mk}.${fnName}`]) {
              this.mwsStack[`${mk}.${fnName}`] = [];
            }
            if (param.startsWith('__')) {
              // this is a middleware identifier
              // mws are executed in the same order they existed
              /** check if middleware exists */
              // logger.info(this.mwsRepo);
              if (!this.mwsRepo[param]) {
                throw Error(`Unable to find middleware ${param}`);
              } else {
                this.mwsStack[`${mk}.${fnName}`].push(param);
              }
            }
          });
          // logger.info(`* ${i} :`, 'args=', params);
        });
      }
    });
    /** expose apis through cortex */
    Object.keys(this.managers).forEach((mk) => {
      if (this.managers[mk].interceptor) {
        this.exposed[mk] = this.managers[mk];
        // logger.info(`## ${mk}`);
        if (this.exposed[mk].cortexExposed) {
          this.exposed[mk].cortexExposed.forEach((_) => {
            // logger.info(`* ${i} :`,getParamNames(this.exposed[mk][i]));
          });
        }
      }
    });
    /** expose apis through cortex */
    this.cortex.sub('*', (d, meta, cb) => {
      const [moduleName, fnName] = meta.event.split('.');
      const targetModule = this.exposed[moduleName];
      if (!targetModule) return cb({ error: `module ${moduleName} not found` });
      try {
        targetModule.interceptor({ data: d, meta, cb, fnName });
      } catch (err) {
        cb({ error: `failed to execute ${fnName}` });
      }
      return targetModule;
    });
  }

  async _exec({ targetModule, fnName, cb, data }) {
    let result = {};
    try {
      result = await targetModule[`${fnName}`](data);
    } catch (err) {
      logger.error('Error', err);
      result.error = `${fnName} failed to execute`;
    }
    if (cb) cb(result);
    return result;
  }

  /** a middle for executing admin apis trough HTTP */
  async mw(req, res, _next) {
    const method = req.method.toLowerCase();
    const { moduleName } = req.params;
    const { fnName } = req.params;
    const moduleMatrix = this.methodMatrix[moduleName];
    /** validate module */
    if (!moduleMatrix)
      return this.managers.responseDispatcher.dispatch(res, {
        ok: false,
        message: `module ${moduleName} not found`,
      });
    /** validate method */
    if (!moduleMatrix[method]) {
      return this.managers.responseDispatcher.dispatch(res, {
        ok: false,
        message: `unsupported method ${method} for ${moduleName}`,
      });
    }
    if (!moduleMatrix[method].includes(fnName)) {
      return this.managers.responseDispatcher.dispatch(res, {
        ok: false,
        message: `unable to find function ${fnName} with method ${method}`,
      });
    }
    // logger.info(`${moduleName}.${fnName}`);
    const targetStack = this.mwsStack[`${moduleName}.${fnName}`];
    const hotBolt = this.mwsExec.createBolt({
      stack: targetStack,
      req,
      res,
      onDone: async ({ req, res, results }) => {
        /** executed after all middleware finished */
        const body = req.body || {};
        let result = await this._exec({
          targetModule: this.managers[moduleName],
          fnName,
          data: {
            ...body,
            ...results,
            res,
          },
        });
        if (!result) result = {};
        if (result.selfHandleResponse) {
          // do nothing if response handeled
        } else {
          if (result.errors) {
            return this.managers.responseDispatcher.dispatch(res, {
              ok: false,
              errors: result.errors,
            });
          }
          if (result.error) {
            return this.managers.responseDispatcher.dispatch(res, {
              ok: false,
              message: result.error,
            });
          }
          return this.managers.responseDispatcher.dispatch(res, { ok: true, data: result });
        }
        return null;
      },
    });
    hotBolt.run();
    return hotBolt;
  }
});
