import type JevApi from "../interface/api"
import {
    JEvent,
    type JApiCallEventData,
    type JEventData
} from "../events/event"
import type { JListener } from "../events/listener"
import type JNode from "../nodes/node"
import type Uncertain from "../nodes/uncertain"
import { JAnswerCache } from "./answer_cache"
import { JConnectedNodes } from "./connected_nodes"
import { Question, Questions, SystemOneResult } from "@typesafe-ai/sdk"
import {
    JExecutionResult,
    type JExecutionError
} from "./execution_result"
import APIError from "../exceptions/api_error"

export class JExecutionState<TAllowedStates extends object> {

    private readonly eventLog: Array<JEvent<TAllowedStates>> = []
    private readonly listeners: Array<JListener<TAllowedStates>> 
    private currentNode: JNode<TAllowedStates>
    private currentState: Uncertain<TAllowedStates>
    private step : number = 0
    private connectedNodes: JConnectedNodes<TAllowedStates> | null = null
    private readonly answerCache = new JAnswerCache<TAllowedStates>()
    private inputTokenCount: number = 0
    private outputTokenCount: number = 0
    private readonly api: JevApi
    private error: JExecutionError<TAllowedStates> | null = null

    constructor(
        currentNode: JNode<TAllowedStates>,
        currentState: Uncertain<TAllowedStates>,
        listeners: Array<JListener<TAllowedStates>>,
        api: JevApi
    ) {
        this.currentNode = currentNode
        this.currentState = currentState
        this.listeners = listeners
        this.api = api
    }

    public updateConnectedNodes(
        connectedNodes: JConnectedNodes<TAllowedStates>
    ): void {
        if (connectedNodes.equals(this.connectedNodes)) {
            return
        }
        this.connectedNodes = connectedNodes
    }

    public async callApi(
        questions: Record<string, Question>,
        projectedState: object
    ): Promise<SystemOneResult<Questions>> {
        let fetchedOutput: SystemOneResult<Questions> | null = null
        const questionsToFetch = this.questionsToPrefetch(
            projectedState,
            questions
        )

        if (Object.keys(questionsToFetch).length > 0) {
            fetchedOutput = await this.fetchAndCacheForCurrentNode(
                projectedState,
                questionsToFetch
            )
        }

        return this.answerCache.outputFor(
            projectedState,
            this.currentNode,
            questions,
            fetchedOutput?.model ?? this.api.model,
            fetchedOutput?.usage ?? {
                input_tokens: 0,
                output_tokens: 0
            }
        )
    }

    private async fetchAndCacheForCurrentNode(
        projectedState: object,
        questions: Record<string, Question>
    ): Promise<SystemOneResult<Questions>> {
        let output: SystemOneResult<Questions>
        try {
            output = await this.api.call(projectedState, questions)
        } catch (error) {
            throw new APIError(this.api, error)
        }

        this.answerCache.store(projectedState, output)

        this.traceApiCall(output)
        return output
    }

    private questionsToPrefetch(
        projectedState: object,
        requestedQuestions: Record<string, Question>
    ): Record<string, Question> {
        const nodes = this.connectedNodes?.nodes ?? new Set([this.currentNode])
        const questions = this.answerCache.questionsToFetch(projectedState, nodes)

        for (const [questionName, question] of Object.entries(requestedQuestions)) {
            const key = JConnectedNodes.questionKey(this.currentNode, questionName)
            if (!this.answerCache.hasAnswersFor(projectedState, this.currentNode, {
                [questionName]: question
            })) {
                questions[key] = question
            }
        }

        return questions
    }

    private traceApiCall(output: SystemOneResult<Questions>): void {
        const data: JApiCallEventData = {
            type: "api_call",
            nodeId: this.currentNode.id,
            output
        }
        this.recordEvent(this.currentNode, this.currentState, data)
        this.inputTokenCount += output.usage.input_tokens
        this.outputTokenCount += output.usage.output_tokens
    }

    traceNodeStart(
        node: JNode<TAllowedStates>,
        currentState: Uncertain<TAllowedStates>
    ): void {
        this.currentNode = node
        this.currentState = currentState
        this.recordEvent(node, currentState, {
            type: "node_start",
            nodeId: node.id,
            step: this.step
        })
        for (const listener of this.listeners) {
            if (listener.shouldListen(this)) {
                listener.listen(this)
            }
        }
    }

    traceNodeEnd(
        node: JNode<TAllowedStates>,
        currentState: Uncertain<TAllowedStates>
    ): void {
        this.recordEvent(node, currentState, {
            type: "node_end",
            nodeId: node.id,
            step: this.step
        })
        this.step++
    }

    traceError(error: Error) : void {
        this.error = { error, step: this.step, node: this.currentNode }
        this.recordEvent(this.currentNode, this.currentState, {
            type: "exception",
            nodeId: this.currentNode.id,
            step: this.step,
            name: error.name,
            message: error.message,
            ...(error.stack === undefined ? {} : { stack: error.stack })
        })
    }

    private recordEvent(
        node: JNode<TAllowedStates>,
        state: Uncertain<TAllowedStates>,
        data: JEventData
    ): void {
        this.eventLog.push(new JEvent(node, state, Date.now(), data))
    }

    getCurrentNode(): JNode<TAllowedStates> {
        return this.currentNode
    }

    getCurrentState(): Uncertain<TAllowedStates> {
        return this.currentState
    }

    getConnectedNodes(): JConnectedNodes<TAllowedStates> | null {
        return this.connectedNodes
    }

    getEventLog(): ReadonlyArray<JEvent<TAllowedStates>> {
        return this.eventLog
    }

    getError() : JExecutionError<TAllowedStates> | null {
        return this.error
    }

    /** Creates a stable, user-facing snapshot after graph evaluation finishes. */
    toResult(state: Uncertain<TAllowedStates>): JExecutionResult<TAllowedStates> {
        return new JExecutionResult({
            state,
            events: [...this.eventLog],
            inputTokenCount: this.inputTokenCount,
            outputTokenCount: this.outputTokenCount,
            error: this.error
        })
    }

}
