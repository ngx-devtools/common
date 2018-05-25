const path = require('path');
const livereload = require('gulp-livereload');

const liveReloadParams = [ '--livereload',  '--livereload=true',  '--livereload true'  ];

const { isProcess  } = require('../utils/check-args');
const { injectHtml  } = require('../utils/inject-html');

const reloadPage = (file) => {
  if (isProcess(liveReloadParams)) livereload.changed(file);
  return Promise.resolve();
};

const liveReload = () => {
  const FILE_PATH = path.resolve(path.join('dist', 'index.html'));
  const injectReload = () => {
    livereload.listen(); return Promise.resolve();
  };
  return injectHtml(FILE_PATH)
    .then(() => isProcess(liveReloadParams) ? injectReload() : Promise.resolve());
};

exports.reloadPage = reloadPage;
exports.liveReload = liveReload;