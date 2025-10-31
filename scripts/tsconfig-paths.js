const tsConfigPaths = require('tsconfig-paths');
const { compilerOptions } = require('../tsconfig.json');

const cleanup = tsConfigPaths.register({
  baseUrl: compilerOptions.baseUrl || '.',
  paths: compilerOptions.paths || {}
});

module.exports = {
  cleanup
};