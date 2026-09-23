import JNode from "./node"
import Uncertain from "../uncertain"
import type { JExecutionState } from "../graph/execution_state"
import {
    type ConfidencePolicy,
    multiplicativeConfidencePolicy
} from "../confidence-policy"

class JAction<T, U> extends JNode<T, U> {

    public action: (state: Uncertain<T>) => Uncertain<T>
    public node: JNode<T, U>
    public confidencePolicy: ConfidencePolicy

    constructor(
        action: (state: Uncertain<T>) => Uncertain<T>,
        node: JNode<T, U>,
        confidencePolicy: ConfidencePolicy = multiplicativeConfidencePolicy,
        name?: string,
        description?: string,
        tags?: string[]
    ) {
        super(name, description, tags)
        this.action = action
        this.node = node
        this.confidencePolicy = confidencePolicy
    }

    eval(state: Uncertain<T>, _executionState: JExecutionState<T, U>): Uncertain<U> {
        const result = this.action(state)
        return this.node.advance(result, _executionState)
    }

        public edges(): [JNode<T, U>, string][] {
        return [[this.node, this.description || "mapped"]]
    }

}

export default JAction
