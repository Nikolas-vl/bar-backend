import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

const router = Router();

const specPath = path.resolve(__dirname, 'swagger.yaml');
const specFile = fs.readFileSync(specPath, 'utf8');
const swaggerDocument = YAML.parse(specFile);

router.use(
  '/',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Jolie API Docs',
  }),
);

export default router;
