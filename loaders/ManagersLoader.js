import MiddlewaresLoader from './MiddlewaresLoader';
import ApiHandler from '../managers/api/Api.manager';
import LiveDB from '../managers/live_db/LiveDb.manager';
import UserServer from '../managers/http/UserServer.manager';
import ResponseDispatcher from '../managers/response_dispatcher/ResponseDispatcher.manager';
import VirtualStack from '../managers/virtual_stack/VirtualStack.manager';
import ValidatorsLoader from './ValidatorsLoader';
import ResourceMeshLoader from './ResourceMeshLoader';
import utils from '../libs/utils';
import systemArch from '../static_arch/main.system';
import TokenManager from '../managers/token/Token.manager';
import SharkFin from '../managers/shark_fin/SharkFin.manager';
import TimeMachine from '../managers/time_machine/TimeMachine.manager';
import models from '../managers/_common/schema.models';
import validators from '../managers/_common/schema.validators';

export default (class ManagersLoader {
  constructor({ config, cortex, cache, oyster, aeon }) {
    this.managers = {};
    this.config = config;
    this.cache = cache;
    this.cortex = cortex;
    this._preload();
    this.injectable = {
      utils,
      cache,
      config,
      cortex,
      oyster,
      aeon,
      managers: this.managers,
      validators: this.validators,
      // mongomodels: this.mongomodels,
      resourceNodes: this.resourceNodes,
    };
  }

  _preload() {
    const validatorsLoader = new ValidatorsLoader({
      models,
      customValidators: validators,
    });
    const resourceMeshLoader = new ResourceMeshLoader({});
    // const mongoLoader      = new MongoLoader({ schemaExtension: "mongoModel.js" });
    this.validators = validatorsLoader.load();
    this.resourceNodes = resourceMeshLoader.load();
    // this.mongomodels          = mongoLoader.load();
  }

  load() {
    this.managers.responseDispatcher = new ResponseDispatcher();
    this.managers.liveDb = new LiveDB(this.injectable);
    const middlewaresLoader = new MiddlewaresLoader(this.injectable);
    const mwsRepo = middlewaresLoader.load();
    const { layers, actions } = systemArch;
    this.injectable.mwsRepo = mwsRepo;
    /** ***************************************CUSTOM MANAGERS**************************************** */
    this.managers.shark = new SharkFin({ ...this.injectable, layers, actions });
    this.managers.timeMachine = new TimeMachine(this.injectable);
    this.managers.token = new TokenManager(this.injectable);
    /** ********************************************************************************************** */
    this.managers.mwsExec = new VirtualStack({
      ...{ preStack: [/* '__token', */ '__device'] },
      ...this.injectable,
    });
    this.managers.userApi = new ApiHandler({ ...this.injectable, ...{ prop: 'httpExposed' } });
    this.managers.userServer = new UserServer({ config: this.config, managers: this.managers });
    return this.managers;
  }
});
