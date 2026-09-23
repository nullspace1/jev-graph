import type Uncertain from "./uncertain"
import type JNode from "./node"


export interface JNodeResult<TAllowedStates extends object> {
    state: Uncertain<TAllowedStates>
    node: JNode<TAllowedStates> | null
}
