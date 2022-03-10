import axios from 'axios';
import { Gen } from './Gen';
// import JSON5 from 'json5';
// const fs = require('fs-extra');
export default async function (url: string) {
  let res = await axios.get(url);
  if (res.status == 200) {
    Gen(res.data);
  }
  console.log('完成！');
  return null;
}
