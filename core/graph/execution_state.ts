import type { JevOutput, Question } from "../../interface/dto"
import type JevApi from "../api"
import { JEvent } from "../events/event"
import type { JListener } from "../events/listener"
import type JNode from "../nodes/node"
import type Uncertain from "../uncertain"

export class JExecutionState<T,U> {

    private readonly eventLog: Array<JEvent<T,U>> = []
    private readonly listeners: Array<JListener<T,U>> 
    private currentNode : JNode<T,U>
    private currentState : Uncertain<T>
    private step : number = 0
    private inputTokenCount : number = 0
    private outputTokenCount : number = 0
    private readonly apiCallLog: Array<JevOutput> = []
    private readonly api: JevApi
    private error: { error: Error, step: number, node: JNode<T, U> } | null = null

    constructor(
        currentNode: JNode<T, U>,
        currentState: Uncertain<T>,
        listeners: Array<JListener<T, U>>,
        api: JevApi
    ) {
        this.currentNode = currentNode
        this.currentState = currentState
        this.listeners = listeners
        this.api = api
    }

    traceNewNode(node : JNode<T,U>, currentState : Uncertain<T>) : void {
        this.eventLog.push(new JEvent(node, currentState, Date.now()))
        this.currentNode = node
        this.currentState = currentState
        this.step++
        for (const listener of this.listeners) {
            if (listener.shouldListen(this)) {
                listener.listen(this)
            }
        }
    }

    callApi<TState>(state: TState, questions: Record<string, Question>): JevOutput {
        const output = this.api.call(state, questions)
        this.traceApiCall(output)
        return output
    }

    private traceApiCall(output : JevOutput) {
        this.apiCallLog.push(output)
        this.inputTokenCount += output.usage.input_tokens
        this.outputTokenCount += output.usage.output_tokens
    }

    getApiCallLog(): ReadonlyArray<JevOutput> {
        return this.apiCallLog
    }

    traceError(error: Error) : void {
        this.error = { error, step: this.step, node: this.currentNode }
    }

}
