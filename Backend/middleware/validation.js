import Joi from 'joi';

// Generic validation middleware
export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    next();
  };
};

// User registration validation schema
export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
    'any.required': 'Password is required'
  }),
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name cannot exceed 50 characters',
    'any.required': 'First name is required'
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name cannot exceed 50 characters',
    'any.required': 'Last name is required'
  })
});

// User login validation schema
export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

// API endpoint validation schema
export const apiEndpointSchema = Joi.object({
  name: Joi.string().min(3).max(255).required().messages({
    'string.min': 'API name must be at least 3 characters long',
    'string.max': 'API name cannot exceed 255 characters',
    'any.required': 'API name is required'
  }),
  httpMethod: Joi.string().valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH').required().messages({
    'any.only': 'HTTP method must be one of: GET, POST, PUT, DELETE, PATCH',
    'any.required': 'HTTP method is required'
  }),
  path: Joi.string().pattern(new RegExp('^/[a-zA-Z0-9/_{}.-]*$')).required().messages({
    'string.pattern.base': 'Path must start with / and contain only valid URL characters',
    'any.required': 'API path is required'
  }),
  description: Joi.string().max(1000).optional().messages({
    'string.max': 'Description cannot exceed 1000 characters'
  }),
  parameters: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      type: Joi.string().valid('string', 'integer', 'number', 'boolean', 'array', 'object').required(),
      description: Joi.string().required()
    })
  ).optional(),
  querySuggestion: Joi.string().max(2000).optional().messages({
    'string.max': 'Query suggestion cannot exceed 2000 characters'
  })
});

// Database connection validation schema
export const databaseConnectionSchema = Joi.object({
  name: Joi.string().min(3).max(255).required().messages({
    'string.min': 'Connection name must be at least 3 characters long',
    'string.max': 'Connection name cannot exceed 255 characters',
    'any.required': 'Connection name is required'
  }),
  type: Joi.string().valid('postgresql', 'mysql', 'sqlite', 'oracle', 'sqlserver').required().messages({
    'any.only': 'Database type must be one of: postgresql, mysql, sqlite, oracle, sqlserver',
    'any.required': 'Database type is required'
  }),
  host: Joi.string().required().messages({
    'any.required': 'Database host is required'
  }),
  port: Joi.number().integer().min(1).max(65535).required().messages({
    'number.base': 'Port must be a number',
    'number.integer': 'Port must be an integer',
    'number.min': 'Port must be at least 1',
    'number.max': 'Port cannot exceed 65535',
    'any.required': 'Database port is required'
  }),
  databaseName: Joi.string().required().messages({
    'any.required': 'Database name is required'
  }),
  username: Joi.string().required().messages({
    'any.required': 'Database username is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Database password is required'
  }),
  sslEnabled: Joi.boolean().optional()
});

// Password change validation schema
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required'
  }),
  newPassword: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required().messages({
    'string.min': 'New password must be at least 8 characters long',
    'string.pattern.base': 'New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
    'any.required': 'New password is required'
  })
});

// Profile update validation schema
export const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional().messages({
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name cannot exceed 50 characters'
  }),
  lastName: Joi.string().min(2).max(50).optional().messages({
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name cannot exceed 50 characters'
  }),
  email: Joi.string().email().optional().messages({
    'string.email': 'Please provide a valid email address'
  })
});