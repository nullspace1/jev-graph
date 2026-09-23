import type { ChoiceAnswer } from "../../interface/dto"
import JNode from "./node"
import Uncertain from "../uncertain"
import type { JExecutionState } from "../graph/execution_state"
import {
    type ConfidencePolicy,
    multiplicativeConfidencePolicy
} from "../confidence-policy"


type DecisionOptions<T, U> = Record<string, [string | null, JNode<T, U>]>


class JDecision<T, U> extends JNode<T, U> {
    
    public questionName: string
    public question: string
    public options: DecisionOptions<T,U>
    public confidencePolicy: ConfidencePolicy

    constructor(
        question: string,
        options: DecisionOptions<T, U>,
        questionName?: string,
        confidencePolicy: ConfidencePolicy = multiplicativeConfidencePolicy,
        name?: string,
        description?: string,
        tags?: string[]
    ) {
        super(name, description, tags)
        this.question = question
        this.options = options
        this.questionName = questionName || "question"
        this.confidencePolicy = confidencePolicy
    }

    eval(state: Uncertain<T>, executionState: JExecutionState<T, U>): Uncertain<U> {

        const inputOptions : Record<string,string | null> = {}

        for (const [key, value] of Object.entries(this.options)) {
            inputOptions[key] = value[0]
        }

        const output = executionState.callApi(state.value, {
                [this.questionName]: {
                    type: "choice",
                    instructions: this.question,
                    criteria: inputOptions
                }
        })

        const x =  output.answers[this.questionName] as ChoiceAnswer

        const nextState = state.addUncertainty(x.confidence, this.confidencePolicy)

        return this.options[x.choice][1].advance(nextState, executionState)

    }

    public edges(): [JNode<T, U>, string][] {
        const res: [JNode<T, U>, string][] = []
        for (const [key, value] of Object.entries(this.options)) {
            const node = value[1]
            res.push([node, key])
        }
        return res
    }


}

export default JDecision
