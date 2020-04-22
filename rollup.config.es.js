import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'index.js',
  output: {
    name: 'tst',
    format: 'es',
    file: 'dist/tst.mjs'
  },
  plugins: [resolve()]
};
