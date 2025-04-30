import Joi from 'joi';

export const validateDeliveryPerson = (data) => {
  const schema = Joi.object({
    name: Joi.string()
      .min(3)
      .max(50)
      .required()
      .messages({
        'string.min': 'Name must be at least 3 characters long',
        'string.max': 'Name cannot exceed 50 characters',
        'any.required': 'Name is required'
      }),

    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),

    phone: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .required()
      .messages({
        'string.pattern.base': 'Phone number must be 10 digits',
        'any.required': 'Phone number is required'
      }),

    vehicleNumber: Joi.string()
      .required()
      .messages({
        'any.required': 'Vehicle number is required'
      }),

    licenseNumber: Joi.string()
      .required()
      .messages({
        'any.required': 'License number is required'
      }),

    password: Joi.string()
      .min(6)
      .optional()
      .messages({
        'string.min': 'Password must be at least 6 characters long'
      }),

    status: Joi.string()
      .valid('active', 'inactive')
      .default('active')
  });

  return schema.validate(data, { abortEarly: false });
}; 