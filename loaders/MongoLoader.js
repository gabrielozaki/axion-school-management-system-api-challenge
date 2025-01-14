import loader from './_common/fileLoader.js';

export default (class MongoLoader {
  constructor({ schemaExtension }) {
    this.schemaExtension = schemaExtension;
  }

  load() {
    /** load Mongo Models */
    const models = loader(`./managers/entities/**/*.${this.schemaExtension}`);
    return models;
  }
});
