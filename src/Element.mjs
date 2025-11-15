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

export { Element };