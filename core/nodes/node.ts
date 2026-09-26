import type Uncertain from "./uncertain"
import type { JExecutionState } from "../graph/execution_state"
import { JDrawEdge, JDrawing, JDrawNode } from "../graph/draw"
import type { JNodeResult } from "./node_result"
import { Question, Questions } from "@typesafe-ai/sdk"


export type JNodeEdge<TState extends object, Q extends Questions> = [
    JNode<TState, Q>,
    string
]

export interface JNodeParams {
    name?: string
    description?: string
    tags?: string[]
    shouldPrefetch?: boolean
    modifiesState?: boolean
}

/** Common contract implemented by every node in a Jev graph. */
abstract class JNode<TState extends object, Q extends Questions = {}> {

    public id : string
    public name?: string
    public description?: string
    public tags?: string[]
    public readonly shouldPrefetch: boolean = false
    public readonly modifiesState : boolean = false

    constructor(params: JNodeParams = {}) {
        this.id = crypto.randomUUID()
        this.name = params.name
        this.description = params.description
        this.tags = params.tags
        this.shouldPrefetch = params.shouldPrefetch ?? false
        this.modifiesState = params.modifiesState ?? false
    }

    /** Named API questions that can be prefetched for this node. */
    public apiQuestions(): Q | {} {
        return {}
    }

    protected projectQuestionState(state: TState): object {
        return state
    }

    protected callApi(
        state: Uncertain<TState>,
        executionState: JExecutionState<TState>
    ) {
        return executionState.callApi(
            this.apiQuestions(),
            this.projectQuestionState(state.value)
        )
    }

    public draw(drawing : JDrawing) : JDrawNode {

        if (drawing.isVisited(this)) {
            return drawing.visited.get(this) as JDrawNode
        } else {
            const node = new JDrawNode(this)
            drawing.add(node)
            const children = this.edges().map(([child, description]) => {
                const recursive = drawing.isVisited(child)
                return new JDrawEdge(
                    child.draw(drawing),
                    description,
                    recursive
                )
            })
            node.children = children
            return node
        }
        
    }

    public abstract edges(): Array<JNodeEdge<TState, Q>>

    public abstract eval(
        state: Uncertain<TState>,
        executionState: JExecutionState<TState>
    ): Promise<JNodeResult<TState>>
    
}


export default JNode
