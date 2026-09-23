import JNode from "./node"
import type Uncertain from "../uncertain"
import type { JExecutionState } from "../graph/execution_state"
import {
    type ConfidencePolicy,
    multiplicativeConfidencePolicy
} from "../confidence-policy"

/** Routes evaluation according to the accumulated confidence. */
class JThreshold<T, U> extends JNode<T, U> {
   
    constructor(
        public readonly threshold: number,
        public readonly accepted: JNode<T, U>,
        public readonly rejected: JNode<T, U>,
        private readonly confidencePolicy: ConfidencePolicy = multiplicativeConfidencePolicy,
        name?: string,
        description?: string,
        tags?: string[]
    ) {
        super(name, description, tags)
        if (threshold < 0 || threshold > 1) {
            throw new RangeError("Threshold must be between 0 and 1")
        }
    }

    eval(state: Uncertain<T>, executionState: JExecutionState<T, U>): Uncertain<U> {
        const nextNode = state.confidence >= this.threshold
            ? this.accepted
            : this.rejected

        // A threshold only routes the state; it does not add uncertainty.
        const nextState = state.addUncertainty(
            this.confidencePolicy.identity,
            this.confidencePolicy
        )

        return nextNode.advance(nextState, executionState)
    }

     public edges(): [JNode<T, U>, string][] {
        return [
            [this.accepted, `confidence >= ${this.threshold}`],
            [this.rejected, `confidence < ${this.threshold}`]
        ]
    }
}

export default JThreshold
