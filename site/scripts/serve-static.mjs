import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? 'dist/client');
const port = Number(process.argv[3] ?? 4173);
const contentTypes = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
  '.woff2': 'font/woff2',
};

createServer((request, response) => {
  const pathname = decodeURIComponent((request.url ?? '/').split('?')[0]);
  const relativePath = normalize(pathname).replace(/^([/\\])+/, '');
  let filePath = join(root, relativePath);

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, 'index.html');
  } else if (!existsSync(filePath) && existsSync(`${filePath}.html`)) {
    filePath = `${filePath}.html`;
  }

  if (!filePath.startsWith(root) || !existsSync(filePath)) {
    response.statusCode = 404;
    filePath = join(root, '404.html');
  }

  response.setHeader(
    'content-type',
    contentTypes[extname(filePath)] ?? 'application/octet-stream',
  );
  createReadStream(filePath).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`Serving ${root} at http://127.0.0.1:${port}`);
});
