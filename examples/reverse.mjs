import { jjjwebServer, Page, div, h1, button, input } from '../src/server.mjs'

class ReversePage extends Page {
    constructor() {
        super();
        this.str = "";
    }

    template() {
        const inputel = input('input').on('change', (node, msg) => {
            // console.log(node);
            this.str = msg.value.split("").reverse().join("");
            // inputel.props['value'] = msg.value;
        })
        // console.log(inputel.props);
        return div(
            h1(`Str = ${this.str}`),
            inputel
        );
    }
}

let server = new jjjwebServer(ReversePage, { port: 3000 });