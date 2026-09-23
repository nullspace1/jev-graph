import type { JExecutionState } from "../graph/execution_state";

export interface JListener<T,U> {

    listen(state : JExecutionState<T,U>) : void 
    shouldListen(state : JExecutionState<T,U>) : boolean
    
}

