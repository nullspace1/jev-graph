import { Questions, SystemOneResult } from "@typesafe-ai/sdk";
import JNode from "../nodes/node";
import Uncertain from "../nodes/uncertain";

export interface JNodeStartEventData {
    label: "node_start",
    data: {nodeId: string
    step: number}
}

export interface JNodeEndEventData {
    label: "node_end",
    data: {nodeId: string
    step: number}
}

export interface JExceptionEventData {
    label: "exception",
    data: {nodeId: string
    step: number
    name: string
    message: string
    stack?: string}
}

export interface JApiCallEventData {
    label: "api_call",
    data: {nodeId: string
            output: SystemOneResult<Questions>}
}
export type JEventData = JNodeStartEventData | JNodeEndEventData | JExceptionEventData | JApiCallEventData


export class JEvent<TAllowedStates extends object, TEventData extends JEventData = JEventData> {

    public node : JNode<TAllowedStates>
    public state : Uncertain<TAllowedStates>
    public timestamp : number
    public data: TEventData["data"]
    public label: TEventData["label"]

    constructor(
        node: JNode<TAllowedStates>,
        state: Uncertain<TAllowedStates>,
        timestamp: number,
        data: TEventData["data"],
        label: TEventData["label"]
    ) {
        this.node = node
        this.state = state
        this.timestamp = timestamp
        this.data = data
        this.label = label
    }

    

}
