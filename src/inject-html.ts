import { resolve, join, isAbsolute, relative } from 'path';
import { existsSync } from 'fs';

import { readFileAsync, writeFileAsync } from './file';
import { isProcess } from './check-args';
import { buildSass, getStyleContent, stripSpaces } from './inline-sources';
import { PassThrough } from 'stream';
import { Devtools } from './devtools';

const trumpet = require('trumpet');
const strip = require('strip-comments');

if (!(process.env.APP_ROOT_PATH)) {
  process.env.APP_ROOT_PATH = resolve();
}

const liveReloadParams = [ '--livereload',  '--livereload=true',  '--livereload true'  ];
const prodModeParams = [ '--prod',  '--prod=true',  '--prod true'  ];

const devtoolsPath = join(process.env.APP_ROOT_PATH, '.devtools.json');
const DEVTOOLS_CONFIG = existsSync(devtoolsPath) ? require(devtoolsPath): {};

const SHIMS = '<!-- shims  -->';
const SYSTEMJS = '<!-- systemjs -->';
const LIVERELOAD = '<!-- livereload -->';
const TITLE = '<!-- title -->';

const argv = require('yargs')
  .option('vendor-root-dir', { default: 'node_modules/.tmp', type: 'string' })
  .argv;

function streamContent(content: string){
  const passThrough = new PassThrough();
  passThrough.write(content);
  passThrough.end();
  return passThrough;
}

function urlResolver(p: string) {
  return (isAbsolute(p)) 
    ? resolve(process.env.APP_ROOT_PATH, relative('/', p))
    : resolve(process.env.APP_ROOT_PATH, p);
}

async function createStyles(content: string) {
  const styles: string[] = (Devtools.config.build && Devtools.config.build['styles']) ? Devtools.config.build.styles: [];
  const contents = styles.map(style => getStyleContent(style, urlResolver)).join(' ')
  return Promise.resolve(contents 
      ? content.replace('<!-- styles -->', `<style>${stripSpaces(contents)}</style>`)
      : content);
}

async function inlineHtml(content: string, tr: any) {
  return new Promise((resolve, reject) => {
    const stream = streamContent(content).pipe(tr), chunks = [];
    stream.on('data', chunk => chunks.push(chunk.toString()));
    stream.on('end', () => resolve(chunks))
    stream.on('error', reject);
  }).then((chunks: any[]) => {
    const styles = chunks.filter(_ => _.includes('<style>'));
    return Promise.resolve(chunks.join('')) 
  });
}

async function injectLivereload(content: string){
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
}

async function injectShims(content: string){
  const shimsPath = join(argv.vendorRootDir, 'shims.min.js');
  return existsSync(join(process.env.APP_ROOT_PATH, shimsPath))
    ? Promise.resolve(content.replace(SHIMS, `<script src="${shimsPath}"></script>`))
    : Promise.resolve(content);
}

async function injectPolyfills(content: string) {
  const polyfills = [
    { searchValue: '<!-- native-shim -->', replaceValue: 'node_modules/.tmp/native-shim.min.js'   },
    { searchValue: '<!-- custom-elements -->', replaceValue: 'node_modules/@webcomponents/custom-elements/custom-elements.min.js' },
    { searchValue: '<!-- core-js-shim -->', replaceValue: 'node_modules/core-js/client/shim.min.js' },
    { searchValue: '<!-- system-js -->', replaceValue: 'node_modules/systemjs/dist/system.js' },
    { searchValue: '<!-- zone-js -->', replaceValue: 'node_modules/zone.js/dist/zone.min.js' }
  ];
  content = content.replace(SHIMS, polyfills.map(polyfill => polyfill.searchValue).join('\n')) ;
  for (const polyfill of polyfills) {
    content = content.replace(polyfill.searchValue, `<script src="${polyfill.replaceValue}"></script>`);
  }
  return Promise.resolve(content);
}

async function injectSystemjsScript(content: string){
  const systemjsPath = join(process.env.APP_ROOT_PATH, argv.vendorRootDir, `systemjs-script.min.js`);
  return existsSync(systemjsPath)
    ? readFileAsync(systemjsPath, 'utf8').then(fileContent => content.replace(SYSTEMJS, `<script>${fileContent}</script>`))
    : Promise.resolve(content);
}

async function injectTitle(content: string){
  const title = DEVTOOLS_CONFIG['title'];
  return Promise.resolve(content.replace(TITLE, title ? title : 'NGX AppSeed Application'));
}

async function inlineScript(content: string){
  const tr = trumpet();
  tr.selectAll('script[src]', async function(node){
    const src = node.getAttribute('src').toLowerCase();
    const w = node.createWriteStream({ outer: true });
    const filePath = urlResolver(src);
    const contents = await readFileAsync(filePath, 'utf8').then(content => {
      return strip(content).replace(/\n/g, '');
    });
    w.write(`<script>${contents}</script>`);
    w.end();
  });
  return inlineHtml(content, tr);
}

async function inlineLinkStyle(content: string) {
  const tr = trumpet();
  tr.selectAll('link[href]', async function (node) {
    if (!(node.getAttribute('type'))) {
      const href = node.getAttribute('href').toLowerCase();
      const w = node.createWriteStream({ outer: true });
      const filePath = urlResolver(join('src', href));
      const contents = await readFileAsync(filePath, 'utf8').then(content => {
        return buildSass(content, filePath)
          .replace(/([\n\r]\s*)+/g, '')
          .replace(/\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*\//g, '')
          .replace(/\s\s\s\s\s\s/g, '')
          .replace(/\s\s/g, '')
          .replace(/@custom-media/g, function(match, i) {
            return ' ' + match;
          })
      });
      w.write('<style>' + contents + '</style>');
      w.end();
    }
  });
  return inlineHtml(content, tr);
}

async function jsScripts(content: string){
  return isProcess(prodModeParams)
    ? injectPolyfills(content)
        .then(content => inlineScript(content))
        .then(content => content.replace(/([\n\r]*)+/g,""))
    : injectShims(content)
}

async function insertOtherScript(content: string) {
  const scripts = Devtools.config.build['scripts'];
  return (Devtools.config.build && scripts && Array.isArray(scripts)) 
    ? Promise.resolve(content.replace('<!-- scripts -->', 
        scripts.map((script, index) => {
          const value = `<script src="${script}"></script>`;
          return (index === 0) ? value: '\t\t' + value;
        }).join('\n')))
    : Promise.resolve(content);
}

async function injectHtml(html: string){
  return readFileAsync(html, 'utf8')
    .then(content => isProcess(liveReloadParams) ? injectLivereload(content) : Promise.resolve(content))
    .then(content => createStyles(content))
    .then(content => injectSystemjsScript(content))
    .then(content => inlineLinkStyle(content))
    .then(content => injectTitle(content))
    .then(content => jsScripts(content))
    .then(content => insertOtherScript(content))
    .then(content => writeFileAsync(html, content))
}

export { injectLivereload, injectShims, injectSystemjsScript, injectTitle, injectHtml, trumpet, inlineLinkStyle, inlineScript, urlResolver }