import JNode from "../nodes/node"


export class JDrawNode<T,U> {

    public node : JNode<T,U>
    public children : Array<JDrawEdge<T,U>>

    constructor(node : JNode<T,U>, children : Array<JDrawEdge<T,U>> = []) {
        this.node = node
        this.children = children
    }

}

export class JDrawEdge<T,U> {

    public target : JDrawNode<T,U>
    public description : string
    public recursive : boolean

    constructor(
        target : JDrawNode<T,U>,
        description : string,
        recursive : boolean = false
    ) {
        this.target = target
        this.description = description
        this.recursive = recursive
    }

}

export class JDrawing<T,U> {

    public root : JDrawNode<T,U> | null
    public visited : Map<JNode<T,U>, JDrawNode<T,U>> = new Map()

    constructor() {
        this.root = null
    }

    isVisited(node : JNode<T,U>) : boolean {
        return this.visited.has(node)
    }

    add(node : JDrawNode<T,U>) {
        if (this.root === null) {
            this.root = node
        }
        this.visited.set(node.node, node)
    }

    getRoot() : JDrawNode<T,U> | null {
        return this.root
    }

}
