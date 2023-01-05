import { Validator } from "@lion/ui/form-core.js";

export class TransformsValidator extends Validator {
  static validatorName = "OnlyOneTransformGroupAllowed";

  /**
   * Returns true when 'activated' (c.q. in error/warning/info state)
   * @param {string} modelValue
   */
  execute(modelValue, param) {
    if (modelValue.filter((val) => val.endsWith(" (group)")).length > 1) {
      return true;
    }
    return false;
  }

  static getMessage({ fieldName, modelValue, formControl }) {
    const num = 2;
    const groups = "android, ios";
    return `Only 1 transform group allowed per platform, currently you have ${num}: ${groups}`;
  }
}
