import type JNode from "../nodes/node"
import Uncertain from "../nodes/uncertain"
import type JevApi from "../interface/api"
import type { JListener } from "../events/listener"
import { JExecutionState } from "./execution_state"
import { JConnectedNodes } from "./connected_nodes"
import { JDrawing } from "./draw"
import NodeEvalError from "../exceptions/node_eval"



class JGraph<TInput extends object, TAllowedStates extends TInput> {

    private readonly initialNode: JNode<TAllowedStates>
    private readonly api: JevApi
    private readonly listeners: Array<JListener<TAllowedStates>> = []

    constructor(initialNode: JNode<TAllowedStates>, api: JevApi) {
        this.initialNode = initialNode
        this.api = api
    }

    public async evaluate(state: TInput): Promise<[JExecutionState<TAllowedStates>, Uncertain<TAllowedStates>]> {
        let currentNode: JNode<TAllowedStates> | null = this.initialNode
        let currentState = Uncertain.from<TAllowedStates>(
            state as TAllowedStates
        )
        const executionState = new JExecutionState(
            currentNode,
            currentState,
            this.listeners,
            this.api
        )

        while (currentNode !== null) {
            try {
                executionState.traceNodeStart(currentNode, currentState)
                const connectedNodes = this.connectedNodesFor(currentNode)
                executionState.updateConnectedNodes(connectedNodes)

                const evaluatedNode : JNode<TAllowedStates> = currentNode
                const result = await evaluatedNode.eval(currentState, executionState)
                executionState.traceNodeEnd(evaluatedNode, result.state)
                currentNode = result.node
                currentState = result.state

                if (currentNode !== null) {
                    const nextConnectedNodes = this.connectedNodesFor(currentNode)
                    executionState.updateConnectedNodes(
                        nextConnectedNodes
                    )
                }
            } catch (e) {
                if (e instanceof Error) {
                    executionState.traceError(e)
                    throw new NodeEvalError(
                        executionState.getCurrentNode(),
                        executionState.getCurrentState(),
                        e
                    )
                }

                throw e
            }
        }

        return [executionState, currentState]

    }

    public draw(): JDrawing {
        const drawing = new JDrawing()
        this.initialNode.draw(drawing)
        return drawing
    }

    public addListener(listener: JListener<TAllowedStates>) {
        this.listeners.push(listener)
    }

    /** Finds the connected component whose nodes receive the same state value. */
    public nodesWithSameState(
        node: JNode<TAllowedStates>
    ): Set<JNode<TAllowedStates>> {
        const adjacency = this.sameStateAdjacency()
        const connectedNodes = new Set<JNode<TAllowedStates>>()
        const pending: JNode<TAllowedStates>[] = [node]

        while (pending.length > 0) {
            const current = pending.pop() as JNode<TAllowedStates>

            if (connectedNodes.has(current)) {
                continue
            }

            connectedNodes.add(current)

            for (const connectedNode of adjacency.get(current) ?? []) {
                pending.push(connectedNode)
            }
        }

        return connectedNodes
    }

    private connectedNodesFor(
        node: JNode<TAllowedStates>
    ): JConnectedNodes<TAllowedStates> {
        return new JConnectedNodes(this.nodesWithSameState(node))
    }

    private sameStateAdjacency(): Map<
        JNode<TAllowedStates>,
        Set<JNode<TAllowedStates>>
    > {
        const adjacency = new Map<
            JNode<TAllowedStates>,
            Set<JNode<TAllowedStates>>
        >()
        const visited = new Set<JNode<TAllowedStates>>()
        const pending: JNode<TAllowedStates>[] = [this.initialNode]

        while (pending.length > 0) {
            const current = pending.pop() as JNode<TAllowedStates>
            if (visited.has(current)) {
                continue
            }

            visited.add(current)
            this.ensureAdjacencyEntry(adjacency, current)

            if (!current.shouldPrefetch) {
                continue
            }

            for (const [nextNode] of current.edges()) {
                pending.push(nextNode)
                this.ensureAdjacencyEntry(adjacency, nextNode)
                if (!nextNode.modifiesState) {
                    adjacency.get(current)?.add(nextNode)
                    adjacency.get(nextNode)?.add(current)
                }
            }
        }

        return adjacency
    }

    private ensureAdjacencyEntry(
        adjacency: Map<JNode<TAllowedStates>, Set<JNode<TAllowedStates>>>,
        node: JNode<TAllowedStates>
    ): void {
        if (!adjacency.has(node)) {
            adjacency.set(node, new Set())
        }
    }

}

export default JGraph
