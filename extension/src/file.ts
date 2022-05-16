/* eslint-disable @typescript-eslint/ban-ts-comment */
/**
 * @name 文件处理
 */

import * as fs from "fs";
import * as path from "path";

/** 文本类型 */
type LineType = "annotation" | "variable" | "blank" | "text";

interface Delta {
  [key: string]: any;
  type: LineType;
  line: number;
  content?: string;
  key?: string;
  value?: string;
}

export class FileManager {
  folderPathArr: string[];
  folderPath: string;
  filesMap = new Map<string, FileSchema>();

  constructor(fspath: string) {
    this.folderPath = fspath;
    this.folderPathArr = fs.readdirSync(fspath);
  }

  async initFileMap() {
    this.filesMap = new Map<string, FileSchema>();
    // eslint-disable-next-line no-async-promise-executor
    for (const fileName of this.folderPathArr) {
      const reg = /\w*.env.?([\W\w\s\u4E00-\u9FA5]*)$/g;
      const result = reg.exec(fileName);
      if (!result) {
        break;
      } else {
        const name = result[1];
        const filePath = path.join(this.folderPath, fileName);
        const fileSchema = this.createFileSchema(filePath);
        const id = FileManager.genNonDuplicateID();

        const formattedFile = new FileSchema({
          id,
          name,
          path: filePath,
          schema: fileSchema,
        });
        this.filesMap.set(id, formattedFile);
      }
    }
  }

  createEnvFile(fileName: string) {
    const filePath = path.join(this.folderPath, `.env.${fileName}`);

    fs.writeFileSync(filePath, "KEY=EXAMPLE");

    const fileSchema = this.createFileSchema(filePath);

    const id = FileManager.genNonDuplicateID();

    const formattedFile = new FileSchema({
      id,
      name: fileName,
      path: filePath,
      schema: fileSchema,
    });
    this.filesMap.set(id, formattedFile);

    return formattedFile;
  }

  removeEnvFile(fileId: string) {
    const fileInstance = this.getFileInstance(fileId);
    const { path } = fileInstance;
    this.filesMap.delete(fileId);
    fs.unlinkSync(path);
  }

  getFlapFileList() {
    return Array.from(this.filesMap.values());
  }

  getFileInstance(fileId: string) {
    return this.filesMap.get(fileId) as FileSchema;
  }

  updateFileSchema(fileId: string, schemaData: Delta[], targetLine?: number) {
    const fileInstance = this.getFileInstance(fileId);

    if (!targetLine) fileInstance.schema = schemaData;

    // 更新
    fileInstance.schema = fileInstance.schema.map((it, index: number) => {
      if (targetLine && it.line === targetLine) {
        return Object.assign(schemaData, { line: index + 1 });
      } else {
        return Object.assign(it, { line: index + 1 });
      }
    }) as any;
    // 更新文件
    const { path, schema } = fileInstance;
    this.writeFile(path, schema);
  }

  removeFileSchema(fileId: string, line: number) {
    const fileInstance = this.getFileInstance(fileId);
    const index = fileInstance?.schema.findIndex((it) => it.line === line) || 0;
    fileInstance?.schema.splice(index, 1);

    fileInstance.schema = fileInstance.schema.map((it, index: number) =>
      Object.assign(it, { line: index + 1 })
    );
    const { path, schema } = fileInstance;
    this.writeFile(path, schema);
  }

  batchRemoveFileSchema(fileId: string, ids: string[]) {
    const fileInstance = this.getFileInstance(fileId);

    fileInstance.schema = fileInstance.schema
      .filter((it) => !ids.includes(it.id))
      .map((it, index: number) => Object.assign(it, { line: index + 1 }));

    const { path, schema } = fileInstance;
    this.writeFile(path, schema);
  }

  addFileSchema(fileId: string, index?: number) {
    const fileInstance = this.getFileInstance(fileId);
    const targetIndex = index ? index : fileInstance.schema.length;
    const schemaData = this.createSchema(targetIndex + 1);
    fileInstance.schema.push(schemaData);
    // 更新文件
    const { path, schema } = fileInstance;
    this.writeFile(path, schema);
  }

  createFileSchema(path: string): Delta[] {
    const regVarReg = new RegExp(
      /([\w\s\u4E00-\u9FA5]*)=([\W\w\s\u4E00-\u9FA5].*)/
    );
    const res = fs.readFileSync(path, { encoding: "utf8" });

    const temp = res.split(/\n|\r\n/).map((it, index: number) => {
      // 去除左右两边的空白
      const res = it.replace(/(^\s*)|(\s*$)/g, "") as string;

      const base = { id: FileManager.genNonDuplicateID(), line: index + 1 };
      // 情况1：空白行
      if (!res) return Object.assign(base, { type: "blank" });

      // 情况2：注释
      if (/^#/.test(res)) {
        return Object.assign(base, { type: "annotation", content: res });
      } else {
        const result = regVarReg.exec(res);
        // 情况3：普通文本
        if (!result) return Object.assign(base, { type: "text", content: res });

        // 情况4：变量
        return Object.assign(base, {
          type: "variable",
          key: result[1],
          value: result[2],
        });
      }
    }) as Delta[];
    return temp;
  }
  /** 写入文件 */
  writeFile(path: string, schema: any[]) {
    const content = schema
      .map((it: any) => {
        const { key, value, content, type } = it;
        // 变量
        if (type === "variable") return key + "=" + value;
        // 注释、文本
        if (["annotation", "text"].includes(type)) return content;
        // 空白
        if (type === "blank") return "";
      })
      .join("\n");
    return fs.writeFileSync(path, content);
  }

  /** 创建新的一行 */
  createSchema(line: number) {
    return {
      id: FileManager.genNonDuplicateID(),
      type: "variable",
      key: "KEY",
      value: "DEFAULT",
      line,
    } as Delta;
  }

  /** 创建新的环境变量文件 */
  static createEnvFile(path: string, content: string) {
    fs.writeFileSync(path, content);
  }

  /** 生成不重复的id */
  static genNonDuplicateID() {
    return Math.random().toString(36);
  }
}

export class FileSchema {
  [x: string]: any;
  name = "默认文件";
  schema: Delta[] = [];
  path = "";
  fileInstance: any;
  constructor(params: any) {
    Object.assign(this, params);
  }
}
