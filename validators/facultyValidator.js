const { body, validationResult } = require('express-validator');

// Validation rules for faculty login
exports.validateFacultyLogin = [
  // Email validation
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
    
  // Password validation
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  body('location')
    .exists()
    .withMessage('Location data is required')
    .bail()
    .isObject()
    .withMessage('Location must be an object')
    .bail(),
    
  body('location.type')
    .if(body('location').exists())
    .equals('Point')
    .withMessage('Location type must be "Point"'),
    
  body('location.coordinates')
    .if(body('location').exists())
    .isArray({ min: 2, max: 2 })
    .withMessage('Coordinates must be an array of [longitude, latitude]')
    .bail()
    .custom((value) => {
      const [longitude, latitude] = value;
      return (
        typeof longitude === 'number' && 
        typeof latitude === 'number' &&
        longitude >= -180 && 
        longitude <= 180 &&
        latitude >= -90 && 
        latitude <= 90
      );
    })
    .withMessage('Invalid coordinates. Longitude must be between -180 and 180, and latitude between -90 and 90'),
    
  // Accuracy validation (optional)
  body('location.accuracy')
    .optional({ checkFalsy: true })
    .isNumeric()
    .withMessage('Accuracy must be a number')
    .isFloat({ min: 0 })
    .withMessage('Accuracy must be a positive number'),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];
