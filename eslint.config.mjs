import config from './packages/config/eslint.config.mjs';
import globals from 'globals';

export default [
  ...config,
  { files: ['scripts/**/*.mjs'], languageOptions: { globals: globals.node } },
];
