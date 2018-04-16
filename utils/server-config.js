
const path = require('path');
const fs = require('fs');

const serverConfig = (devToolsPath) => {
  const serverConfig = {};
  if (fs.existsSync(devToolsPath)) {
    const devTools = require(devToolsPath);
    if (devTools.hasOwnProperty('server')) {
     Object.assign(serverConfig, devTools.server);
    }
  } 

  const defaultConfig = { 
    "port": 4000, 
    "ip": '0.0.0.0', 
    "proxyServers": [], 
    "folders": [
      { "route": "", "root": true, "path": "dist" },
      { "route": "dist", "path": "dist" },
      { "route": "node_modules", "path": "node_modules" }
    ]
  };

  Object.keys(serverConfig).forEach(key => {
    if (defaultConfig[key]) {
      if (Array.isArray(defaultConfig[key]) && Array.isArray(serverConfig[key])) {
        const others = serverConfig[key].filter(config => {
          const value = defaultConfig[key].find(result => JSON.stringify(result) === JSON.stringify(config));
          return (!(value));
        });
        if (others) { 
          const predicate = (folder) => (folder['root'] && (folder.root === true));
          if (key === 'folders' && others.find(predicate)) {
            const index = defaultConfig[key].findIndex(predicate);
            defaultConfig[key].splice(index, 1);
          }
          defaultConfig[key].concat(others);
        }
      } else {
        defaultConfig[key] = serverConfig[key];
      }
    }
  });
  
  return defaultConfig;
};

module.exports = serverConfig(path.resolve('.devtools.json'));

