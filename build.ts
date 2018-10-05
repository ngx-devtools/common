import { ngxBuild } from './src/build-package';
import { getRollupConfig } from './rollup.config';

const PKG_NAME = 'common';
ngxBuild(PKG_NAME, getRollupConfig());