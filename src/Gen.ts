import { Api, ApiTemplate, Field, Parameter } from './ApiTemplate';

const fs = require('fs-extra');
let idCount = 0;

function getIdCount() {
  return ++idCount;
}
// 请求方法
const METHOD_NAME = [
  'get',
  'post',
  'put',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
];
// 嵌套对像池
let filedStrOutList: any[] = [];
// test
// import dataList from './test.json';
// Gen(dataList);
export function Gen(dataList: any) {
  // console.log(dataList);

  let tagsObj: any = {};
  // 封装数据
  for (const item of dataList.tags) {
    tagsObj[item.name] = [];
  }
  let paths: any = dataList.paths;
  let methodName: string = '';
  for (const key in paths) {
    let item: any = paths[key] as any;
    for (const mn of METHOD_NAME) {
      if (Reflect.has(item, mn)) {
        methodName = mn;
        break;
      }
    }
    let mainData = item[methodName];
    let folder = mainData['x-apifox-folder'];
    let list: any[] = tagsObj[folder] || (tagsObj[folder] = []);
    let obj = { url: key, methodName, mainData };
    list.push(obj);
  }

  // 转换数据
  let output = transform(tagsObj);
  outputCode(output);
  // console.log('输出', output);
}

function outputCode(list: ApiTemplate[]) {
  for (const template of list) {
    let fStr = `import { BasicFetchResult } from '/@/api/model/baseModel';
    import { defHttp } from '/@/utils/http/axios';`;
    for (const api of template.apis) {
      filedStrOutList.length = 0;
      let parameter = api.parameter;
      if (parameter) {
        fStr += genParameterCode(parameter);
        // console.log(genParameterCode(parameter));
      }
      let resultParameter = api.result;
      if (resultParameter) {
        fStr += genParameterCode(resultParameter);
      }
      for (const filedStrOut of filedStrOutList) {
        fStr += filedStrOut;
        // console.log(filedStrOut);
      }
      fStr += `
      /**
       *  ${api.comment}
      */
      export const ${api.methond}${api.name} = (params: ${parameter.name}) => {
        return defHttp.${api.methond}<${resultParameter.name}[]>({ url: \`${api.url}\`, params });
      };`;
    }

    console.log('outfile：', template.fileName);
    fs.outputFile(`./.out/${template.fileName}`, fStr);
  }
}

function genParameterCode(param: Parameter) {
  let fStr = '';
  for (const item of param.fields) {
    fStr += genFieldCode(item);
  }
  let out = `export type ${param.name} = {
    ${fStr}
  };`;

  return out;
}

function genFieldCode(f: Field) {
  if (f.objFields) {
    filedStrOutList.push(genParameterCode(f.objFields));
  }
  return `${f.name}${f.required ? '' : '?'}: ${f.type}; // ${
    f.comment || ''
  }\n`;
}

function transform(tagsObj: any) {
  let output = [];
  for (const key in tagsObj) {
    let items = tagsObj[key];
    let templage = new ApiTemplate();
    templage.fileName = key + '.ts';
    for (const item of items) {
      let api = new Api();
      let mainData = item.mainData;
      // 接口注释
      api.comment = mainData['summary'];
      // 接口说明
      api.desc = mainData['description'];
      let urlStr = item.url;
      api.url = urlStr.replace(/\{/g, '${params.');
      api.methond = item.methodName;

      let parameter = new Parameter();
      api.parameter = parameter;
      urlStr = urlStr.replace(/[\{\}]/g, '');
      let urlSplit: string[] = urlStr.split('/');

      let tempName = urlSplit.join('');
      let tName = tempName.charAt(0).toUpperCase() + tempName.substring(1);
      api.name = tName;
      parameter.name = tName + 'Params';
      // 参数
      let parametersRaw = mainData['parameters'];
      if (parametersRaw) {
        for (const item of parametersRaw) {
          let f = new Field();
          f.name = item.name;
          f.comment = item.description;
          f.required = item.required;
          f.type = item.schema?.type;
          parameter.fields.push(f);
        }
      }
      let requestBodyRaw = mainData['requestBody'];
      if (requestBodyRaw) {
        let content = requestBodyRaw.content;
        if (content) {
          let contentData = getContentData(content);
          if (contentData) {
            parameter.fields = [...parameter.fields, ...contentData];
          }
        }
      }
      // 返回
      let responsesRaw = mainData['responses'];
      if (responsesRaw) {
        let resultModel = new Parameter();
        api.result = resultModel;
        resultModel.name = tName + 'ResultModel';

        const content = responsesRaw?.['200']?.content;
        if (content) {
          let contentData = getContentData(content);
          if (contentData) {
            resultModel.fields = [...contentData];
          }
        }
      }

      templage.apis.push(api);
    }
    output.push(templage);
  }
  return output;
}

function getContentData(content: any) {
  if (content) {
    let josnData = content['application/json'];
    let schema = josnData?.schema;
    if (josnData) {
      let properties = walkProperties(schema.properties, schema.required);
      return properties;
    }
  }
  return null;
}

function walkProperties(properties: any, requiredsRaw: string[]) {
  if (!properties) return null;
  let ret: Field[] = [];
  for (const key in properties) {
    let pObj = properties[key];
    let f = new Field();
    ret.push(f);
    f.name = key;
    let type = pObj.type;
    if (type == 'array') {
      let iType = changeType(pObj.items.type);
      if (iType == 'object') {
        let typeName =
          f.name.charAt(0).toUpperCase() +
          f.name.substring(1) +
          'Field_' +
          getIdCount();
        f.type = typeName + '[]';
        let fieldParam = new Parameter();
        fieldParam.name = typeName;
        let ps = walkProperties(
          pObj.items?.properties,
          pObj.items?.required ?? []
        );
        if (ps) {
          fieldParam.fields = [...ps];
        }
        f.objFields = fieldParam;
      } else {
        f.type = changeType(pObj.items.type) + '[]';
      }
    } else if (type == 'object') {
      f.type =
        f.name.charAt(0).toUpperCase() +
        f.name.substring(1) +
        'Field_' +
        ((Math.random() * 100) | 0);
      let fieldParam = new Parameter();
      fieldParam.name = f.type;
      let ps = walkProperties(pObj.properties, pObj.required);
      if (ps) {
        fieldParam.fields = [...ps];
      }
      f.objFields = fieldParam;
    } else {
      f.type = changeType(pObj.type);
    }
    f.comment = pObj.description;
    f.required = requiredsRaw.indexOf(key) != -1;
  }
  return ret;
}

function changeType(val: string) {
  switch (val) {
    case 'integer':
      return 'number';
      break;
  }
  return val;
}
