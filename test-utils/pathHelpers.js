import { fileURLToPath } from 'url';
import path from 'path';
export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);
export function repoRoot(...segments) {
  // Resolve from this util file up to repository root
  return path.resolve(__dirname, '..', ...segments);
}