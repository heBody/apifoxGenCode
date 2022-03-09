import axios from 'axios';
// import JSON5 from 'json5';
const fs = require('fs-extra');
export default async function (url: string) {
  let res = await axios.get(url);
  console.log('tss', res);
  fs.outputFile('./out/a.json', res.toString());
}
