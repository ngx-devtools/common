const rimraf = require('rimraf');

const { resolve, join } = require('path');

if (!(process.env.APP_ROOT_PATH)) {
  process.env.APP_ROOT_PATH = resolve();
}

exports.rimraf = async (folderName) => {
  const directory = join(process.env.APP_ROOT_PATH, folderName);
  await new Promise((resolve, reject) => {
    rimraf(directory, (error) => (error) ? reject() : resolve());
  });
};

exports.ng2InlineTemplate = require('./utils/ng2-inline-template');