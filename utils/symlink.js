const fs = require('fs');

const { clean } = require('./clean');
const { symlinkAsync, unlinkAsync } = require('./file');

const isWin = (process.platform === 'win32');

const LINK_TYPE = Object.freeze({
  FILE: 'file',
  DIR: 'dir',
  JUNCTION: 'junction'
});

const symlink = (src, dest, type = LINK_TYPE.DIR) => {
  return ((fs.existsSync(dest) && fs.statSync(dest).isDirectory()) 
    ? (fs.readlinkSync(dest) === src) 
        ? unlinkAsync(dest) 
        : clean(dest)
    : Promise.resolve()
  ).then(() => symlinkAsync(src, dest, isWin ? LINK_TYPE.JUNCTION: type))
};

exports.LINK_TYPE = LINK_TYPE;
exports.symlink = symlink;