const memoize = require('fast-memoize');

module.exports = (fn) => memoize(fn);