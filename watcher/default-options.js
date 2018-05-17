const defaultOptions = { 
  files: 'src',
  ignored: [
    'node_modules', 'dist', '.git', '.DS_Store',  
    'README.md',  '.tmp', 'temp/**', '.gitignore'
  ],
  onClientFileChanged: (file) => Promise.resolve(),
  onServerFileChanged: (file) => Promise.resolve()
};

module.exports = defaultOptions;