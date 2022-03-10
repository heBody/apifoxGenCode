import * as path from 'path'
import typescript from 'rollup-plugin-typescript2'
import resolve from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import replace from '@rollup/plugin-replace'
import dts from 'rollup-plugin-dts'
import { version } from './package.json'
import { preserveShebangs } from 'rollup-plugin-preserve-shebangs';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';

const builds = {
  // 'cjs-dev': {
  //   outFile: 'apifox-gencode.common.js',
  //   format: 'cjs',
  //   mode: 'development',
  // },
  'cjs-dev': {
    outFile: 'apifox-gencode.js',
    format: 'cjs',
    mode: 'production',
  },
  // 'cjs-prod': {
  //   outFile: 'apifox-gencode.common.prod.js',
  //   format: 'cjs',
  //   mode: 'production',
  // },
  // 'umd-dev': {
  //   outFile: 'apifox-gencode.js',
  //   format: 'umd',
  //   mode: 'development',
  // },
  // 'umd-prod': {
  //   outFile: 'apifox-gencode.prod.js',
  //   format: 'umd',
  //   mode: 'production',
  // },
  // esm: {
  //   outFile: 'apifox-gencode.esm.js',
  //   format: 'es',
  //   mode: 'development',
  // },
  // mjs: {
  //   outFile: 'apifox-gencode.mjs',
  //   format: 'es',
  //   mode: 'development',
  // },
}

function onwarn(msg, warn) {
  if (!/Circular/.test(msg)) {
    warn(msg)
  }
}

function getAllBuilds() {
  return Object.keys(builds).map((key) => genConfig(builds[key]))
}

function genConfig({ outFile, format, mode }) {
  const isProd = mode === 'production'
  return {
    input: './src/index.ts',

    output: {
      file: path.join('./dist', outFile),
      format: format,
      globals: {
        vue: 'Vue',
      },
      exports: 'named',
      name: format === 'umd' ? 'VueCompositionAPI' : undefined,
    },
    external: ['vue'],
    onwarn,
    plugins: [
      preserveShebangs(),
      commonjs(),
      json(),
      replace({
        preventAssignment: true,
        'process.env.NODE_ENV':
          format === 'es'
            ? // preserve to be handled by bundlers
            'process.env.NODE_ENV'
            : // hard coded dev/prod builds
            JSON.stringify(isProd ? 'production' : 'development'),
        __DEV__:
          format === 'es'
            ? // preserve to be handled by bundlers
            `(process.env.NODE_ENV !== 'production')`
            : // hard coded dev/prod builds
            !isProd,
        __VERSION__: JSON.stringify(version),
      }),
      typescript({
        tsconfigOverride: {
          declaration: false,
          declarationDir: null,
          emitDeclarationOnly: false,
        },
        useTsconfigDeclarationDir: true,
      }),
      resolve(),

      isProd && terser(),
    ].filter(Boolean),
  }
}

let buildConfig

if (process.env.TARGET) {
  buildConfig = [genConfig(builds[process.env.TARGET])]
} else {
  buildConfig = getAllBuilds()
}

// bundle typings
buildConfig.push({
  input: 'src/index.ts',
  output: {
    file: 'dist/apifox-gencode.d.ts',
    format: 'es',
  },
  onwarn,
  plugins: [dts()],
})

export default buildConfig
