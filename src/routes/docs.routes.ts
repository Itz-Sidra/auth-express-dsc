import express, { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerConfig } from '../utils/swagger.config';

const docsRouter = Router();

// Route to serve the swagger configuration
docsRouter.get('/swaggerConfig', (req, res) => {
  res.json(swaggerConfig);
});

// Route to serve the Swagger UI
docsRouter.use('/docs', swaggerUi.serve);
docsRouter.get('/docs', swaggerUi.setup(null, {
  swaggerUrl: '/api/v1/swaggerConfig'
}));

export default docsRouter;