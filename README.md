# JJJWeb (prototype)

这是一个原型实现，展示如何通过后端对象构建虚拟 DOM 并通过 WebSocket 将其同步到浏览器。

Quick start:

1. 安装依赖

```pwsh
cd e:/Xprogram/Web/jjjweb
npm install
```

2. 启动示例

```pwsh
npm start
# then open http://localhost:3000
```

实现说明：

- 使用 `fastify@5` + `@fastify/websocket` 提供 HTTP + WS 服务
- 后端定义 `Page`、`Element` 等类，构建虚拟 DOM（简单 JSON）
- 客户端 `public/client.js` 接收完整 vdom 并渲染到 `#jjjroot`
- 事件：客户端点击会发送 `{type:'event', id, name:'click'}`，后端查找节点并执行注册的处理器

下一步建议：OT/patch 差分、AJV JSON-Schema 校验、ACL、按需 patch 与性能优化。
