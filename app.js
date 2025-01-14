import Cortex from 'ion-cortex';
import config from './config/settings';
import ManagersLoader from './loaders/ManagersLoader';
// import mongo from './connect/mongo';
import cache$0 from './cache/cache.dbh';

// const mongoDB = config.MONGO_URI
//   ? mongo({
//       uri: config.MONGO_URI,
//     })
//   : null;
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
const managersLoader = new ManagersLoader({ config, cache, cortex });
const managers = managersLoader.load();
managers.userServer.run();
