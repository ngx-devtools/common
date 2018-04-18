const fs = require('fs');

const mkdirp = (directory) => {
  const dirPath = directory.replace(/\/$/, '').split('/');
  for (let i = 1; i <= dirPath.length; i++) {
    const segment = dirPath.slice(0, i).join('/');
    if (!fs.existsSync(segment) && segment.length > 0) {
      fs.mkdirSync(segment);
    }
  }
};

module.exports = mkdirp;