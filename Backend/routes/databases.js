import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  getDatabaseConnections,
  getDatabaseConnection,
  createDatabaseConnection,
  updateDatabaseConnection,
  deleteDatabaseConnection,
  testDatabaseConnection,
  getDatabaseSchema,
  executeQuery
} from '../controllers/databaseController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, databaseConnectionSchema } from '../middleware/validation.js';

const router = express.Router();

// Rate limiting for database operations
const databaseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs (much more generous)
  message: {
    success: false,
    message: 'Too many database requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply authentication to all routes
router.use(authenticateToken);
router.use(databaseLimiter);

// Routes
router.get('/', getDatabaseConnections);
router.post('/', validate(databaseConnectionSchema), createDatabaseConnection);

router.get('/:id', getDatabaseConnection);
router.put('/:id', validate(databaseConnectionSchema), updateDatabaseConnection);
router.delete('/:id', deleteDatabaseConnection);
router.post('/:id/test', testDatabaseConnection);
router.get('/:id/schema', getDatabaseSchema);
router.post('/:id/query', executeQuery);

export default router;