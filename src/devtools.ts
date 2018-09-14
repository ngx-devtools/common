import { resolve, join } from "path";
import { existsSync } from 'fs';

if (!(process.env.APP_ROOT_PATH)) {
  process.env.APP_ROOT_PATH = resolve();
}

const DEVTOOLS_PATH = join(process.env.APP_ROOT_PATH, '.devtools.json');

class Devtools {

   private _devtools = {};

   static get config(): Devtools {
    let devtools = {};
    if (existsSync(DEVTOOLS_PATH)) {
     const _devtools = require(DEVTOOLS_PATH);
     devtools = { ..._devtools };
    }
    return new Devtools(devtools);
  }

  constructor(devtools) {
    this._devtools = devtools;
  }

  get title() {
    return this._devtools['title'] || {};
  }

  get favicon() {
    return this._devtools['favicon'] || {};
  }

  get server() {
    return this._devtools['server'] || {};
  }

  get build() {
    return this._devtools['build'] || {};
  }

  get modules() {
    return this._devtools['modules'] || {};
  }

}

export { Devtools }