import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  getApiEndpoints,
  getApiEndpoint,
  createApiEndpoint,
  updateApiEndpoint,
  deleteApiEndpoint,
  getEndpointStats,
  testApiEndpoint
} from '../controllers/apiEndpointController.js';
import { authenticateToken, requireOwnership } from '../middleware/auth.js';
import { validate, apiEndpointSchema } from '../middleware/validation.js';
import { ApiEndpoint } from '../models/index.js';

const router = express.Router();

// Rate limiting for API endpoint operations
const endpointLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs (much more generous)
  message: {
    success: false,
    message: 'Too many API endpoint requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply authentication to all routes
router.use(authenticateToken);
router.use(endpointLimiter);

// Routes
router.get('/', getApiEndpoints);
router.get('/stats', getEndpointStats);
router.post('/', validate(apiEndpointSchema), createApiEndpoint);

router.get('/:id', getApiEndpoint);
router.put('/:id', validate(apiEndpointSchema), updateApiEndpoint);
router.delete('/:id', deleteApiEndpoint);
router.post('/:id/test', testApiEndpoint);

export default router;