const fs = require('fs');
const path = require('path');

const getFiles = directories => {
  const result = {};
  Object.keys(directories).forEach(directory => {
    const values = directories[directory].filter(value => {
      const file = path.join(directory, value);
      return (fs.statSync(file).isFile());
    });
    values.forEach(value => { 
      const filePath = path.join(directory, value);
      Object.assign(result, { [filePath]: fs.statSync(filePath).size });
    });
  });
  return result;
};

module.exports = getFiles;