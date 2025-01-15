import Cortex from 'ion-cortex';
import config from './config/settings.js';
import ManagersLoader from './loaders/ManagersLoader.js';
import mongo from './connect/mongo.js';
import cache$0 from './cache/cache.dbh.js';

const mongoDB = config.MONGO_URI
  ? mongo({
      uri: config.MONGO_URI,
    })
  : null;
const cache = cache$0({
  prefix: config.CACHE_PREFIX,
  url: config.CACHE_REDIS,
});
const cortex = new Cortex({
  prefix: config.CORTEX_PREFIX,
  url: config.CORTEX_REDIS,
  type: config.CORTEX_TYPE,
  state: () => ({}),
  activeDelay: '50ms',
  idlDelay: '200ms',
});
const managersLoader = new ManagersLoader({ config, cache, cortex, mongoDB });
const managers = managersLoader.load();
managers.userServer.run();
