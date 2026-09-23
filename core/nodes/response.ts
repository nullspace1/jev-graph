import JNode from "./node"
import Uncertain from "../uncertain"
import type { JExecutionState } from "../graph/execution_state"
import {
    type ConfidencePolicy,
    multiplicativeConfidencePolicy
} from "../confidence-policy"

class JResponse<T> extends JNode<T, T> {
    
    constructor(
        private readonly confidencePolicy: ConfidencePolicy = multiplicativeConfidencePolicy,
        name?: string,
        description?: string,
        tags?: string[]
    ) {
        super(name, description, tags)
    }

    eval(state: Uncertain<T>, _executionState: JExecutionState<T, T>): Uncertain<T> {
        return new Uncertain(
            state.value,
            this.confidencePolicy.combine(
                state.confidence,
                this.confidencePolicy.identity
            )
        )
    }

    public edges(): [JNode<T, T>, string][] {
        return []
    }

}


export default JResponse
