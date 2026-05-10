const Joi = require('joi');

const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  phone: Joi.string().max(20).allow('', null),
  role: Joi.string().valid('store_owner', 'manager', 'employee').default('employee'),
  permissions: Joi.object().default({}),
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  password: Joi.string().min(6).max(100),
  phone: Joi.string().max(20).allow('', null),
  role: Joi.string().valid('store_owner', 'manager', 'employee'),
  permissions: Joi.object(),
  status: Joi.string().valid('active', 'inactive', 'suspended'),
}).min(1);

module.exports = { createUserSchema, updateUserSchema };
