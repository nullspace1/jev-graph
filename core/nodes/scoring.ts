import JNode, { type JNodeParams } from "./node"
import Uncertain from "./uncertain"
import type { JExecutionState } from "../graph/execution_state"
import {
    type ConfidencePolicy,
    multiplicativeConfidencePolicy
} from "./confidence-policy"
import InvalidStateError from "../exceptions/invalid_state"
import { JNodeResult } from "./node_result"
import { identityMapping, type StateMapping } from "./state-mapping"
import { Question, ScoreCriteria, ScoreQuestion, ScoreResponse } from "@typesafe-ai/sdk"

export type ScoreAction<TState extends object> = [
    number,
    JNode<TState>
]

export type ScoreDistribution<C extends ScoreCriteria> = ScoreResponse<C>["probabilities"]

export type ScoreMapper<TState extends object, C extends ScoreCriteria> = (
    score: number,
    distribution: ScoreDistribution<C>,
    state: TState
) => TState

export interface JScoringParams<TState extends object, C extends ScoreCriteria> extends JNodeParams {
    question: string
    projection: (state: TState) => object
    options: C
    action: ScoreAction<TState>[]
    mapper?: ScoreMapper<TState, C>
    questionName?: string
    confidencePolicy?: ConfidencePolicy
}

type SingleScoringQuestion<T extends ScoreCriteria> = {[key: string]: ScoreQuestion<T> }

class JScoring<TState extends object, C extends ScoreCriteria> extends JNode<TState, SingleScoringQuestion<C>> {
    
    public questionName: string
    public question: string
    public options: C
    public action: Array<ScoreAction<TState>>
    public confidencePolicy: ConfidencePolicy

    constructor(params: JScoringParams<TState, C>) {
        super(params)
        this.question = params.question
        this.options = params.options
        this.action = params.action
        this.validateActionStarts()
        this.questionName = params.questionName ?? "question"
        this.confidencePolicy = params.confidencePolicy ?? multiplicativeConfidencePolicy
        this.projection = params.projection
        this.mapper = params.mapper
    }

    private readonly projection: (state: TState) => object
    private readonly mapper?: ScoreMapper<TState, C>

    public apiQuestions(): SingleScoringQuestion<C> {
        const question: ScoreQuestion<C> = {
                    type: "score",
                    instructions: this.question,
                    criteria: this.options
        }

        return { [this.questionName]: question }
    }

    public async eval(
        state: Uncertain<TState>,
        executionState: JExecutionState<TState>
    ): Promise<JNodeResult<TState>> {

        const output = await this.callApi(state, executionState)

        const x = output.answers[this.questionName] as ScoreResponse<C>

        const nextState = state.addUncertainty(x.confidence, this.confidencePolicy)

        const action = this.action
            .filter(([start]) => x.score >= start)
            .at(-1)

        if (action !== undefined) {
            return {
                state: nextState.apply(this.mappingFor(x.score, x.probabilities)),
                node: action[1]
            }
        }

        throw new InvalidStateError("No action for score " + x.score, this, state)

    }

    protected projectQuestionState(state: TState): object {
        return this.projection(state)
    }

    private mappingFor(
        score: number,
        distribution: ScoreDistribution<C> = {} as ScoreDistribution<C>
    ): StateMapping<TState> {
        if (this.mapper === undefined) {
            return identityMapping
        }

        return state => this.mapper!(score, distribution, state)
    }

    private validateActionStarts(): void {
        if (this.action.length === 0) {
            throw new RangeError("Scoring actions cannot be empty")
        }

        if (this.action[0][0] !== 0) {
            throw new RangeError("The first scoring action must start at 0")
        }

        for (let index = 1; index < this.action.length; index++) {
            if (this.action[index - 1][0] >= this.action[index][0]) {
                throw new RangeError("Scoring action starts must be strictly ascending")
            }
        }
    }

    public edges(): [JNode<TState>, string][] {
        return this.action.map(([start, next]) => [
            next,
            `score >= ${start}`
        ])
    }

}

export default JScoring
