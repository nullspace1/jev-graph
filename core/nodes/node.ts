import type Uncertain from "../uncertain"
import type { JExecutionState } from "../graph/execution_state"
import { JDrawEdge, JDrawing, JDrawNode } from "../graph/draw"
import NodeEvalError from "../exceptions/node_eval"

/** Common contract implemented by every node in a Jev graph. */
abstract class JNode<TState, TResult> {

    public id : string
    public name?: string
    public description?: string
    public tags?: string[]

    constructor(name?: string, description?: string, tags?: string[]) {
        this.id = crypto.randomUUID()
        this.name = name
        this.description = description
        this.tags = tags
    }

    public advance(state: Uncertain<TState>, jExecutionState : JExecutionState<TState, TResult>): Uncertain<TResult> {

        try {
            jExecutionState.traceNewNode(this, state)
            return this.eval(state, jExecutionState)
        } catch (error: unknown) {
            if (error instanceof NodeEvalError) {
                throw error
            }

            const nodeEvalError = new NodeEvalError(this, state, error)
            jExecutionState.traceError(nodeEvalError)
            throw nodeEvalError
        }
    }

    public draw(drawing : JDrawing<TState, TResult>) : JDrawNode<TState, TResult> {

        if (drawing.isVisited(this)) {
            return drawing.visited.get(this) as JDrawNode<TState, TResult>
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

    public abstract edges() : Array<[JNode<TState, TResult>, string]>
    

    protected abstract eval(state: Uncertain<TState>, jExecutionState : JExecutionState<TState, TResult>): Uncertain<TResult>
    
}

export default JNode
