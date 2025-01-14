import Pine from 'qantra-pineapple';
import loader from './_common/fileLoader.js';

export default (class ValidatorsLoader {
  constructor({ models, customValidators } = {}) {
    this.models = models;
    this.customValidators = customValidators;
  }

  load() {
    const validators = {};
    /**
     * load schemes
     * load models ( passed to the consturctor )
     * load custom validators
     */
    const schemes = loader('./managers/**/*.schema.js');
    Object.keys(schemes).forEach((sk) => {
      const pine = new Pine({ models: this.models, customValidators: this.customValidators });
      validators[sk] = {};
      Object.keys(schemes[sk]).forEach((s) => {
        validators[sk][s] = async (data) => {
          return pine.validate(data, schemes[sk][s]);
        };
        /** also exports the trimmer function for the same */
        validators[sk][`${s}Trimmer`] = async (data) => {
          return pine.trim(data, schemes[sk][s]);
        };
      });
    });
    return validators;
  }
});
