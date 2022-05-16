"use strict";
/**
 * @name 工具库
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebviewOptions = exports.getNonce = void 0;
/** 获取临时值 */
const getNonce = () => {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};
exports.getNonce = getNonce;
/** 获取 webview 配置 */
const getWebviewOptions = (extensionUri) => {
    return {
        enableScripts: true,
        // localResourceRoots: [vscode.Uri.joinPath(extensionUri, "source")],
    };
};
exports.getWebviewOptions = getWebviewOptions;
//# sourceMappingURL=tool.js.map