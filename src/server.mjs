import Fastify from 'fastify'
import { WebSocketServer } from 'ws'
import path from 'path'
import fs from 'fs'
import { URL } from 'url'
import { Element } from './Element.mjs'
import { Page, renderToJSON } from './Page.mjs'


class jjjwebServer {
    _pageInstance = undefined;//page存储
    clients = new Set();//ws连接集合
    app = undefined;//服务器实例

    constructor(PageClass, opts = {}, logger = false) {
        this.app = Fastify({ logger: logger })

        const publicDir = path.join(process.cwd(), 'public')
        this.app.get('/', async (req, reply) => {
            const file = path.join(publicDir, 'index.html')
            if (fs.existsSync(file)) return reply.type('text/html').send(fs.createReadStream(file))
            return reply.send('jjjweb')
        })

        this.app.get('/client', async (req, reply) => {
            const file = path.join(publicDir, 'client.js')
            if (fs.existsSync(file)) return reply.type('application/javascript').send(fs.createReadStream(file))
            return reply.send('// client missing')
        })

        // websocket will be handled by a standalone ws server attached to the HTTP server after listen

        const page = new PageClass()
        this._pageInstance = page
        this.broadcast(page.rebuild())

        const port = opts.port || 3000
        this.app.listen({ port, host: '0.0.0.0' }).then(() => {
            // this.app.log.info(`jjjweb listening on http://localhost:${port}`)
            console.log(`jjjweb listening on http://localhost:${port}`)

            // attach ws server to the underlying http server
            const server = this.app.server
            const wss = new WebSocketServer({ noServer: true })

            server.on('upgrade', (request, socket, head) => {
                try {
                    const u = new URL(request.url, `http://${request.headers.host}`)
                    if (u.pathname !== '/ws') {
                        socket.destroy()
                        return
                    }
                } catch (e) {
                    socket.destroy()
                    return
                }
                console.log(">>>ws on")
                wss.handleUpgrade(request, socket, head, (ws) => {
                    this.clients.add(ws)//成功连接，加入组


                    ws.on('message', (data) => {
                        try {
                            const msg = JSON.parse(data.toString())
                            console.log(`>>>ws in >>${data.toString()}`)
                            if (msg.type === 'event') {
                                if (this._pageInstance) {
                                    const node = this.findNodeById(this._pageInstance._root, msg.id)
                                    if (node && node.events && node.events[msg.name]) {
                                        // console.log(`>>>event do >>${node.id}`)
                                        node.events[msg.name].call(this._pageInstance, msg)
                                        this.broadcast(this._pageInstance.rebuild())
                                    }
                                }
                            }
                        } catch (e) { console.log(e); }
                    })

                    ws.on('close', () => this.clients.delete(ws))

                    if (this._pageInstance && this._pageInstance._root) {
                        const payload = { type: 'full', vdom: renderToJSON(this._pageInstance._root) }
                        ws.send(JSON.stringify(payload))
                    }
                })
            })
        }).catch(err => {
            console.log(err);
            // app.log.error(err)
            process.exit(1)
        })
    }

    findNodeById(node, id) {
        if (!node) return null
        if (node.id === id) return node
        for (const c of node.children || []) {
            if (typeof c === 'string') continue
            const found = this.findNodeById(c, id)
            if (found) return found
        }
        return null
    }

    broadcast(msg) {
        for (const ws of this.clients) {
            try { ws.send(msg) } catch (e) { /* ignore */ }
        }
    }
}


// helpers
function h(tag, ...children) {
    const props = {}
    const flat = [].concat(...children)
    const elChildren = flat.map(c => (c instanceof Element ? c : c))
    return new Element(tag, props, elChildren)
}

const div = (...c) => h('div', ...c)
const h1 = (...c) => h('h1', ...c)
const button = (text) => h('button', text)

export { jjjwebServer, Page, Element, div, h1, button }
