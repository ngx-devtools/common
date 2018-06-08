const { resolve, join } = require('path');

if (!(process.env.APP_ROOT_PATH)) {
  process.env.APP_ROOT_PATH = resolve();
}

const { 
  getFiles, 
  deleteFileAsync, 
  getSource, 
  readFileAsync, 
  writeFileAsync, 
  readdirAsync, 
  copyFile 
} = require('./utils/file');

const { 
  inlineResources, 
  inlineResourcesFromString, 
  copyFileAsync, 
  copyFilesAsync 
} = require('./utils/inline-resources');

const { isProcess } = require('./utils/check-args');
const { injectHtml } = require('./utils/inject-html');
const { clean } = require('./utils/clean');
const { walkSync } = require('./utils/walk-dir');
const { concat, concatAsync } = require('./utils/concat');
const { startAsync, doneAsync } = require('./utils/info');

const copy = require('./utils/copy');
const devtools = require('./utils/devtools');
const streamToPromise = require('./utils/stream-to-promise');
const watcher = require('./watcher');
const mkdirp = require('./utils/mkdirp');
const memoize = require('./utils/memoize');
const { minify, minifyContent } = require('./utils/minify');

const uglifyJS = require('uglify-es');

require('./utils/str-util');

exports.minifyContent = minifyContent;
exports.clean = clean;
exports.injectHtml = injectHtml;
exports.minify = minify;
exports.uglifyJS = uglifyJS;
exports.mkdirp = mkdirp;
exports.getFiles = getFiles;
exports.watcher = watcher;
exports.copyFile = copyFile;
exports.startAsync = startAsync;
exports.doneAsync = doneAsync;
exports.streamToPromise = streamToPromise;
exports.devtools = devtools;
exports.walkSync = walkSync;
exports.concatAsync = concatAsync;
exports.concat = concat;
exports.inlineResources = inlineResources;
exports.inlineResourcesFromString = inlineResourcesFromString;
exports.copyFilesAsync = copyFilesAsync;
exports.copyFileAsync = copyFileAsync;
exports.getSource = getSource;
exports.writeFileAsync = writeFileAsync;
exports.readFileAsync = readFileAsync;
exports.readdirAsync = readdirAsync;
exports.memoize = memoize;
exports.isProcess = isProcess;
exports.copy = copy;