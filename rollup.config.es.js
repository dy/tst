import resolve from '@rollup/plugin-node-resolve';

export default {
  plugins: [],
  input: 'index.js',
  output: {
    name: 'tst',
    format: 'es',
    file: 'dist/tst.mjs'
  },
  plugins: [resolve()]
};
