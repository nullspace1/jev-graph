import type JNode from "../nodes/node"
import type Uncertain from "../uncertain"

/**
 * Raised when a node receives a valid value for which it has no valid route.
 * The node and state are retained to make graph failures inspectable.
 */
class InvalidStateError<T, U> extends Error {
    public readonly node: JNode<T, U>
    public readonly state: Uncertain<T>

    constructor(
        message: string,
        node: JNode<T, U>,
        state: Uncertain<T>
    ) {
        super(message)
        this.name = "InvalidStateError"
        this.node = node
        this.state = state

        // Required when targeting JavaScript runtimes with imperfect Error subclassing.
        Object.setPrototypeOf(this, new.target.prototype)
    }
}

export default InvalidStateError
