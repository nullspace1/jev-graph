import type { JExecutionState } from "../graph/execution_state";
import type { Json } from "../nodes/node";

export interface JListener<TAllowedStates extends object> {

    listen(state : JExecutionState<TAllowedStates>) : void 
    shouldListen(state : JExecutionState<TAllowedStates>) : boolean
    
}

