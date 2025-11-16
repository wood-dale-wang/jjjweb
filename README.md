# JJJWeb (prototype)

JavaScript-JSON-JavaScript Web Package

## 说明

jjjweb是一个基于对象传递的http服务器。

通过在后端模拟一个HTML-DOM树，并在前后端之间同步这颗HTML-DOM树（前端将其转化为真实的HTML-DOM树），实现了在后端通过后端语言的接口修改模拟的DOM树，就可以操作前端页面，而不必学习和书写HTML的语法。

目前来说，倾向于前端只将事件传回，而不传回DOM树，以防被XSS攻击

这是一个原型实现，展示如何通过后端对象构建虚拟 DOM 并通过 WebSocket 将其同步到浏览器。

## 注意事项

目前这个实现功能有限，性能堪忧（每次都会同步整个vDOM树，且是用js渲染创建的网页，有明显延迟），有安全隐患。

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

~~且这是跨页面同步的，即打开多个页面，无论何时，看到的计数状态是一致的，且每个页面都有等效的操作功能。只要不关闭服务器，计算器的数量状态就不会丢失。~~

现在已经将页面隔离，且对于每个页面，都有一个`cilentPageServer`类型进行处理，现在开发者提供的page类只会在`cilentPageServer`内进行实例化

## 更新说明

1. 将各个类独立。
2. 将server封装成类。
3. 新建cilentPageServer类具体实现各个客户端页面，server只负责连接。

## 实现说明

- 使用 `fastify@5` + `@fastify/websocket` 提供 HTTP + WS 服务
- 后端定义 `Page`、`Element` 等类，构建虚拟 DOM（简单 JSON）
- 客户端 `public/client.js` 接收完整 vdom 并渲染到 `#jjjroot`
- 事件：客户端点击会发送 `{type:'event', id, name:'click'}`，后端查找节点并执行注册的处理器
- 编写声明：AI编写了现在项目中绝大部分代码

## 开源

基于MIT协议（但现在实际上仅仅是一个想法），欢迎大家基于此想法进行开发。
