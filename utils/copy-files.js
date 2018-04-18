const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');

const promisify = require('util').promisify;

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

const { walkSync } = require('./walk-dir');
const { getFiles } = require('./file');

const getSource = (file) => {
  return file.replace(/\/$/, '').replace(path.resolve() + '/', '').split('/')[0];
};

const copyFileAsync = (file, dest) => {
  const destPath = file.replace(getSource(file), dest);
  const dirBaseName = path.dirname(destPath);
  mkdirp.sync(dirBaseName);
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