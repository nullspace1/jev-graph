import type JNode from "../nodes/node"
import type { Json } from "../nodes/node"
import type Uncertain from "../nodes/uncertain"

/**
 * Raised when a node receives a valid value for which it has no valid route.
 * The node and state are retained to make graph failures inspectable.
 */
class InvalidStateError<TAllowedStates extends object> extends Error {
    public readonly node: JNode<TAllowedStates>
    public readonly state: Uncertain<TAllowedStates>

    constructor(
        message: string,
        node: JNode<TAllowedStates>,
        state: Uncertain<TAllowedStates>
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
