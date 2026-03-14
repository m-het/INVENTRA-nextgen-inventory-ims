const { ValidationError } = require('../shared/errors');

function validate(schema) {
  return (req, res, next) => {
    const payload = { ...req.body, ...req.params, ...req.query };
    const result = schema.safeParse(payload);
    if (result.success) {
      req.valid = result.data;
      next();
    } else {
      const flattened = result.error.flatten();
      const fieldErrors = flattened.fieldErrors || {};
      const errors = Object.entries(fieldErrors).flatMap(([k, v]) => (Array.isArray(v) ? v.map((m) => ({ field: k, message: m })) : [{ field: k, message: v }]));
      next(new ValidationError('Validation failed', errors.length ? errors : result.error.errors));
    }
  };
}

module.exports = { validate };
