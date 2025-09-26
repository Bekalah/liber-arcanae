// Simple static server exposing parent directory so sibling repos resolve via ../repo paths.
import http from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..'); // parent directory

const server = http.createServer(async (req, res) => {
  const reqPath = path.normalize(decodeURI(req.url.split('?')[0]));
  let filePath = path.join(root, reqPath);
  filePath = path.resolve(filePath);
  // Use realpath to resolve symlinks
  let realRoot, realFilePath;
  try {
    realRoot = await import('node:fs/promises').then(fs => fs.realpath(root));
    realFilePath = await import('node:fs/promises').then(fs => fs.realpath(filePath));
  } catch (err) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  // Check containment: allow root dir itself and descendants
  if (
    !(realFilePath === realRoot ||
      (realFilePath.startsWith(realRoot + path.sep)))
  ) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  try {
    const info = await stat(realFilePath);
    if (info.isDirectory()) realFilePath = path.join(realFilePath, 'index.html');
    const data = await readFile(realFilePath);
    res.writeHead(200);
    res.end(data);
  } catch (err) {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(8080, () => {
  console.log('Dev server at http://localhost:8080');
});
