const fs = require('fs');
const path = require('path');
const memoize = require('./memoize');

const mkdirp = (directory) => {
  const dirPath = directory.replace(/\/$/, '').split(path.sep);
  for (let i = 1; i <= dirPath.length; i++) {
    const segment = dirPath.slice(0, i).join(path.sep);
    if (!fs.existsSync(segment) && segment.length > 0) {
      fs.mkdirSync(segment);
    }
  }
};

module.exports = memoize(mkdirp);