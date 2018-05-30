const path = require('path');
const mkdirp = require('./mkdirp');
const { getFiles, copyFile } = require('./file');

const copy = ({ src = [], dest, preserveExactDestination = true }) => {
  const files = getFiles(src).map(file => file.join(',')).join(',').split(',');
  return Promise.all(files.map(file => {
    const fileDestPath = (preserveExactDestination) 
      ? file.replace('src', dest)
      : path.join(`${dest}`, path.basename(file));
    mkdirp(path.dirname(fileDestPath));
    return copyFile(file, fileDestPath);
  }));
};

module.exports = copy;