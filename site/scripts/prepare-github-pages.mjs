import { copyFile, cp, mkdir, readdir } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';

const outputRoot = resolve('dist/client');
const projectName = 'tacklebox';
const projectRoot = join(outputRoot, projectName);

await mkdir(projectRoot, { recursive: true });
await copyFile(join(outputRoot, `${projectName}.html`), join(projectRoot, 'index.html'));
await copyFile(join(outputRoot, '404.html'), join(projectRoot, '404.html'));
await cp(
  join(projectRoot, 'fonts'),
  join(projectRoot, '_next/static/fonts'),
  { recursive: true },
);

async function addDirectoryIndexes(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      await addDirectoryIndexes(entryPath);
      continue;
    }

    if (extname(entry.name) !== '.html' || entry.name === 'index.html') {
      continue;
    }

    const routeDirectory = entryPath.slice(0, -'.html'.length);
    const routeIndex = join(routeDirectory, 'index.html');
    await mkdir(dirname(routeIndex), { recursive: true });
    await mkdir(routeDirectory, { recursive: true });
    await copyFile(entryPath, routeIndex);
  }
}

await addDirectoryIndexes(projectRoot);
console.log(`Prepared GitHub Pages artifact at ${projectRoot}`);
