const { resolve, join } = require('path');

if (!(process.env.APP_ROOT_PATH)) {
  process.env.APP_ROOT_PATH = resolve();
}

const { rimraf, deleteFolderAsync } = require('./utils/rimraf');
const { startAsync, doneAsync } = require('./utils/info');

const devtools = require('./utils/devtools');
const streamToPromise = require('./utils/stream-to-promise');
const ng2InlineTemplate = require('./utils/ng2-inline-template')
const copyFiles = require('./utils/copy-files');

exports.deleteFolderAsync = (folderName, hasInfo = true) => {
  return (hasInfo) ? deleteFolderAsync(folderName) : rimraf;
};

exports.copyFiles = copyFiles;
exports.rimraf = rimraf;
exports.startAsync = startAsync;
exports.doneAsync = doneAsync;
exports.streamToPromise = streamToPromise;
exports.devtools = devtools;
exports.ng2InlineTemplate = ng2InlineTemplate;