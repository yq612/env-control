# 环境变量控制器

可以对目录中的环境变量文件进行便携管理，包括：

- 查看、新增、删除环境变量文件
- 修改、添加变量
- 删除文件内容

## 用例

![demo.gif](https://s2.loli.net/2022/05/16/cUyRP1BzkGVlaCQ.gif)

## 运行插件

- `ctrl + p` 打开命令面板
- 输入 `Env Control` 启动插件

## 其他

插件只能捕获符合 `.env.[文件名]` 形式的环境变量文件

- .env.development ✔
- .env.product.local ✔
- .env3❌
- xx.env.development❌
