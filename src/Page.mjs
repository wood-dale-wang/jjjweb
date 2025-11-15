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
        return JSON.stringify(payload)
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

export { Page ,renderToJSON}