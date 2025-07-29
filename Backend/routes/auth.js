import express from 'express';
import rateLimit from 'express-rate-limit';
import { 
  register, 
  login, 
  refreshToken, 
  logout, 
  getProfile, 
  updateProfile, 
  changePassword 
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } from '../middleware/validation.js';

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs (much more generous)
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes (no authentication required)
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh-token', authLimiter, refreshToken);

// Protected routes (authentication required)
router.use(authenticateToken); // Apply authentication middleware to all routes below

router.post('/logout', generalLimiter, logout);
router.get('/profile', generalLimiter, getProfile);
router.put('/profile', generalLimiter, validate(updateProfileSchema), updateProfile);
router.put('/change-password', authLimiter, validate(changePasswordSchema), changePassword);

export default router;