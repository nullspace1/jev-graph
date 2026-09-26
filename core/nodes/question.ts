import JNode, { type JNodeParams } from "./node"
import type Uncertain from "./uncertain"
import type { JExecutionState } from "../graph/execution_state"
import {
    type ConfidencePolicy,
    multiplicativeConfidencePolicy
} from "./confidence-policy"
import { JNodeResult } from "./node_result"
import { NoulQuestion, NoulResponse, Question } from "@typesafe-ai/sdk"

export interface QuestionDistribution {
    readonly yes: number
    readonly no: number
}

export type QuestionMapper<TState extends object> = (
    answer: boolean,
    distribution: QuestionDistribution,
    state: TState
) => TState

export interface JQuestionParams<TState extends object> extends JNodeParams {
    question: string
    projection: (state: TState) => object
    yes: JNode<TState>
    no: JNode<TState>
    questionName?: string
    criteriaForYes?: string
    criteriaForNo?: string
    threshold?: number
    confidencePolicy?: ConfidencePolicy
    yesMapping?: QuestionMapper<TState>
    noMapping?: QuestionMapper<TState>
}

type SingleNoulQuestion = {[x: string]: NoulQuestion}

class JQuestion<TState extends object> extends JNode<TState, SingleNoulQuestion> {
    
    public question: string
    public questionName: string
    public criteriaForYes: string
    public criteriaForNo: string
    public yes: JNode<TState>
    public no: JNode<TState>
    public threshold: number
    public confidencePolicy: ConfidencePolicy
    public yesMapping: QuestionMapper<TState>
    public noMapping: QuestionMapper<TState>

    constructor(params: JQuestionParams<TState>) {
        super(params)
        this.question = params.question
        this.yes = params.yes
        this.no = params.no
        this.questionName = params.questionName ?? "question"
        this.criteriaForYes = params.criteriaForYes ?? "Criteria for Yes"
        this.criteriaForNo = params.criteriaForNo ?? "Criteria for No"
        this.threshold = params.threshold ?? 0.5
        this.confidencePolicy = params.confidencePolicy ?? multiplicativeConfidencePolicy
        this.yesMapping = params.yesMapping ?? ((_answer, _distribution, state) => state)
        this.noMapping = params.noMapping ?? ((_answer, _distribution, state) => state)
        this.projection = params.projection
    }

    private readonly projection: (state: TState) => object

    public apiQuestions(): SingleNoulQuestion {
        const question: Question = {
                type: "noul",
                instructions: this.question,
                criteria: {
                    true: this.criteriaForYes,
                    false: this.criteriaForNo
                }
        }

        return { [this.questionName]: question }
    }

    public async eval(
        state: Uncertain<TState>,
        executionState: JExecutionState<TState>
    ): Promise<JNodeResult<TState>> {

        const output = await this.callApi(state, executionState)

        const x =  output.answers[this.questionName] as NoulResponse
        const distribution: QuestionDistribution = {
            yes: x.noul,
            no: 1 - x.noul
        }

        if (x.noul > this.threshold) {
            const nextState = state.addUncertainty(x.noul, this.confidencePolicy)
            return {
                node: this.yes,
                state: nextState.apply(state => this.yesMapping(true, distribution, state))
            }
        } else {
            const nextState = state.addUncertainty(1 - x.noul, this.confidencePolicy)
            return {
                node: this.no,
                state: nextState.apply(state => this.noMapping(false, distribution, state))
            }
        } 

    }

    protected projectQuestionState(state: TState): object {
        return this.projection(state)
    }

    public edges(): [JNode<TState>, string][] {
        return [
            [this.yes, "yes"],
            [this.no, "no"]
        ]
    }

}

export default JQuestion
