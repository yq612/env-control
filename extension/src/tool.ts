/**
 * @name 工具库
 */

import * as vscode from "vscode";

/** 获取临时值 */
export const getNonce = () => {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

/** 获取 webview 配置 */
export const getWebviewOptions = (
  extensionUri: vscode.Uri
): vscode.WebviewOptions => {
  return {
    enableScripts: true,
    // localResourceRoots: [vscode.Uri.joinPath(extensionUri, "source")],
  };
};
