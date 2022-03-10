/**
 * 字段模型
 */
export class Field {
  name!: string;
  type!: string;
  required!: boolean;
  comment!: string;
  // 嵌套属性
  objFields!: Parameter | null;
}
/**
 * 参数模型
 */
export class Parameter {
  name!: string;
  fields: Field[] = [];
}

/**
 * api 类
 */
export class Api {
  //请求方法
  name!: string;
  methond!: string;
  comment!: string;
  desc!: string;
  url!: string;
  parameter!: Parameter;
  result!: Parameter;

  toString() {
    return `${this.comment}, ${this.parameter}, ${this.result}`;
  }
}
/**
 * api 模板
 */
export class ApiTemplate {
  fileName!: string;
  apis: Api[] = [];

  toString(): string {
    return `${this.fileName}, ${this.apis}`;
  }
  valueOf() {
    return 'aaaa';
  }
}
