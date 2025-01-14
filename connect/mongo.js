import mongoose from 'mongoose';
import logger from '../libs/logger.js';

mongoose.Promise = global.Promise;
export default ({ uri }) => {
  // database connection
  mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  // When successfully connected
  mongoose.connection.on('connected', () => {
    logger.info(`💾  Mongoose default connection open to ${uri}`);
  });
  // If the connection throws an error
  mongoose.connection.on('error', (err) => {
    logger.error(`💾  Mongoose default connection error: ${err}`);
    logger.error(
      '=> if using local mongodb: make sure that mongo server is running \n' +
        '=> if using online mongodb: check your internet connection \n',
    );
  });
  // When the connection is disconnected
  mongoose.connection.on('disconnected', () => {
    logger.info('💾  Mongoose default connection disconnected');
  });
  // If the Node process ends, close the Mongoose connection
  process.on('SIGINT', () => {
    mongoose.connection.close(() => {
      logger.info('💾  Mongoose default connection disconnected through app termination');
      // eslint-disable-next-line no-process-exit
      process.exit(0);
    });
  });
};
