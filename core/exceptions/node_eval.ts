import type JNode from "../nodes/node"
import type { Json } from "../nodes/node"
import type Uncertain from "../nodes/uncertain"

/** An error raised while evaluating a specific node and uncertain state. */
class NodeEvalError<TAllowedStates extends object> extends Error {
    public readonly node: JNode<TAllowedStates>
    public readonly state: Uncertain<TAllowedStates>
    public readonly cause: unknown

    constructor(
        node: JNode<TAllowedStates>,
        state: Uncertain<TAllowedStates>,
        cause: unknown
    ) {
        const causeMessage = cause instanceof Error
            ? cause.message
            : String(cause)
        const nodeName = node.name ?? node.id

        super(`Failed to evaluate node "${nodeName}": ${causeMessage}`)

        this.name = "NodeEvalError"
        this.node = node
        this.state = state
        this.cause = cause

        // Required when targeting JavaScript runtimes with imperfect Error subclassing.
        Object.setPrototypeOf(this, new.target.prototype)
    }
}

export default NodeEvalError
