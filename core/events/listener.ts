import type { JExecutionState } from "../graph/execution_state";
import { JEvent, JEventData } from "./event";

export abstract class JListener<TAllowedStates extends object, TEventData extends JEventData> {

    private label: TEventData["label"]

    constructor(label: TEventData["label"]) {
        this.label = label
    }

    public abstract listen(state : JExecutionState<TAllowedStates>) : void 
    public shouldListen(event : JEvent<TAllowedStates, JEventData>) : boolean {
        return event.label == this.label
    }
    
}

