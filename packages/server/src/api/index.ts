import { Router } from 'express';
import registerTuneRoutes from './tunes.js';
import registerFileRoutes from './file.js';
import registerAuthRoutes from './auth.js';

const apiRouter = Router();
registerAuthRoutes(apiRouter);
registerTuneRoutes(apiRouter);
registerFileRoutes(apiRouter);
export default apiRouter;
