// Minimal client microkernel for jjjweb
const ws = new WebSocket((location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + location.host + '/ws')
const nodeMap = new Map()

ws.addEventListener('message', (ev) => {
    try {
        const msg = JSON.parse(ev.data)
        if (msg.type === 'full') applyFullVDOM(msg.vdom)
    } catch (e) { console.error('invalid message', e) }
})

function applyFullVDOM(vnode) {
    const root = document.getElementById('jjjroot') || (() => {
        const r = document.createElement('div')
        r.id = 'jjjroot'
        document.body.appendChild(r)
        return r
    })()
    // naive replace: rebuild DOM tree from vdom
    const dom = createDomNode(vnode)
    root.innerHTML = ''
    root.appendChild(dom)
}

function createDomNode(v) {
    if (v == null) return document.createTextNode('')
    if (typeof v === 'string') return document.createTextNode(v)
    const el = document.createElement(v.tag)
    el.dataset.jjjid = v.id
    if (v.props) {
        for (const k of Object.keys(v.props)) el.setAttribute(k, v.props[k])
    }
    if (v.children) {
        for (const c of v.children) el.appendChild(createDomNode(c))
    }
    // attach delegated click handler
    el.addEventListener('click', (e) => {
        const id = el.dataset.jjjid
        ws.send(JSON.stringify({ type: 'event', id, name: 'click' }))
    })
    return el
}

// expose for debugging
window.__jjjweb = { ws }
