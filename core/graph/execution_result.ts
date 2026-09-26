import type { JEvent, JEventData } from "../events/event"
import type JNode from "../nodes/node"
import type Uncertain from "../nodes/uncertain"

/**
 * The user-facing outcome of a graph evaluation.
 *
 * This is deliberately separate from JExecutionState: the latter coordinates
 * graph execution and is passed to nodes and listeners while evaluation runs.
 */
export class JExecutionResult<TAllowedStates extends object> {
    public readonly state: Uncertain<TAllowedStates>
    public readonly events: ReadonlyArray<JEvent<TAllowedStates>>
    public readonly inputTokenCount: number
    public readonly outputTokenCount: number
    public readonly error: JExecutionError<TAllowedStates> | null

    constructor(params: JExecutionResultParams<TAllowedStates>) {
        this.state = params.state
        this.events = params.events
        this.inputTokenCount = params.inputTokenCount
        this.outputTokenCount = params.outputTokenCount
        this.error = params.error
    }

    public getEvents<J extends JEventData, T extends JEvent<TAllowedStates, J>>(label: J["label"]): T[] {
        return this.events.filter(event => event.label === label) as T[]
    }

}

export interface JExecutionError<TAllowedStates extends object> {
    error: Error
    step: number
    node: JNode<TAllowedStates>
}

export interface JExecutionResultParams<TAllowedStates extends object> {
    state: Uncertain<TAllowedStates>
    events: ReadonlyArray<JEvent<TAllowedStates>>
    inputTokenCount: number
    outputTokenCount: number
    error: JExecutionError<TAllowedStates> | null
}
