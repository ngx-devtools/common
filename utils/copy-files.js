const path = require('path');

const { walkSync } = require('./walk-dir');
const { getFiles, getSource, readFileAsync, writeFileAsync } = require('./file');

const mkdirp = require('./mkdirp');

const copyFileAsync = (file, dest) => {
  const destPath = file.replace(getSource(file), dest);
  mkdirp(path.dirname(destPath));
  return readFileAsync(file)
    .then(fileBuffer => writeFileAsync(destPath, fileBuffer));
};

const copyFilesAsync = (files, dest) => {
  return Promise.all(files.map(file => copyFileAsync(file, dest)));
};

module.exports = (src = [], dest) => {
  const files = getFiles(src);
  return Promise.all(files.map(file => copyFilesAsync(file, dest)));
};