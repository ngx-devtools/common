
const copyFiles = (src, dest) => {
  const vfs = require('vinyl-fs');
  const streamToPromise = require('./stream-to-promise');
  return streamToPromise(vfs.src(src).pipe(vfs.dest(dest)));
};

module.exports = copyFiles;