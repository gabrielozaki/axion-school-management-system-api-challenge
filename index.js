import Cortex from 'ion-cortex';
import Oyster from 'oyster-db';
import config from './config/settings.js';
import ManagersLoader from './loaders/ManagersLoader.js';
import cache$0 from './cache/cache.dbh.js';
import logger from './libs/logger.js';
import BullInstance from './libs/BullInstance.js';

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

const bull = new BullInstance(config.BULL_REDIS);
const managersLoader = new ManagersLoader({
  config,
  cache,
  cortex,
  oyster,
  bull,
});
const managers = managersLoader.load();
managers.userServer.run();
