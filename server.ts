/**
 * Taumata Arowai GIS Platform - Root Server Entrypoint
 * Backward-compatible delegator to backend/server.ts
 */
import { fileURLToPath } from 'url';
import { startServer } from './backend/server.ts';

export * from './backend/server.ts';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}
