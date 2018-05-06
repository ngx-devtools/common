const { resolve, join } = require('path');

if (!(process.env.APP_ROOT_PATH)) {
  process.env.APP_ROOT_PATH = resolve();
}

const { rimraf, deleteFolderAsync } = require('./utils/rimraf');
const { startAsync, doneAsync } = require('./utils/info');

const { getFiles, deleteFileAsync, getSource, readFileAsync, writeFileAsync, readdirAsync, copyFile } = require('./utils/file');
const { 
  inlineResources, 
  inlineResourcesFromString, 
  copyFileAsync, 
  copyFilesAsync 
} = require('./utils/inline-resources');

const { isProcess } = require('./utils/check-args');

const devtools = require('./utils/devtools');
const streamToPromise = require('./utils/stream-to-promise');
const watcher = require('./utils/watcher');
const walkSync = require('./utils/walk-dir').walkSync;
const concatAsync = require('./utils/concat');
const mkdirp = require('./utils/mkdirp');
const memoize = require('./utils/memoize');

exports.deleteFolderAsync = (folderName, hasInfo = true) => {
  return (hasInfo) ? deleteFolderAsync(folderName) : rimraf;
};

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