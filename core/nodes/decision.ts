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


export type DecisionOptions<TState extends object> = Record<
    string,
    [Description, JNode<TState>]
>

export type MappedDecisionOptions<TState extends object> = (state : TState) => DecisionOptions<TState>

export type DecisionMapper<TState extends object> = (
    choice: string,
    state: TState
) => TState

export interface JDecisionParams<TState extends object> extends JNodeParams {
    question: string
    projection: (state: TState) => object
    options: DecisionOptions<TState> | MappedDecisionOptions<TState>
    mapper?: DecisionMapper<TState>
    questionName?: string
    confidencePolicy?: ConfidencePolicy
}


class JDecision<TState extends object> extends JNode<TState> {
    
    public questionName: string
    public question: string
    public fixedOptions: DecisionOptions<TState> | null
    public mappedOptions: MappedDecisionOptions<TState> | null

    public confidencePolicy: ConfidencePolicy

    constructor(params: JDecisionParams<TState>) {
        if (params.options instanceof Function) {
            params.shouldPrefetch = false
        } 
        super(params)
        this.question = params.question
        this.questionName = params.questionName ?? "question"
        this.confidencePolicy = params.confidencePolicy ?? multiplicativeConfidencePolicy
        this.projection = params.projection
        this.mapper = params.mapper

        if (params.options instanceof Function) {
            this.fixedOptions = null
            this.mappedOptions = params.options
        } else {
            this.fixedOptions = params.options
            this.mappedOptions = null
        }
        
    }

    private readonly projection: (state: TState) => object
    private readonly mapper?: DecisionMapper<TState>

    public apiQuestions(): ChoiceQuestion | {} {

        if (this.fixedOptions === null) {
            return {}
        }

        const inputOptions : Record<string, Description> = {}

        for (const [key, value] of Object.entries(this.fixedOptions)) {
            inputOptions[key] = value[0]
        }
        const question: ChoiceQuestion = {
                    type: "choice",
                    instructions: this.question,
                    criteria: inputOptions
        }

        return { [this.questionName]: question }
    }

    public async eval(
        state: Uncertain<TState>,
        executionState: JExecutionState<TState>
    ): Promise<JNodeResult<TState>> {

        const output = await this.callApi(state, executionState)

        const x =  output.answers[this.questionName] as ChoiceResponse

        const options = this.mappedOptions ? this.mappedOptions(state.value) : this.fixedOptions as DecisionOptions<TState>

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

    private mappingFor(choice: string): StateMapping<TState> {
        if (this.mapper === undefined) {
            return identityMapping
        }

        return state => this.mapper!(choice, state)
    }

    private mappingDependsOnState() : boolean {
        return typeof this.mapper === "function"
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

export default JDecision
