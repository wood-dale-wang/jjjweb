import Fastify from 'fastify'
import { WebSocketServer } from 'ws'
import path from 'path'
import fs from 'fs'
import { URL } from 'url'
import { Element } from './Element.mjs'
import { Page, renderToJSON } from './Page.mjs'


class jjjwebServer {
    app = undefined;//服务器实例
    cilentPageServers = new Set();//pageServer实例集合

    constructor(PageClass, opts = {}) {
        this.app = Fastify({ logger: (opts.logger == true) ? true : false })

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

                wss.handleUpgrade(request, socket, head, (ws) => {
                    this.cilentPageServers.add(new cilentPageServer(PageClass, ws, `${request.headers.host}`));
                });
            })
        }).catch(err => {
            console.log(err);
            // app.log.error(err)
            process.exit(1)
        })
    }
}

//对每一个页面都有一个cilentPageServer类型
class cilentPageServer {
    pageClass = undefined;
    ws = undefined;
    hostName = undefined;
    constructor(PageClass, ws, hostName) {
        this.pageClass = PageClass;
        this.ws = ws;
        this.hostName = hostName;

        console.log(`>>>ws on for ${this.hostName}`);
        const page = new PageClass()
        this.broadcast(page.rebuild())

        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString())
                console.log(`>>> ws in [${this.hostName}] >> ${data.toString()}`)
                if (msg.type === 'event') {
                    if (page) {
                        const node = this.findNodeById(page._root, msg.id)
                        if (node && node.events && node.events[msg.name]) {
                            // console.log(`>>>event do >>${node.id}`)
                            node.events[msg.name].call(page, node, msg)
                            this.broadcast(page.rebuild())
                        }
                    }
                }
            } catch (e) { console.log(e); }
        })

        ws.on('close', () => {
            console.log(`>>> ws off for ${this.hostName}`);
        });

        if (page && page._root) {
            const payload = { type: 'full', vdom: renderToJSON(page._root) }
            ws.send(JSON.stringify(payload))
        }
    }

    broadcast(msg) {
        try { this.ws.send(msg); }
        catch (e) { console.log(e); }
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
const input = (text) => { return new Element('input', { "placeholder": text }, null); };

export { jjjwebServer, Page, Element, div, h1, button, input }
