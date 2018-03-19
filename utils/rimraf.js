const rimraf = require('rimraf');

const { join } = require('path');
const { startAsync, doneAsync } = require('./info');

const rimrafAsync = async (folderName) => {
  const directory = join(process.env.APP_ROOT_PATH, folderName);
  await new Promise((resolve, reject) => {
    rimraf(directory, (error) => (error) ? reject() : resolve());
  });
};

const deleteFolderAsync = async (folder) => {
  await startAsync('rimraf', folder)
    .then(startTime => {
       return rimrafAsync(folder)
        .then(() => Promise.resolve(startTime));
    }).then(startTime => doneAsync('rimraf', folder, startTime));
};

exports.deleteFolderAsync = deleteFolderAsync;
exports.rimraf = rimrafAsync;