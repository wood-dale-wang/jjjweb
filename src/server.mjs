import Fastify from 'fastify'
import { WebSocketServer } from 'ws'
import path from 'path'
import fs from 'fs'
import { URL } from 'url'

const clients = new Set()

class Element {
    constructor(tag, props = {}, children = []) {
        this.id = Element._nextId()
        this.tag = tag
        this.props = props
        this.children = Array.isArray(children) ? children : [children]
        this.events = {}
    }

    on(eventName, handler) {
        this.events[eventName] = handler
        return this
    }

    static _nextId() {
        Element._id = (Element._id || 0) + 1
        return `n${Element._id}`
    }
}

class Page {
    constructor() {
        this._root = null
    }

    template() {
        return null
    }

    rebuild() {
        this._root = this.template()
        // broadcast full vdom for now
        const payload = { type: 'full', vdom: renderToJSON(this._root) }
        broadcast(JSON.stringify(payload))
    }
}

function renderToJSON(node) {
    if (node == null) return null
    if (typeof node === 'string' || typeof node === 'number') return String(node)
    return {
        id: node.id,
        tag: node.tag,
        props: node.props || {},
        children: node.children.map(renderToJSON)
    }
}

function broadcast(msg) {
    for (const ws of clients) {
        try { ws.send(msg) } catch (e) { /* ignore */ }
    }
}

function serve(PageClass, opts = {}) {
    const app = Fastify({ logger: true })

    const publicDir = path.join(process.cwd(), 'public')
    app.get('/', async (req, reply) => {
        const file = path.join(publicDir, 'index.html')
        if (fs.existsSync(file)) return reply.type('text/html').send(fs.createReadStream(file))
        return reply.send('jjjweb')
    })

    app.get('/client', async (req, reply) => {
        const file = path.join(publicDir, 'client.js')
        if (fs.existsSync(file)) return reply.type('application/javascript').send(fs.createReadStream(file))
        return reply.send('// client missing')
    })

    // websocket will be handled by a standalone ws server attached to the HTTP server after listen

    const page = new PageClass()
    serve._pageInstance = page
    page.rebuild()

    const port = opts.port || 3000
    app.listen({ port, host: '0.0.0.0' }).then(() => {
        app.log.info(`jjjweb listening on http://localhost:${port}`)

        // attach ws server to the underlying http server
        const server = app.server
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
                clients.add(ws)

                ws.on('message', (data) => {
                    try {
                        const msg = JSON.parse(data.toString())
                        if (msg.type === 'event') {
                            if (serve._pageInstance) {
                                const node = findNodeById(serve._pageInstance._root, msg.id)
                                if (node && node.events && node.events[msg.name]) {
                                    node.events[msg.name].call(serve._pageInstance, msg)
                                    serve._pageInstance.rebuild()
                                }
                            }
                        }
                    } catch (e) { /* ignore malformed */ }
                })

                ws.on('close', () => clients.delete(ws))

                if (serve._pageInstance && serve._pageInstance._root) {
                    const payload = { type: 'full', vdom: renderToJSON(serve._pageInstance._root) }
                    ws.send(JSON.stringify(payload))
                }
            })
        })
    }).catch(err => {
        app.log.error(err)
        process.exit(1)
    })
}

function findNodeById(node, id) {
    if (!node) return null
    if (node.id === id) return node
    for (const c of node.children || []) {
        if (typeof c === 'string') continue
        const found = findNodeById(c, id)
        if (found) return found
    }
    return null
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

export { serve, Page, Element, div, h1, button }
