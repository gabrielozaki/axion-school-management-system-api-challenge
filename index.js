import Cortex from 'ion-cortex';
import Aeon from 'aeon-machine';
import Oyster from 'oyster-db';
import config from './config/settings';
import ManagersLoader from './loaders/ManagersLoader';
import cache$0 from './cache/cache.dbh';
import logger from './libs/logger';

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:');
  logger.error(err, err.stack);
  // eslint-disable-next-line no-process-exit
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at ', promise, 'reason:', reason);
  // eslint-disable-next-line no-process-exit
  process.exit(1);
});
const cache = cache$0({
  prefix: config.CACHE_PREFIX,
  url: config.CACHE_REDIS,
});
const oyster = new Oyster({
  url: config.OYSTER_REDIS,
  prefix: config.OYSTER_PREFIX,
});
const cortex = new Cortex({
  prefix: config.CORTEX_PREFIX,
  url: config.CORTEX_REDIS,
  type: config.CORTEX_TYPE,
  state: () => ({}),
  activeDelay: '50',
  idlDelay: '200',
});
const aeon = new Aeon({
  cortex,
  timestampFrom: Date.now(),
  segmantDuration: 500,
});
const managersLoader = new ManagersLoader({
  config,
  cache,
  cortex,
  oyster,
  aeon,
});
const managers = managersLoader.load();
managers.userServer.run();
