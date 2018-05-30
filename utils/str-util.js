const toDotCase = (str) => {
  return str.replace(/(?!^)([A-Z])/g, ' $1')
    .replace(/[_\s]+(?=[a-zA-Z])/g, '.')
    .toLowerCase();  
};

const toSpaceCase = (str) => {
  return str.replace(/[\W_]+(.|$)/g, (matches, match) => {
    return match ? ' ' + match : ''
  }).trim();
};

const toCamelCase = (str) => {
  return str.replace(/\s(\w)/g, (matches, letter) => {
    return letter.toUpperCase()
  })   
};

String.prototype.toDotCase = function (){
  return toDotCase(String(this));
}

String.prototype.toSpaceCase = function (){
  return toSpaceCase(String(this));
}

String.prototype.toCamelCase = function (){
  return toCamelCase(
    toSpaceCase(String(this))
  );
}
