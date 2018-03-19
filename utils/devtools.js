const { existsSync } = require('fs');
const { resolve } = require('path');

const devToolsPath = resolve('.devtools.json');

module.exports = existsSync(devToolsPath) ? Object.assign({}, require(devToolsPath)) : {};