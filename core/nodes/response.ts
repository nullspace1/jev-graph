import JNode, { type JNodeParams } from "./node"
import Uncertain from "./uncertain"
import type { JExecutionState } from "../graph/execution_state"
import {
    type ConfidencePolicy,
    multiplicativeConfidencePolicy
} from "./confidence-policy"
import { JNodeResult } from "./node_result"

export interface JResponseParams extends JNodeParams {
    confidencePolicy?: ConfidencePolicy
}

class JResponse<TAllowedStates extends object> extends JNode<TAllowedStates> {
    
    constructor(params: JResponseParams = {}) {
        super(params)
        this.confidencePolicy = params.confidencePolicy ?? multiplicativeConfidencePolicy
    }

    private readonly confidencePolicy: ConfidencePolicy

    public async eval(
        state: Uncertain<TAllowedStates>,
        _executionState: JExecutionState<TAllowedStates>
    ): Promise<JNodeResult<TAllowedStates>> {
       return  {
            state: new Uncertain(
            state.value,
            this.confidencePolicy.combine(
                state.confidence,
                this.confidencePolicy.identity
            )
        ),
        node: null
    }
}

    public edges(): [JNode<TAllowedStates>, string][] {
        return []
    }

}


export default JResponse
