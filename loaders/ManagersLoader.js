import MiddlewaresLoader from './MiddlewaresLoader.js';
import ApiHandler from '../managers/api/Api.manager.js';
import LiveDB from '../managers/live_db/LiveDb.manager.js';
import UserServer from '../managers/http/UserServer.manager.js';
import ResponseDispatcher from '../managers/response_dispatcher/ResponseDispatcher.manager.js';
import VirtualStack from '../managers/virtual_stack/VirtualStack.manager.js';
import ValidatorsLoader from './ValidatorsLoader.js';
import ResourceMeshLoader from './ResourceMeshLoader.js';
import utils from '../libs/utils.js';
import systemArch from '../static_arch/main.system.js';
import TokenManager from '../managers/token/Token.manager.js';
import SharkFin from '../managers/shark_fin/SharkFin.manager.js';
import TimeMachine from '../managers/time_machine/TimeMachine.manager.js';
import models from '../managers/_common/schema.models.js';
import validators from '../managers/_common/schema.validators.js';
import MongoLoader from './MongoLoader.js';
import SchoolManager from '../managers/services/School.manager.js';
import ClassroomManager from '../managers/services/Classroom.manager.js';
import StudentManager from '../managers/services/Student.manager.js';

export default (class ManagersLoader {
  constructor({ config, cortex, cache, oyster, bull, mongoDB }) {
    this.managers = {};
    this.config = config;
    this.cache = cache;
    this.cortex = cortex;
    this.mongoDB = mongoDB;
    this._preload();
    this.injectable = {
      utils,
      cache,
      config,
      cortex,
      oyster,
      bull,
      managers: this.managers,
      validators: this.validators,
      mongomodels: this.mongomodels,
      resourceNodes: this.resourceNodes,
    };
  }

  _preload() {
    const validatorsLoader = new ValidatorsLoader({
      models,
      customValidators: validators,
    });
    const resourceMeshLoader = new ResourceMeshLoader({});
    const mongoLoader = new MongoLoader({ schemaExtension: 'mongoModel.js' });
    this.validators = validatorsLoader.load();
    this.resourceNodes = resourceMeshLoader.load();
    this.mongomodels = mongoLoader.load();
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

    /** Entity services should be centralized here * */
    this.managers.school = new SchoolManager(this.injectable);
    this.managers.classroom = new ClassroomManager(this.injectable);
    this.managers.student = new StudentManager(this.injectable);

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
