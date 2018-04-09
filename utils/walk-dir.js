const fs = require('fs');
const path = require('path');

const walk = ({ dir, isRecursive = true, includes = [] }) => {
  let results = [];
  const rootDir = path.resolve(dir);
  const files = fs.readdirSync(rootDir);
  files.forEach(list => {
    list = path.join(rootDir, list)
    const stat = fs.statSync(list);
    if (stat.isDirectory() && isRecursive) {
      results = results.concat(walk(
        { dir: list, isRecursive: isRecursive, includes: includes }
      ));
    } 
    if (stat.isFile()) {
      if (includes.length <= 0) { 
        results.push(list);
      } else if (includes.includes(path.extname(list))) {
        results.push(list); 
      }
    }
  });
  return results;
};

exports.walkSync = ({ dir, isRecursive = true, includes = [] }) => {
  return walk({ dir, isRecursive, includes});
};