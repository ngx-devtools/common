import { readdir, stat, statSync, existsSync, readFile, writeFile  } from 'fs';
import { promisify } from 'util';
import { resolve, join } from 'path';

const readdirAsync = promisify(readdir);
const statAsync = promisify(stat);
const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);

async function walkAsync(dir: string): Promise<string[]> {
  const rootDir = resolve(dir);
  return readdirAsync(dir)
    .then(contents => {
      
      return contents.map(content => join(rootDir, content))
    })
}

export {
  readdirAsync,
  statAsync,
  readFileAsync,
  writeFileAsync,
  walkAsync
}