const path = require('path');

const { getFiles, getSource, copyFile } = require('./file');

const mkdirp = require('./mkdirp');

const copyFileAsync = (file, dest) => {
  const destPath = file.replace(getSource(file), dest);
  mkdirp(path.dirname(destPath));
  return copyFile(file, destPath);
};

const copyFilesAsync = (files, dest) => {
  return Promise.all(files.map(file => copyFileAsync(file, dest)));
};

module.exports = (src = [], dest) => {
  const files = getFiles(src);
  return Promise.all(files.map(file => copyFilesAsync(file, dest)));
};