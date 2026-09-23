import JNode, { type Json } from "../nodes/node";
import Uncertain from "../nodes/uncertain";
import type { JevOutput } from "../interface/dto";

export interface JNodeStartEventData {
    type: "node_start"
    nodeId: string
    step: number
}

export interface JNodeEndEventData {
    type: "node_end"
    nodeId: string
    step: number
}

export interface JExceptionEventData {
    type: "exception"
    nodeId: string
    step: number
    name: string
    message: string
    stack?: string
}

export interface JApiCallEventData {
    type: "api_call"
    nodeId: string
    output: JevOutput
}

/** Serializable details for a recorded graph execution event. */
export type JEventData =
    | JNodeStartEventData
    | JNodeEndEventData
    | JExceptionEventData
    | JApiCallEventData

export class JEvent<TAllowedStates extends object> {

    public node : JNode<TAllowedStates>
    public state : Uncertain<TAllowedStates>
    public timestamp : number
    public data: JEventData

    constructor(
        node: JNode<TAllowedStates>,
        state: Uncertain<TAllowedStates>,
        timestamp: number,
        data: JEventData
    ) {
        this.node = node
        this.state = state
        this.timestamp = timestamp
        this.data = data
    }
    

}
