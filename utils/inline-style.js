const fs = require('fs');
const path = require('path');
const sass = require('node-sass');
const mime = require('mime');
const cssbeautify = require('./css-beautify');

const { isProcess } = require('./check-args');

const cssPrettifyParams = [ '--css-pretty',  '--css-pretty=true',  '--css-pretty true'  ];

/**
 * Inline or convert any image to base64 base
 * @param {path of the style} styleFile 
 */
const inlineImage = (styleFile) => {  
  return (inlineExpr, quotedPath) => {
    const imagesPath = path.dirname(styleFile);
    const imagePath = quotedPath.replace(/['"]/g, '');
    const fileData = fs.readFileSync(path.join(imagesPath, imagePath.substr(1, imagePath.length - 2)));
    const fileBase64 = new Buffer(fileData).toString('base64');
    const fileMime = mime.lookup(imagePath);
    return 'url(data:' + fileMime  + ';base64,' + fileBase64 + ')';
  }
};

/**
 * Get the styleUrl string content
 * @param {url of the style} styleUrl 
 * @param {path resolver} urlResolver 
 */
const getContent = (styleUrl, urlResolver) => {
  const styleFile = urlResolver(styleUrl);
  const originContent = fs.readFileSync(styleFile, 'utf8');
  const styleContent = buildSass(originContent, styleFile);
  return styleContent
    .replace(/([\n\r]\s*)+/gm, ' ')
    .replace(/"/g, '\\"')
    .replace(/inline\(([^\)]+)\)/g, inlineImage(styleFile))
};

/**
 * Format the css
 * @param {styles url} urls 
 * @param {path or url resolver} urlResolver 
 */
const cssPrettify = (urls = [], urlResolver) => {
  let styleCss = '';
  const indent = (str) => {
    var lines = [];
    var spaces = '';
    for (var i = 0; i < 4; i++) { spaces += ' '; }
    str.split('\n').forEach(function (line) {
      lines.push((/^(\s*)$/.test(line) ? '' : spaces) + line);
    });
    return lines.join('\n');
  }
  urls.forEach(styleUrl => {
    const style = '\n' + cssbeautify(getContent(styleUrl, urlResolver), { indent: '  ', autosemicolon: true }) + '\n';
    styleCss = styleCss + style;
  });
  return  'styles: [ `' + indent(styleCss) + '  `]';
};

/**
 * 
 * @param {css or scss string content} content 
 * @param {} sourceFile 
 */
const buildSass = (content, sourceFile) => {
  try {
    return sourceFile.endsWith('.scss') ? 
      sass.renderSync({ data: content, file: sourceFile, outputStyle: 'compressed' })
        .css.toString() : content;
  } catch (e) {
    console.error('\x1b[41m');
    console.error('at ' + sourceFile + ':' + e.line + ":" + e.column);
    console.error(e.formatted);
    console.error('\x1b[0m');
    return "";
  }
};

/**
 * inline Style for Production mode.
 * @param {css or scss string content} content 
 * @param {path resolver} urlResolver 
 */
const inlineStyleProdMode = (content, urlResolver) => {
  return content.replace(/styleUrls\s*:\s*(\[[\s\S]*?\])/gm, (m, styleUrls) => {
    const urls = eval(styleUrls);
    return isProcess(cssPrettifyParams)
      ? cssPrettify(urls, urlResolver)
      : 'styles: ['
        + urls.map(styleUrl => `"${ getContent(styleUrl, urlResolver) }"`)
            .join(',\n')
            .replace('\n', ' ')
        + ']';
  });
};

/**
 * inline Style for Dev mode.
 * @param {css or scss string content} content 
 * @param {path resolver} urlResolver 
 */
const inlineStyleDevMode = (content, urlResolver) => {
  return content.replace(/styleUrls\s*:\s*(\[[\s\S]*?\])/gm,  (m, styleUrls) => {
    const urls = eval(styleUrls);
    return isProcess(cssPrettifyParams) 
      ? cssPrettify(urls, urlResolver) 
      : (() => {
          m = m.replace('styleUrls', 'styles');
          urls.forEach(styleUrl => m = m.replace(styleUrl, getContent(styleUrl, urlResolver)));
          return m;
        })()
  });
};

const inlineStyleCustomElements = (content, urlResolver) => {
  return content.replace(/styleUrl\s*:\s*'([^']+?\.*css)'/g,  (m, styleUrl) => {
    return m.replace('styleUrl', 'style').replace(styleUrl, getContent(styleUrl, urlResolver))
  });
};

exports.inlineStyle = (envMode = false) =>  (envMode) ? inlineStyleProdMode : inlineStyleDevMode;

exports.inlineImage = inlineImage;
exports.getContent = getContent;
exports.cssPrettify = cssPrettify;
exports.buildSass = buildSass;
exports.inlineStyleProdMode = inlineStyleProdMode;
exports.inlineStyleDevMode = inlineStyleDevMode;
exports.inlineStyleCustomElements = inlineStyleCustomElements;