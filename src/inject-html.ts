import { resolve, join, isAbsolute, relative } from 'path';
import { existsSync, write } from 'fs';

import { readFileAsync, writeFileAsync } from './file';
import { isProcess } from './check-args';
import { buildSass } from './inline-sources';
import { PassThrough } from 'stream';

const trumpet = require('trumpet');
const strip = require('strip-comments');

if (!(process.env.APP_ROOT_PATH)) {
  process.env.APP_ROOT_PATH = resolve();
}

const liveReloadParams = [ '--livereload',  '--livereload=true',  '--livereload true'  ];

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

function urlResolver(p) {
  return (isAbsolute(p)) 
    ? resolve(process.env.APP_ROOT_PATH, relative('/', p))
    : resolve(process.env.APP_ROOT_PATH, p);
}

async function inlineHtml(content: string, tr: any) {
  return new Promise((resolve, reject) => {
    const stream = streamContent(content).pipe(tr), chunks = [];
    stream.on('data', chunk => chunks.push(chunk.toString()));
    stream.on('end', () => resolve(chunks.join('')))
    stream.on('error', reject);
  });
}

async function injectLivereload(content): Promise<string> {
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

async function injectShims(content): Promise<string> {
  const shimsPath = join(argv.vendorRootDir, 'shims.min.js');
  return existsSync(join(process.env.APP_ROOT_PATH, shimsPath))
    ? Promise.resolve(content.replace(SHIMS, `<script src="${shimsPath}"></script>`))
    : Promise.resolve(content);
}

async function injectSystemjsScript(content): Promise<string> {
  const systemjsPath = join(process.env.APP_ROOT_PATH, argv.vendorRootDir, `systemjs-script.min.js`);
  return existsSync(systemjsPath)
    ? readFileAsync(systemjsPath, 'utf8').then(fileContent => content.replace(SYSTEMJS, `<script>${fileContent}</script>`))
    : Promise.resolve(content);
}

async function injectTitle(content): Promise<string> {
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
    const href = node.getAttribute('href').toLowerCase();
    const w = node.createWriteStream({ outer: true });
    const filePath = urlResolver(join('src', href));
    const contents = await readFileAsync(filePath, 'utf8').then(content => {
      return buildSass(content, filePath)
        .replace(/([\n\r]\s*)+/gm," ")
        .replace(/\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*\//gm, '')
    });
    w.write('<style>' + contents + '</style>');
    w.end();
  });
  return inlineHtml(content, tr);
}

async function injectHtml(html): Promise<void> {
  return readFileAsync(html, 'utf8')
    .then(content => inlineScript(content))
    .then(content => isProcess(liveReloadParams) ? injectLivereload(content) : Promise.resolve(content))
    .then(content => injectShims(content))
    .then(content => injectSystemjsScript(content))
    .then(content => injectTitle(content))
    .then(content => inlineLinkStyle(content))
    .then(content => writeFileAsync(html, content))
};

export { injectLivereload, injectShims, injectSystemjsScript, injectTitle, injectHtml, trumpet, inlineLinkStyle, inlineScript }