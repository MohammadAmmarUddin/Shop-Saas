const Joi = require('joi');

const createPurchaseSchema = Joi.object({
  supplier_id: Joi.number().integer().positive().allow(null),
  items: Joi.array().items(Joi.object({
    product_id: Joi.number().integer().positive().required(),
    quantity: Joi.number().min(0.001).required(),
    unit_cost: Joi.number().min(0).precision(2).required(),
    discount_amount: Joi.number().min(0).precision(2).default(0),
    tax_percentage: Joi.number().min(0).max(100).precision(2).default(0),
  })).min(1).required(),
  discount_amount: Joi.number().min(0).precision(2).default(0),
  shipping_amount: Joi.number().min(0).precision(2).default(0),
  shipping_cost: Joi.number().min(0).precision(2).default(0),
  status: Joi.string().valid('received', 'pending', 'cancelled', 'partial').default('pending'),
  notes: Joi.string().allow('', null),
});

const updatePurchaseSchema = Joi.object({
  supplier_id: Joi.number().integer().positive().allow(null),
  discount_amount: Joi.number().min(0).precision(2),
  shipping_amount: Joi.number().min(0).precision(2),
  status: Joi.string().valid('received', 'pending', 'cancelled', 'partial'),
  payment_status: Joi.string().valid('paid', 'partial', 'unpaid'),
  paid_amount: Joi.number().min(0).precision(2),
  notes: Joi.string().allow('', null),
}).min(1);

const receivePurchaseSchema = Joi.object({
  items: Joi.array().items(Joi.object({
    id: Joi.number().integer().positive().required(),
    received_quantity: Joi.number().min(0).precision(3).required(),
    expiry_date: Joi.date().allow(null),
    batch_number: Joi.string().max(50).allow('', null),
  })).min(1).required(),
});

module.exports = { createPurchaseSchema, updatePurchaseSchema, receivePurchaseSchema };
