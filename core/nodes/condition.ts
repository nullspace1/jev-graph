import JNode, { type JNodeParams } from "./node"
import type Uncertain from "./uncertain"
import type { JExecutionState } from "../graph/execution_state"
import type { JNodeResult } from "./node_result"
import { identityMapping, type StateMapping } from "./state-mapping"

export interface JConditionParams<TState extends object> extends JNodeParams {
    condition: (state: TState) => boolean
    yes: JNode<TState>
    no: JNode<TState>
}

/** Routes state locally according to a synchronous condition. */
class JCondition<TState extends object> extends JNode<TState> {
    private readonly condition: (state: TState) => boolean
    private readonly yes: JNode<TState>
    private readonly no: JNode<TState>

    constructor(params: JConditionParams<TState>) {
        super(params)
        this.condition = params.condition
        this.yes = params.yes
        this.no = params.no
    }

    public async eval(
        state: Uncertain<TState>,
        _executionState: JExecutionState<TState>
    ): Promise<JNodeResult<TState>> {
        return {
            state,
            node: this.condition(state.value) ? this.yes : this.no
        }
    }

    public edges(): [JNode<TState>, string, StateMapping<TState>][] {
        return [
            [this.yes, "yes", identityMapping],
            [this.no, "no", identityMapping]
        ]
    }
}

export default JCondition
