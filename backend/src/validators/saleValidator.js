const Joi = require('joi');

const createSaleSchema = Joi.object({
  customer_id: Joi.number().integer().positive().allow(null),
  items: Joi.array().items(Joi.object({
    product_id: Joi.number().integer().positive().required(),
    quantity: Joi.number().min(0.001).required(),
    unit_price: Joi.number().min(0).precision(2).required(),
    discount_amount: Joi.number().min(0).precision(2).default(0),
    tax_percentage: Joi.number().min(0).max(100).precision(2).default(0),
  })).min(1).required(),
  discount_type: Joi.string().valid('percentage', 'fixed').allow(null),
  discount_value: Joi.number().min(0).precision(2).default(0),
  discount_amount: Joi.number().min(0).precision(2).default(0),
  shipping_amount: Joi.number().min(0).precision(2).default(0),
  shipping_cost: Joi.number().min(0).precision(2).default(0),
  payment_method: Joi.string().valid('cash', 'card', 'mobile_payment', 'bank_transfer', 'credit', 'other').default('cash'),
  payment_status: Joi.string().valid('paid', 'partial', 'unpaid').default('unpaid'),
  paid_amount: Joi.number().min(0).precision(2).default(0),
  status: Joi.string().valid('completed', 'pending', 'on_hold').default('completed'),
  notes: Joi.string().allow('', null),
  prescription_id: Joi.string().max(50).allow('', null),
  is_pharmacy: Joi.boolean().default(false),
});

const updateSaleSchema = Joi.object({
  payment_status: Joi.string().valid('paid', 'partial', 'unpaid', 'refunded'),
  payment_method: Joi.string().valid('cash', 'card', 'mobile_payment', 'bank_transfer', 'credit', 'other'),
  paid_amount: Joi.number().min(0).precision(2),
  status: Joi.string().valid('completed', 'pending', 'cancelled', 'refunded', 'on_hold'),
  notes: Joi.string().allow('', null),
}).min(1);

module.exports = { createSaleSchema, updateSaleSchema };
