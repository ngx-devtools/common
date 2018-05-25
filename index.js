const { resolve, join } = require('path');

if (!(process.env.APP_ROOT_PATH)) {
  process.env.APP_ROOT_PATH = resolve();
}

const { rimraf, deleteFolderAsync } = require('./utils/rimraf');
const { startAsync, doneAsync } = require('./utils/info');

const { getFiles, deleteFileAsync, getSource, readFileAsync, writeFileAsync, readdirAsync, copyFile } = require('./utils/file');
const { inlineResources, inlineResourcesFromString, copyFileAsync, copyFilesAsync } = require('./utils/inline-resources');

const { isProcess } = require('./utils/check-args');
const { concat, concatAsync } = require('./utils/concat');
const { injectHtml } = require('./utils/inject-html');

const devtools = require('./utils/devtools');
const streamToPromise = require('./utils/stream-to-promise');
const watcher = require('./watcher');
const walkSync = require('./utils/walk-dir').walkSync;
const mkdirp = require('./utils/mkdirp');
const memoize = require('./utils/memoize');
const minify = require('./utils/minify');

const uglifyJS = require('uglify-es');

exports.deleteFolderAsync = (folderName, hasInfo = true) => {
  return (hasInfo) ? deleteFolderAsync(folderName) : rimraf;
};

exports.injectHtml = injectHtml;
exports.minify = minify;
exports.uglifyJS = uglifyJS;
exports.mkdirp = mkdirp;
exports.getFiles = getFiles;
exports.watcher = watcher;
exports.copyFile = copyFile;
exports.rimraf = rimraf;
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
exports.deleteFileAsync = deleteFileAsync;
exports.getSource = getSource;
exports.writeFileAsync = writeFileAsync;
exports.readFileAsync = readFileAsync;
exports.readdirAsync = readdirAsync;
exports.memoize = memoize;
exports.isProcess = isProcess;