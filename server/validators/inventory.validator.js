const Joi = require('joi');

const productSchema = Joi.object({
  productName: Joi.string().min(2).max(100).trim().required().messages({
    'any.required': 'Product name is required',
  }),
  sku: Joi.string().min(3).max(50).trim().required().messages({
    'any.required': 'SKU is required',
  }),
  category: Joi.string()
    .valid('Electronics', 'Apparel', 'Furniture', 'Food & Beverage', 'Sports', 'Automotive', 'Health & Beauty', 'Toys')
    .required()
    .messages({ 'any.required': 'Category is required' }),
  price: Joi.number().min(0).required().messages({
    'any.required': 'Price is required',
    'number.min': 'Price cannot be negative',
  }),
  cost: Joi.number().min(0).required().messages({
    'any.required': 'Cost is required',
  }),
  stockQuantity: Joi.number().integer().min(0).required().messages({
    'number.min': 'Stock quantity cannot be negative',
    'any.required': 'Stock quantity is required',
  }),
  reorderLevel: Joi.number().integer().min(0).default(10),
  lastUpdated: Joi.date().default(Date.now),
});

const validateBusinessRules = (data) => {
  const errors = [];
  if (data.price < data.cost) {
    errors.push(`Price ($${data.price}) cannot be lower than cost ($${data.cost}).`);
  }
  if (data.stockQuantity < 0) {
    errors.push('Stock quantity cannot be negative.');
  }
  return errors;
};

module.exports = { productSchema, validateBusinessRules };