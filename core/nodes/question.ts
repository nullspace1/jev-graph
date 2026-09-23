import JNode, { type JNodeParams } from "./node"
import type Uncertain from "./uncertain"
import type { JExecutionState } from "../graph/execution_state"
import {
    type ConfidencePolicy,
    multiplicativeConfidencePolicy
} from "./confidence-policy"
import { JNodeResult } from "./node_result"
import { identityMapping, type StateMapping } from "./state-mapping"
import { NoulQuestion, NoulResponse, Question } from "@typesafe-ai/sdk"

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
    yesMapping?: StateMapping<TState>
    noMapping?: StateMapping<TState>
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
    public yesMapping: StateMapping<TState>
    public noMapping: StateMapping<TState>

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
        this.yesMapping = params.yesMapping ?? identityMapping
        this.noMapping = params.noMapping ?? identityMapping
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

        if (x.noul > this.threshold) {
            const nextState = state.addUncertainty(x.noul, this.confidencePolicy)
            return {
                node: this.yes,
                state: nextState.apply(this.yesMapping)
            }
        } else {
            const nextState = state.addUncertainty(1 - x.noul, this.confidencePolicy)
            return {
                node: this.no,
                state: nextState.apply(this.noMapping)
            }
        } 

    }

    protected projectQuestionState(state: TState): object {
        return this.projection(state)
    }

    public edges(): [JNode<TState>, string, StateMapping<TState>][] {
        return [
            [this.yes, "yes", this.yesMapping],
            [this.no, "no", this.noMapping]
        ]
    }

}

export default JQuestion
