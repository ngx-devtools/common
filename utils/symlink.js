const fs = require('fs');

const { clean } = require('./clean');
const { symlinkAsync, unlinkAsync } = require('./file');

const LINK_TYPE = Object.freeze({
  FILE: 'file',
  DIR: 'dir'
});

const symlink = (src, dest, type = LINK_TYPE.DIR) => {
  return ((fs.existsSync(dest) && fs.statSync(dest).isDirectory()) 
    ? (fs.readlinkSync(dest) === src) 
        ? unlinkAsync(dest) 
        : clean(dest)
    : Promise.resolve()
  ).then(() => symlinkAsync(src, dest, type))
};

exports.LINK_TYPE = LINK_TYPE;
exports.symlink = symlink;