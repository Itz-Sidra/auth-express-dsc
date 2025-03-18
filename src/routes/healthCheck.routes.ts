import express, { Router } from 'express';
import { healthCheck } from '../controller/health.controller';
import { rateLimiter } from '../middlewares/rate.limiter';

const healthCheckRouter = Router();

healthCheckRouter.get('/', rateLimiter, healthCheck);

export default healthCheckRouter;