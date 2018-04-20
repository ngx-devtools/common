const fs = require('fs');
const path = require('path');
const sass = require('node-sass');
const mime = require('mime');

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
    return 'styles: ['
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
    m = m.replace('styleUrls', 'styles');
    const urls = eval(styleUrls);
    urls.forEach(styleUrl => m = m.replace(styleUrl, getContent(styleUrl, urlResolver)));
    return m;
  });
};

exports.inlineStyle = (envMode = false) =>  (envMode) ? inlineStyleProdMode : inlineStyleDevMode;

exports.inlineStyleDevMode = inlineStyleDevMode;
exports.inlineStyleProdMode = inlineStyleProdMode;
exports.buildSass = buildSass;
