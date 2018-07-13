import { walkAsync } from './src/file';

walkAsync('../build')
  .then(contents => console.log(contents));