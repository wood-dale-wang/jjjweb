# JJJWeb (prototype)

JavaScript-JSON-JavaScript Web Package

## 说明

jjjweb是一个基于对象传递的http服务器。

通过在后端模拟一个HTML-DOM树，并在前后端之间同步这颗HTML-DOM树（前端将其转化为真实的HTML-DOM树），实现了在后端通过后端语言的接口修改模拟的DOM树，就可以操作前端页面，而不必学习和书写HTML的语法。

这是一个原型实现，展示如何通过后端对象构建虚拟 DOM 并通过 WebSocket 将其同步到浏览器。

## 注意事项

目前这个实现功能有限，性能堪忧（每次都会同步整个vDOM树）。

且从逻辑上说本项目的想法**非常不安全**：前端的DOM可能被篡改，导致恶意代码被同步到服务器，形成存储型XSS攻击。

（但是你现在运行这个项目遭到存储型XSS攻击的概率较低，因为还没实现向服务器同步的功能，现在是基于返回事件构建的demo）

## Quick start

1. 安装依赖

    ```sh
    cd jjjweb
    npm install
    ```

2. 启动示例

    ```sh
    npm start
    ```

打开浏览器进入`localhost:3000`，你会看到一个计数器页面，点击`+`按钮，计数器增加1。

且这是跨页面同步的，即打开多个页面，无论何时，看到的计数状态是一致的，且每个页面都有等效的操作功能。只要不关闭服务器，计算器的数量状态就不会丢失。

查看源代码很容易理解这一点。

## 实现说明

- 使用 `fastify@5` + `@fastify/websocket` 提供 HTTP + WS 服务
- 后端定义 `Page`、`Element` 等类，构建虚拟 DOM（简单 JSON）
- 客户端 `public/client.js` 接收完整 vdom 并渲染到 `#jjjroot`
- 事件：客户端点击会发送 `{type:'event', id, name:'click'}`，后端查找节点并执行注册的处理器
- 编写声明：AI编写了现在项目中绝大部分代码

## 开源

基于MIT协议（但现在实际上仅仅是一个想法），欢迎大家基于此想法进行开发。
