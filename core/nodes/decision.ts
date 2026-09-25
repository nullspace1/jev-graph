import JNode, { type JNodeParams } from "./node"
import Uncertain from "./uncertain"
import type { JExecutionState } from "../graph/execution_state"
import {
    type ConfidencePolicy,
    multiplicativeConfidencePolicy
} from "./confidence-policy"
import type { JNodeResult } from "./node_result"
import { identityMapping, type StateMapping } from "./state-mapping"
import { ChoiceQuestion, ChoiceResponse, Description, Question } from "@typesafe-ai/sdk"


export type ChoiceOptions<TState extends object> = Record<
    string,
    [Description, JNode<TState>]
>

export type MappedChoiceOptions<TState extends object> = (state : TState) => ChoiceOptions<TState>

export type ChoiceMapper<TState extends object> = (
    choice: string,
    state: TState
) => TState

export interface JDecisionParams<TState extends object> extends JNodeParams {
    question: string
    projection?: (state: TState) => object
    options: ChoiceOptions<TState> | MappedChoiceOptions<TState>
    mapper?: ChoiceMapper<TState>
    questionName?: string
    confidencePolicy?: ConfidencePolicy
}


class JChoice<TState extends object> extends JNode<TState> {
    
    public questionName: string
    public question: string
    public fixedOptions: ChoiceOptions<TState> | null
    public mappedOptions: MappedChoiceOptions<TState> | null

    public confidencePolicy: ConfidencePolicy

    constructor(params: JDecisionParams<TState>) {
        if (params.options instanceof Function) {
            params.shouldPrefetch = false
        } 
        super(params)
        this.question = params.question
        this.questionName = params.questionName ?? "question"
        this.confidencePolicy = params.confidencePolicy ?? multiplicativeConfidencePolicy
        this.projection = params.projection ?? (state => state)
        this.mapper = params.mapper

        if (params.options instanceof Function) {
            this.fixedOptions = null
            this.mappedOptions = params.options
        } else {
            if (Object.keys(params.options).length === 0) {
                throw new RangeError("Decision options cannot be empty")
            }
            this.fixedOptions = params.options
            this.mappedOptions = null
        }
        
    }

    private readonly projection: (state: TState) => object
    private readonly mapper?: ChoiceMapper<TState>

    public apiQuestions(): ChoiceQuestion | {} {

        if (this.fixedOptions === null) {
            return {}
        }

        return this.questionFor(this.fixedOptions)
    }

    public async eval(
        state: Uncertain<TState>,
        executionState: JExecutionState<TState>
    ): Promise<JNodeResult<TState>> {

        const options = this.mappedOptions ? this.mappedOptions(state.value) : this.fixedOptions as ChoiceOptions<TState>
        if (Object.keys(options).length === 0) {
            throw new RangeError("Decision options cannot be empty")
        }

        const output = this.mappedOptions === null
            ? await this.callApi(state, executionState)
            : await executionState.callApi(
                this.questionFor(options),
                this.projectQuestionState(state.value)
            )

        const x = output.answers[this.questionName] as ChoiceResponse

        const nextState = state.addUncertainty(x.confidence, this.confidencePolicy)
        const [_, node] = options[x.choice]

        return {
            node: node,
            state: nextState.apply(this.mappingFor(x.choice))
        }

    }

    protected projectQuestionState(state: TState): object {
        return this.projection(state)
    }

    private questionFor(options: ChoiceOptions<TState>): Record<string, ChoiceQuestion> {
        const criteria: Record<string, Description> = {}

        for (const [key, value] of Object.entries(options)) {
            criteria[key] = value[0]
        }

        return {
            [this.questionName]: {
                type: "choice",
                instructions: this.question,
                criteria
            }
        }
    }

    private mappingFor(choice: string): StateMapping<TState> {
        if (this.mapper === undefined) {
            return identityMapping
        }

        return state => this.mapper!(choice, state)
    }

    public edges(): [JNode<TState>, string, StateMapping<TState>][] {
        if (this.fixedOptions === null) {
            return []
        }
        const res: [JNode<TState>, string, StateMapping<TState>][] = []
        for (const [key, value] of Object.entries(this.fixedOptions)) {
            const node = value[1]
            res.push([node, key, this.mappingFor(key)])
        }
        return res
    }


}

export default JChoice
