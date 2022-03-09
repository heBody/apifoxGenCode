#!/usr/bin/env node
const { Command } = require('commander');
import pkg from '../package.json';
import GenTs from './GenTs';
import GenJs from './GenJs';

const program = new Command(pkg.name);
program
  .version(pkg.version)
  .description('生成代码')
  .requiredOption('-u, --url <url>', 'apifox OpenAPI 请求地址')
  .option('-js', '是否是js代码')
  .action((options: any) => {
    console.log('参数：', options);

    if (options.Js) {
      GenJs(options.url);
    } else {
      GenTs(options.url);
    }
  });

program.parse(process.argv);
console.log('over!');
