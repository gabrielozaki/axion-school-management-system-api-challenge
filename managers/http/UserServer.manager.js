import http from 'http';
import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import cors from 'cors';
import path from 'path';
import logger from '../../libs/logger.js';

const app = express();
const options = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'Axion API for school management', version: '1.0.0' },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Use Authorization: Bearer <JWT> on header',
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: [path.resolve('./managers/**/*.js')],
};
const swaggerSpec = swaggerJsdoc(options);

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
    app.all('/api/:moduleName/:fnName/:id?', this.userApi.mw);

    /** swagger docs * */
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    const server = http.createServer(app);
    server.listen(this.config.USER_PORT, () => {
      logger.info(
        `${this.config.SERVICE_NAME.toUpperCase()} is running on port: ${this.config.USER_PORT}`,
      );
    });
  }
});
