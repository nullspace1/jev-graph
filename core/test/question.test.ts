import JQuestion from "../nodes/question"
import JGraph from "../graph/graph"
import JResponse from "../nodes/response"
import { answerForOnlyQuestion, RecordingApi } from "./support"

interface State { value: number, branch?: "yes" | "no" }

describe("JQuestion", () => {
    it.each([
        [0.8, "yes", 0.8],
        [0.3, "no", 0.7]
    ] as const)("routes noul %s to %s with correct confidence", async (noul, branch, confidence) => {
        let distribution: { yes: number, no: number } | undefined
        const api = new RecordingApi(questions => answerForOnlyQuestion(questions, {
            noul,
            confidence: 0.4
        }))
        const question = new JQuestion<State>({
            question: "Is this valid?",
            questionName: "valid",
            criteriaForYes: "yes criterion",
            criteriaForNo: "no criterion",
            projection: state => ({ value: state.value }),
            threshold: 0.5,
            yes: new JResponse(),
            no: new JResponse(),
            yesMapping: (_answer, probabilities, state) => {
                distribution = probabilities
                return { ...state, branch: "yes" }
            },
            noMapping: (_answer, probabilities, state) => {
                distribution = probabilities
                return { ...state, branch: "no" }
            }
        })

        const result = await new JGraph(question, api).evaluate({ value: 4 })

        expect(Object.values(api.calls[0].questions)[0]).toEqual({
            type: "noul",
            instructions: "Is this valid?",
            criteria: { true: "yes criterion", false: "no criterion" }
        })
        expect(result.state.value.branch).toBe(branch)
        expect(result.state.confidence).toBe(confidence)
        expect(distribution).toEqual({ yes: noul, no: 1 - noul })
    })
})
