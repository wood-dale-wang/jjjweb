import { jjjwebServer, Page, div, h1, button } from '../src/server.mjs'

class CounterPage extends Page {
    constructor() {
        super()
        this.count = 0
    }

    template() {
        const inc = button('+').on('click', () => {
            this.count++
            // this.rebuild()
        })
        return div(
            h1(`Count = ${this.count}`),
            inc
        )
    }
}

let server=new jjjwebServer(CounterPage, { port: 3000 });