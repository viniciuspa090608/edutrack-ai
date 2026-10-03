import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const directory = fileURLToPath(
  new URL('../src/components/ui/', import.meta.url),
);
for (const file of await readdir(directory)) {
  if (!file.endsWith('.tsx')) continue;
  const url = new URL(`../src/components/ui/${file}`, import.meta.url);
  const original = await readFile(url, 'utf8');
  const normalized = original
    .replace(/from (['"])cn\1/g, "from '../../lib/utils.js'")
    .replace(/from (['"])@\/lib\/utils\1/g, "from '../../lib/utils.js'")
    .replace(/from (['"])@\/components\/ui\/([^'"]+)\1/g, "from './$2.js'")
    .replace(
      /from (['"])@study-platform\/ui\/components\/ui\/([^'"]+)\1/g,
      "from './$2.js'",
    );
  if (normalized !== original) await writeFile(url, normalized);
}
