const path = require('path');

const { readFileAsync, writeFileAsync } = require('./file');
const { isProcess } = require('./check-args');

const SHIMS = '<!-- shims  -->';
const SYSTEMJS = '<!-- systemjs -->';
const LIVERELOAD = '<!-- livereload -->';
const TITLE = '<!-- title -->';

const DEVTOOLS_CONFIG = require('./devtools')

const liveReloadParams = [ '--livereload',  '--livereload=true',  '--livereload true'  ];

const injectLivereload = (content) => {
  const defaults = {
    port: 35729,
    host: 'http://\' + (location.host || "localhost").split(":")[0] + \'',
    script: 'livereload.js',
    snipver: 1
  },
  template = opts => {
    const scriptSrc = opts.host + ':' + opts.port + '/' + opts.script + '?snipver=' + opts.snipver;
    return '\n<script>document.write(\'<script src="' + scriptSrc + '"></\' + \'script>\');</script>';
  };
  return Promise.resolve(content.replace(LIVERELOAD, template(defaults)));
};

const injectShims = (content) => {
  return Promise.resolve(content.replace(SHIMS, '<script src="node_modules/.tmp/shims.min.js"></script>'));
};

const injectSystemjsScript = (content) => {
  return readFileAsync(path.resolve('node_modules/.tmp/systemjs-script.min.js'), 'utf8')
    .then(fileContent => Promise.resolve(content.replace(SYSTEMJS, `<script>${fileContent}</script>`)));
};

const injectTitle = (content) => {
  const title = DEVTOOLS_CONFIG['title'];
  return Promise.resolve(content.replace('<!-- title -->', title ? title : 'NGX AppSeed Application'));
};

const injectHtml = (html) => {
  return readFileAsync(html, 'utf8')
    .then(content => isProcess(liveReloadParams) ? injectLivereload(content) : Promise.resolve(content))
    .then(content => injectShims(content))
    .then(content => injectSystemjsScript(content))
    .then(content => injectTitle(content))
    .then(content => writeFileAsync(html, content));
};

exports.injectHtml = injectHtml;

