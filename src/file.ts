import { readdir, stat, statSync, readlinkSync, readFile, writeFile, lstat, unlink, copyFile, rmdir, symlink, existsSync, mkdirSync } from 'fs';
import { promisify } from 'util';
import { resolve, join, sep, dirname, basename } from 'path';
import { startAsync, doneAsync } from './info';

const strip = require('strip-comments');
const minimatch = require('minimatch');

const readdirAsync = promisify(readdir);
const statAsync = promisify(stat);
const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);
const lstatAsync = promisify(lstat);
const unlinkAsync = promisify(unlink);
const copyFileAsync = promisify(copyFile);
const symlinkAsync = promisify(symlink);
const rmdirAsync = promisify(rmdir);

const LINK_TYPE = Object.freeze({
  FILE: 'file',
  DIR: 'dir',
  JUNCTION: 'junction'
});

interface GlobFileOptions {
  dir: string;
  isRecursive: boolean;
  pattern: string;
}

async function globFiles(src: string | string[]): Promise<string[]> {
  const files = Array.isArray(src) ? src : [ src ];
  return Promise.all(files.map(file => {
    const options: GlobFileOptions = {
      dir: dirname(resolve(file).replace('/**', '')),
      isRecursive: file.includes('**'),
      pattern: basename(file)
    }
    return walkAsync(options);
  }))
  .then(results => results.join(',').split(','));
}

async function walkAsync(options: GlobFileOptions): Promise<string[]> {
  const rootDir = resolve(options.dir);
  return readdirAsync(options.dir)
    .then(contents => {
      return Promise.all(contents.map(content => {
        const result = join(rootDir, content)
        return statAsync(result)
          .then(async data => {
            const files: string[] = [];
            if (data.isDirectory() && options.isRecursive) {
              const values = await walkAsync({
                dir: result,
                isRecursive: options.isRecursive,
                pattern: options.pattern
              });
              for (let i = 0; i < values.length; i++) {
                files.push(values[i]);
              }
            }
            if (data.isFile()) {
              if (minimatch(basename(result), options.pattern)) {
                files.push(result);
              }
            }
            return files;
          })
      }))
      .then(dirs => dirs.join(',').split(','))
      .then(dirs => dirs.filter(dir => dir))
    })
}

async function clean(dir: string): Promise<void> {
  if (existsSync(dir)) {
    const files = await readdirAsync(dir);
    await Promise.all(files.map(async (file) => {
      const p = join(dir, file);
      const stat = await lstatAsync(p);
      if (stat.isDirectory()) {
        await clean(p);
      } else {
        await startAsync('clean', `Removed file ${p}`)
          .then(startTime => unlinkAsync(p).then(() => Promise.resolve(startTime)))
          .then(startTime => doneAsync('clean', `Removed file ${p}`, startTime));
      }
    }));
    await startAsync('clean', `Removed dir ${dir}`) 
      .then(startTime => rmdirAsync(dir).then(() => Promise.resolve(startTime)))
      .then(startTime => doneAsync('clean', `Removed dir ${dir}`, startTime));
  }
}

async function copyFiles(src: string | string[], destRootDir: string) {
  return globFiles(src).then(files => {
    return Promise.all(files.map(file => {
      const srcRootDir = file.replace(resolve() + sep, '').split(sep)[0];
      const destPath = file.replace(srcRootDir, destRootDir);
      mkdirp(dirname(destPath));
      return copyFileAsync(file, destPath);
    }))
  });
}

async function symlinkDir(src: string, dest: string, type = LINK_TYPE.DIR): Promise<void> {
  const isWin = (process.platform === 'win32');
  return ((existsSync(dest) && statSync(dest).isDirectory())
    ? (readlinkSync(dest) === src) ? unlinkAsync(dest): clean(dest)
    : Promise.resolve()
  ).then(() => symlinkAsync(src, dest, isWin ? LINK_TYPE.JUNCTION: type))
}

async function concat(src: string | string[], dest: string): Promise<void> {
  const sources = Array.isArray(src) ? src : [ src ];
  return Promise.all(sources.map(source => {
    return readFileAsync(source, 'utf8').then(content => {
      return strip(content).replace(/\n/g, '');
    })
  })).then(results => {
    mkdirp(dirname(dest));
    return writeFileAsync(dest, results.join('\n'))
  });
}

function mkdirp(directory: string){
  const dirPath = resolve(directory).replace(/\/$/, '').split(sep);
  for (let i = 1; i <= dirPath.length; i++) {
    const segment = dirPath.slice(0, i).join(sep);
    if (!existsSync(segment) && segment.length > 0) {
      mkdirSync(segment);
    }
  }
}

export {
  readdirAsync,
  statAsync,
  readFileAsync,
  writeFileAsync,
  lstatAsync,
  unlinkAsync,
  copyFileAsync,
  symlinkAsync,
  walkAsync,
  globFiles,
  LINK_TYPE,
  symlinkDir,
  clean,
  mkdirp,
  copyFiles,
  concat,
  GlobFileOptions
}