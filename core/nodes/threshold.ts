import JNode, { type JNodeParams } from "./node"
import type Uncertain from "./uncertain"
import type { JExecutionState } from "../graph/execution_state"
import {
    type ConfidencePolicy,
    multiplicativeConfidencePolicy
} from "./confidence-policy"
import { JNodeResult } from "./node_result"

export interface JThresholdParams<TState extends object> extends JNodeParams {
    threshold: number
    accepted: JNode<TState>
    rejected: JNode<TState>
    confidencePolicy?: ConfidencePolicy
}

/** Routes evaluation according to the accumulated confidence. */
class JThreshold<TAllowedStates extends object> extends JNode<TAllowedStates> {
   
    public readonly threshold: number
    public readonly accepted: JNode<TAllowedStates>
    public readonly rejected: JNode<TAllowedStates>
    private readonly confidencePolicy: ConfidencePolicy

    constructor(params: JThresholdParams<TAllowedStates>) {
        super(params)
        this.threshold = params.threshold
        this.accepted = params.accepted
        this.rejected = params.rejected
        this.confidencePolicy = params.confidencePolicy ?? multiplicativeConfidencePolicy
        if (this.threshold < 0 || this.threshold > 1) {
            throw new RangeError("Threshold must be between 0 and 1")
        }
    }

    public async eval(
        state: Uncertain<TAllowedStates>,
        _executionState: JExecutionState<TAllowedStates>
    ): Promise<JNodeResult<TAllowedStates>> {
        const nextNode = state.confidence >= this.threshold
            ? this.accepted
            : this.rejected

        const nextState = state.addUncertainty(
            this.confidencePolicy.identity,
            this.confidencePolicy
        )

        return {
            state: nextState,
            node: nextNode
        }
    }

     public edges(): [JNode<TAllowedStates>, string][] {
        return [
            [this.accepted, `confidence >= ${this.threshold}`],
            [this.rejected, `confidence < ${this.threshold}`]
        ]
    }
}

export default JThreshold
