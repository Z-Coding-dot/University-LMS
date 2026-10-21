import { cp, stat } from 'node:fs/promises';
import { URL, fileURLToPath } from 'node:url';
import console from 'node:console';

const target = new URL('../../backend/public/', import.meta.url);
let exists = false;
try { exists = (await stat(target)).isDirectory(); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
if (exists) {
  await cp(new URL('../dist/', import.meta.url), target, { recursive: true });
  console.info(`Built frontend copied to ${fileURLToPath(target)}`);
} else {
  console.info('backend/public does not exist. Build is available in lms-frontend/dist.');
}
