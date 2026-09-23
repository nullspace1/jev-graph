import JNode from "../nodes/node"


export class JDrawNode {

    public node : JNode<any>
    public children : Array<JDrawEdge>

    constructor(node : JNode<any>, children : Array<JDrawEdge> = []) {
        this.node = node
        this.children = children
    }

}

export class JDrawEdge {

    public target : JDrawNode
    public description : string
    public recursive : boolean

    constructor(
        target : JDrawNode,
        description : string,
        recursive : boolean = false
    ) {
        this.target = target
        this.description = description
        this.recursive = recursive
    }

}

export class JDrawing {

    public root : JDrawNode | null
    public visited : Map<JNode<any>, JDrawNode> = new Map()

    constructor() {
        this.root = null
    }

    isVisited(node : JNode<any>) : boolean {
        return this.visited.has(node)
    }

    add(node : JDrawNode) {
        if (this.root === null) {
            this.root = node
        }
        this.visited.set(node.node, node)
    }

    getRoot() : JDrawNode | null {
        return this.root
    }

}
