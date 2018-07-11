const { resolve } = require('path');

if (!(process.env.APP_ROOT_PATH)) {
  process.env.APP_ROOT_PATH = resolve();
}

const { concat, concatAsync } = require('./utils/concat');
const copy = require('./utils/copy');

const { 
  getFiles, 
  getSource, 
  lstatAsync,
  unlinkAsync,
  rmdirAsync,
  readFileAsync,
  writeFileAsync,  
  readdirAsync, 
  copyFile,
  appendFile
} = require('./utils/file');

const { startAsync, doneAsync } = require('./utils/info');
const { injectHtml } = require('./utils/inject-html');

const inlineTemplate = require('./utils/inline-html-template');

const { 
  inlineResources, 
  inlineResourcesFromString, 
  copyFileAsync, 
  copyFilesAsync
} = require('./utils/inline-resources');

const { 
  inlineImage, 
  getContent, 
  cssPrettify, 
  buildSass, 
  inlineStyleProdMode, 
  inlineStyleDevMode 
} = require('./utils/inline-style');

const memoize = require('./utils/memoize');
const mkdirp = require('./utils/mkdirp');
const devtools = require('./utils/devtools');
const streamToPromise = require('./utils/stream-to-promise');
const watcher = require('./watcher');

const { minify, minifyContent } = require('./utils/minify');
const { isProcess } = require('./utils/check-args');
const { clean } = require('./utils/clean');
const { walkSync } = require('./utils/walk-dir');
const { symlink, LINK_TYPE } = require('./utils/symlink');

const terser = require('terser');

require('./utils/str-util');

exports.clean = clean;

/// ./utils/file
exports.getFiles = getFiles;
exports.getSource = getSource;
exports.lstatAsync = lstatAsync;
exports.unlinkAsync = unlinkAsync;
exports.rmdirAsync = rmdirAsync;
exports.readFileAsync = readFileAsync;
exports.writeFileAsync = writeFileAsync;
exports.readdirAsync = readdirAsync;
exports.appendFile = appendFile;

/// ./utils/info
exports.startAsync = startAsync;
exports.doneAsync = doneAsync;

/// ./utils/inject-html
exports.injectHtml = injectHtml;

/// ./utils/inline-html-template
exports.inlineTemplate = inlineTemplate;

/// ./utils/inline-resources
exports.inlineResources = inlineResources;
exports.inlineResourcesFromString = inlineResourcesFromString;
exports.copyFilesAsync = copyFilesAsync;
exports.copyFileAsync = copyFileAsync;

/// ./utils/inline-style
exports.inlineImage = inlineImage;
exports.getContent = getContent;
exports.cssPrettify = cssPrettify;
exports.buildSass = buildSass;
exports.inlineStyleProdMode = inlineStyleProdMode;
exports.inlineStyleDevMode = inlineStyleDevMode;

/// ./utils/memoize
exports.memoize = memoize;

/// ./utils/minify
exports.minify = minify;
exports.minifyContent = minifyContent;

exports.mkdirp = mkdirp;
exports.symlinkAsync = symlink;
exports.LINK_TYPE = LINK_TYPE;
exports.uglifyJS = terser;
exports.watcher = watcher;
exports.copyFile = copyFile;
exports.streamToPromise = streamToPromise;
exports.devtools = devtools;
exports.walkSync = walkSync;
exports.concatAsync = concatAsync;
exports.concat = concat;
exports.isProcess = isProcess;
exports.copy = copy;