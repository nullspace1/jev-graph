import type JNode from "../nodes/node"
import Uncertain from "../uncertain"
import type JevApi from "../api"
import type { JListener } from "../events/listener"
import { JExecutionState } from "./execution_state"
import { JDrawing, JDrawNode } from "./draw"



class JGraph<T, U> {

    private readonly initialNode: JNode<T, U>
    private readonly api: JevApi
    private readonly listeners: Array<JListener<T, U>> = []
    
    constructor(initialNode: JNode<T, U>, api: JevApi) {
        this.initialNode = initialNode
        this.api = api
    }

    public evaluate(state: T): [Uncertain<U>, JExecutionState<T, U>] {
        const uncertainState = new Uncertain(state, 1)
        const executionState = new JExecutionState<T, U>(
            this.initialNode,
            uncertainState,
            this.listeners,
            this.api
        )
        try {
        return [this.initialNode.advance(uncertainState, executionState), executionState]
        } catch (error) {
            throw error
        }
    }

    public draw(): JDrawing<T, U> {
        const drawing = new JDrawing<T,U>()
        this.initialNode.draw(drawing)
        return drawing
    }

}

export default JGraph
