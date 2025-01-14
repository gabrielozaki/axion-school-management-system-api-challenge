import path from 'path';
import glob from 'glob';

import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export default (pattern) => {
  const files = glob.sync(pattern);
  const modules = {}; /** <--- not array */
  files.forEach((p) => {
    const key = p.split('/').pop().split('.').shift();
    // eslint-disable-next-line  import/no-dynamic-require
    modules[key] = require(path.resolve(p));
  });
  return modules;
};
