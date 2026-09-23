import type { ScoreAnswer } from "../../interface/dto"
import JNode from "./node"
import Uncertain from "../uncertain"
import type { JExecutionState } from "../graph/execution_state"
import {
    type ConfidencePolicy,
    multiplicativeConfidencePolicy
} from "../confidence-policy"
import InvalidStateError from "../exceptions/invalid_state"

class JScoring<T, U> extends JNode<T, U> {
    
    public questionName: string
    public question: string
    public options: string[]
    public action: Array<[number,number,JNode<T, U>]>
    public confidencePolicy: ConfidencePolicy

    constructor(
        question: string,
        options: string[],
        action: Array<[number,number,JNode<T, U>]>,
        questionName?: string,
        confidencePolicy: ConfidencePolicy = multiplicativeConfidencePolicy,
        name?: string,
        description?: string,
        tags?: string[]
    ) {
        super(name, description, tags)
        this.question = question
        this.options = options
        this.action = action
        this.questionName = questionName || "question"
        this.confidencePolicy = confidencePolicy
    }

    eval(state: Uncertain<T>, executionState: JExecutionState<T, U>): Uncertain<U> {

        const output = executionState.callApi(state.value, {
                [this.questionName]: {
                    type: "score",
                    instructions: this.question,
                    criteria: this.options
                }
        })

        const x =  output.answers[this.questionName] as ScoreAnswer

        const nextState = state.addUncertainty(x.confidence, this.confidencePolicy)

        for (const [min, max, next] of this.action) {
            if (x.score >= min && x.score <= max) {
                return next.advance(nextState, executionState)
            }
        }

        throw new InvalidStateError("No action for score " + x.score, this, state)

    }

    public edges(): [JNode<T, U>, string][] {
        return this.action.map(([min, max, next]) => [next, `${min} <= score <= ${max}`])
    }

}

export default JScoring
