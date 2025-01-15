export default class User {
  constructor({ _utils, _cache, config, cortex, managers, validators, mongomodels } = {}) {
    this.config = config;
    this.cortex = cortex;
    this.validators = validators;
    this.mongomodels = mongomodels;
    this.tokenManager = managers.token;
    this.usersCollection = 'users';
    this.userExposed = ['createUser'];
  }

  async createUser({ username, email, password }) {
    const user = { username, email, password };

    // Data validation
    const result = await this.validators.user.createUser(user);
    if (result) return result;

    // Creation Logic
    const createdUser = { username, email, password };
    const longToken = this.tokenManager.genLongToken({
      userId: createdUser._id,
      role: createdUser.key,
    });

    // Response
    return {
      user: createdUser,
      longToken,
    };
  }
}
