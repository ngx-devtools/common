import { ngxBuild } from './src/build-package';
import { getRollupConfig } from './rollup.config';

ngxBuild('common', getRollupConfig());