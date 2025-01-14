import http from 'http';
import express from 'express';
import cors from 'cors';
import logger from '../../libs/logger.js';

const app = express();
export default (class UserServer {
  constructor({ config, managers }) {
    this.config = config;
    this.userApi = managers.userApi;
  }

  /** for injecting middlewares */
  use(args) {
    app.use(args);
  }

  /** server configs */
  run() {
    app.use(cors({ origin: '*' }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use('/static', express.static('public'));
    /** an error handler */
    app.use((err, req, res, _next) => {
      logger.error(err.stack);
      res.status(500).send('Something broke!');
    });
    /** a single middleware to handle all */
    app.all('/api/:moduleName/:fnName', this.userApi.mw);
    const server = http.createServer(app);
    server.listen(this.config.dotEnv.USER_PORT, () => {
      logger.info(
        `${this.config.dotEnv.SERVICE_NAME.toUpperCase()} is running on port: ${this.config.dotEnv.USER_PORT}`,
      );
    });
  }
});
