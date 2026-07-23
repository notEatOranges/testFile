/* eslint-env node */
module.exports = {
  "root": true,
  "extends": [
    "plugin:vue/vue3-essential",
    "eslint:recommended"
  ],
  "parserOptions": {
    "ecmaVersion": "latest"
  },
  "env": {
    "browser": true,
    "es2022": true
  },
  "globals": {
    "module": "readonly",
    "require": "readonly",
    "process": "readonly",
    "__dirname": "readonly"
  }
}