# NGX DevTools Common
Re-usable function or utilities

## File API
* `globFiles` - return promise of string array of file paths matching one or more globs.
  - `globFiles(<globs>): Promise<string>`
  ```js
  const { globFiles } = require('@ngx-devtools/common');

  (async function(){
    const files = await globFiles('src/**/*.ts');
  })();
  ```
* `clean` - remove/delete directory and files matching the dir path.
  - `clean(<dir>): Promise<void>`
  ```js
  const { clean } = require('@ngx-devtools/common');

  (async function(){
    await clean('dist');
  })();
  ```
* `copyFiles` - copy list of files matching the globs.
  - `copyFiles(<globs>, <destRootDir>): Promise<void>`
  ```js
  const { copyFiles } = require('@ngx-devtools/common');

  (async function(){
    await copyFiles('src/**/*.ts', 'temp');
  })
  ```
* `mkdirp` - recursively create directory.
  - `mkdirp(<dir>): void`
  ```js
  const { mkdirp } = require('@ngx-devtools/common');
  mkdirp('dist');
  ```


### Node util.promisify
- Convert the Node File API to Promise using util.promisify

  * `statAsync`
  * `readFileAsync`
  * `writeFileAsync`
  * `lstatAsync`
  * `unlinkAsync`
  * `copyFileAsync`
  * `symlinkAsync`
  * `rmdirAsync`
  * `renameAsync`