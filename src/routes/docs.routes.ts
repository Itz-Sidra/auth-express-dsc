import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerConfig } from '../utils/swagger.config';

const docsRouter = Router();

docsRouter.get('/swaggerConfig', (req, res) => {
  res.json(swaggerConfig);
});

docsRouter.use('/docs', swaggerUi.serve);
docsRouter.get('/docs', swaggerUi.setup(null, {
  swaggerUrl: '/api/v1/swaggerConfig'
}));

export default docsRouter;