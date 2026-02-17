import app from './app.js';
import { env } from './config/env.js';
import logger from './config/logger.js';

app.listen(env.PORT, () => {
  logger.info(`Viveo API server running on http://localhost:${env.PORT}`);
});
