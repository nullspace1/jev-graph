import JNode from "../nodes/node";
import Uncertain from "../uncertain";

export class JEvent<T,U> {

    public node : JNode<T,U>
    public state : Uncertain<T>
    public timestamp : number

    constructor(node : JNode<T,U>, state : Uncertain<T>, timestamp : number) {
        this.node = node
        this.state = state
        this.timestamp = timestamp
    }
    

}
