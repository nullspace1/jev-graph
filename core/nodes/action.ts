import JNode, { type JNodeParams } from "./node"
import type Uncertain from "./uncertain"
import type { JExecutionState } from "../graph/execution_state"
import {
    type ConfidencePolicy,
    multiplicativeConfidencePolicy
} from "./confidence-policy"
import type { JNodeResult } from "./node_result"

export interface JActionParams<TState extends object> extends JNodeParams {
    action: (state: TState) => TState
    node: JNode<TState>
}

/** Transforms one allowed graph state into another allowed graph state. */
class JAction<TState extends object> extends JNode<TState, {}> {

    public action: (state: TState) => TState
    public node: JNode<TState>

    constructor(params: JActionParams<TState>) {
        super({ ...params, shouldPrefetch: params.shouldPrefetch ?? true })
        this.action = params.action
        this.node = params.node
    }

    public async eval(
        state: Uncertain<TState>,
        _executionState: JExecutionState<TState>
    ): Promise<JNodeResult<TState>> {
        const nextState = state.apply(this.action)
        return {
            node: this.node,
            state: nextState
        }
    }

    public edges(): [JNode<TState>, string][] {
        return [[
            this.node,
            this.description || "mapped"
        ]]
    }

}

export default JAction
