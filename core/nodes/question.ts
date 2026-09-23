import type { NoulAnswer } from "../../interface/dto"
import JNode from "./node"
import type Uncertain from "../uncertain"
import type { JExecutionState } from "../graph/execution_state"
import {
    type ConfidencePolicy,
    multiplicativeConfidencePolicy
} from "../confidence-policy"

class JQuestion<T, U> extends JNode<T, U> {
    
    public question: string
    public questionName: string
    public criteriaForYes: string
    public criteriaForNo: string
    public yes: JNode<T, U>
    public no: JNode<T, U>
    public threshold: number
    public confidencePolicy: ConfidencePolicy

    constructor(
        question: string,
        yes: JNode<T, U>,
        no: JNode<T, U>,
        questionName?: string,
        criteriaForYes?: string,
        criteriaForNo?: string,
        threshold?: number,
        confidencePolicy: ConfidencePolicy = multiplicativeConfidencePolicy,
        name?: string,
        description?: string,
        tags?: string[]
    ) {
        super(name, description, tags)
        this.question = question
        this.yes = yes
        this.no = no
        this.questionName = questionName || "question"
        this.criteriaForYes = criteriaForYes || "Criteria for Yes"
        this.criteriaForNo = criteriaForNo || "Criteria for No"
        this.threshold = threshold || 0.5
        this.confidencePolicy = confidencePolicy
    }

    eval(state: Uncertain<T>, executionState: JExecutionState<T, U>): Uncertain<U> {

        const output = executionState.callApi(state.value, {
                [this.questionName]: {
                    type: "noul",
                    instructions: this.question,
                    criteria: {
                        true: "Yes",
                        false: "No"
                    }
                }
        })

        const x =  output.answers[this.questionName] as NoulAnswer

        if (x.answer > this.threshold) {
            const nextState = state.addUncertainty(x.answer, this.confidencePolicy)
            return this.yes.advance(nextState, executionState)
        } else {
            const nextState = state.addUncertainty(1 - x.answer, this.confidencePolicy)
            return this.no.advance(nextState, executionState)
        } 

    }

    public edges(): [JNode<T, U>, string][] {
        return [
            [this.yes, "yes"],
            [this.no, "no"]
        ]
    }

}

export default JQuestion
