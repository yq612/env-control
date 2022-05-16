"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
const file_1 = require("./file");
const tool_1 = require("./tool");
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand("envControl.start", () => {
        EnvControl.createOrShow(context.extensionUri);
    }));
    if (vscode.window.registerWebviewPanelSerializer) {
        vscode.window.registerWebviewPanelSerializer(EnvControl.viewType, {
            async deserializeWebviewPanel(webviewPanel) {
                webviewPanel.webview.options = (0, tool_1.getWebviewOptions)(context.extensionUri);
                EnvControl.revive(webviewPanel, context.extensionUri);
            },
        });
    }
}
exports.activate = activate;
class EnvControl {
    constructor(panel, extensionUri) {
        this._disposables = [];
        this._panel = panel;
        this._extensionUri = extensionUri;
        // 更新 webview
        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.onDidChangeViewState(() => {
            if (this._panel.visible)
                this._update();
        }, null, this._disposables);
        // 监听 webview 发送的消息
        this._panel.webview.onDidReceiveMessage(async ({ command, data }) => {
            // 报错
            if (command === "ERROR_MESSAGE")
                vscode.window.showErrorMessage(data);
            // 获取文件列表
            if (command === "GET_FILE_list")
                this.sendFileList("");
            // 保存变量
            if (command === "SAVE_VARIABLE") {
                const { fileId, fileLine, schemaData } = data;
                EnvControl.fileManager.updateFileSchema(fileId, schemaData, fileLine);
                this.sendFileList(fileId);
            }
            // 删除行
            if (command === "REMOVE_SCHEMA") {
                const { fileId, line } = data;
                EnvControl.fileManager.removeFileSchema(fileId, line);
                this.sendFileList(fileId);
            }
            // 批量删除行
            if (command === "BATCH_REMOVE_SCHEMA") {
                const { fileId, ids } = data;
                EnvControl.fileManager.batchRemoveFileSchema(fileId, ids);
                this.sendFileList(fileId);
            }
            if (command === "ADD_SCHEMA") {
                const { fileId } = data;
                EnvControl.fileManager.addFileSchema(fileId);
                this.sendFileList(fileId);
            }
            if (command === "CREATE_ENV_FILE") {
                const { id } = EnvControl.fileManager.createEnvFile(data);
                this.sendFileList(id);
            }
            if (command === "REMOVE_ENV_FILE") {
                EnvControl.fileManager.removeEnvFile(data);
                this.sendFileList("");
            }
        }, null, this._disposables);
    }
    static createOrShow(extensionUri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        // 如果面板已经存在，直接恢复
        if (EnvControl.currentPanel) {
            EnvControl.currentPanel._panel.reveal(column);
            return;
        }
        // 否则创建新的面板
        const panel = vscode.window.createWebviewPanel(EnvControl.viewType, "环境变量控制器", column || vscode.ViewColumn.One, (0, tool_1.getWebviewOptions)(extensionUri));
        EnvControl.revive(panel, extensionUri);
    }
    static revive(panel, extensionUri) {
        EnvControl.currentPanel = new EnvControl(panel, extensionUri);
    }
    sendFileList(active) {
        this._panel.webview.postMessage({
            command: "SET_FILE_list",
            data: JSON.stringify(EnvControl.fileManager.getFlapFileList()),
            active,
        });
    }
    dispose() {
        EnvControl.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x)
                x.dispose();
        }
    }
    async _update() {
        const path = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath || "";
        this._panel.webview.html = this._getHtmlForWebview();
        EnvControl.fileManager = new file_1.FileManager(path);
        EnvControl.fileManager.initFileMap();
    }
    _asWebviewUri(...args) {
        const webview = this._panel.webview;
        const path = vscode.Uri.joinPath(this._extensionUri, ...args);
        return webview.asWebviewUri(path);
    }
    _getHtmlForWebview() {
        const webview = this._panel.webview;
        const scriptUri = this._asWebviewUri("source", "env-control.umd.js");
        const resetUri = this._asWebviewUri("source", "reset.css");
        const stylesMainUri = this._asWebviewUri("source", "style.css");
        const nonce = (0, tool_1.getNonce)();
        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${stylesMainUri}" rel="stylesheet">
				<link href="${resetUri}" rel="stylesheet">

				<title>Cat Coding</title>
			</head>
			<body>
        <div id="app"></div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
    }
}
EnvControl.fileMap = new Map();
EnvControl.viewType = "envControl";
//# sourceMappingURL=extension.js.map