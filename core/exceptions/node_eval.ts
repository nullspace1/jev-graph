import type JNode from "../nodes/node"
import type Uncertain from "../uncertain"

/** An error raised while evaluating a specific node and uncertain state. */
class NodeEvalError<T, U> extends Error {
    public readonly node: JNode<T, U>
    public readonly state: Uncertain<T>
    public readonly cause: unknown

    constructor(
        node: JNode<T, U>,
        state: Uncertain<T>,
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
